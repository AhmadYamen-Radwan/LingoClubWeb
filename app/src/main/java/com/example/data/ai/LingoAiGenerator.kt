package com.example.data.ai

import android.util.Log
import com.example.data.model.CefrLevel
import com.example.data.model.HighlightedPhrase
import com.example.data.model.QuizQuestionItem
import com.example.data.model.RoleplayLine
import com.example.data.model.RoleplayScenario
import com.google.firebase.Firebase
import com.google.firebase.ai.GenerativeModel
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.RequestOptions
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.ThinkingLevel
import com.google.firebase.ai.type.generationConfig
import com.google.firebase.ai.type.thinkingConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

data class GeneratedQuizDraft(
    val title: String,
    val topic: String,
    val cefrLevel: CefrLevel,
    val questions: List<QuizQuestionItem>
)

data class RoleplaySpeechFeedback(
    val score: Int,
    val summary: String,
    val clarityFeedback: String,
    val naturalnessFeedback: String,
    val suggestedLine: String,
    val practiceTip: String
)

class LingoAiGenerator {

    private val quizSchema = Schema.obj(
        properties = mapOf(
            "title" to Schema.string(description = "Catchy Kahoot quiz title"),
            "topic" to Schema.string(description = "Short topic label under 30 chars"),
            "questions" to Schema.array(
                items = Schema.obj(
                    properties = mapOf(
                        "prompt" to Schema.string(description = "Clear English quiz question prompt"),
                        "options" to Schema.array(
                            items = Schema.string(),
                            description = "Exactly 4 concise multiple-choice answer options"
                        ),
                        "correctIndex" to Schema.integer(description = "Zero-based index (0 to 3) of the correct option"),
                        "tip" to Schema.string(description = "Short friendly teaching explanation for why the answer is right")
                    )
                ),
                description = "List of multiple choice questions"
            )
        )
    )

    private val roleplaySchema = Schema.obj(
        properties = mapOf(
            "title" to Schema.string(description = "Short roleplay scene title"),
            "setting" to Schema.string(description = "Where the conversation happens"),
            "roleAName" to Schema.string(description = "Character A role name"),
            "roleBName" to Schema.string(description = "Character B role name"),
            "goal" to Schema.string(description = "Clear communicative goal for the two speakers"),
            "lines" to Schema.array(
                items = Schema.obj(
                    properties = mapOf(
                        "speakerRole" to Schema.enumeration(listOf("A", "B"), description = "Speaker turn A or B"),
                        "text" to Schema.string(description = "Natural spoken English dialogue line"),
                        "keyHint" to Schema.string(description = "Short prompt cue if the player hides the full script"),
                        "phrase" to Schema.string(description = "Useful English expression from the line"),
                        "phraseMeaning" to Schema.string(description = "Simple explanation of that phrase"),
                        "phraseExample" to Schema.string(description = "Another everyday example sentence using that phrase")
                    )
                ),
                description = "6 alternating dialogue turns between A and B"
            ),
            "plotTwists" to Schema.array(
                items = Schema.string(),
                description = "2 fun surprise plot twists friends can drop mid-scene"
            )
        )
    )

    private val speechFeedbackSchema = Schema.obj(
        properties = mapOf(
            "score" to Schema.integer(description = "Overall speaking match and clarity score from 0 to 100"),
            "summary" to Schema.string(description = "Warm 1-sentence overall assessment for the learner"),
            "clarityFeedback" to Schema.string(description = "Comparison of spoken words against the target script: accuracy, skipped words, or possible mispronunciations"),
            "naturalnessFeedback" to Schema.string(description = "Feedback on grammar, phrasing, and CEFR-appropriate fluency"),
            "suggestedLine" to Schema.string(description = "Polished, natural spoken English version of the line"),
            "practiceTip" to Schema.string(description = "One concrete pronunciation, stress, or rhythm tip for the next attempt")
        )
    )

    private fun buildJsonModel(modelName: String, schema: Schema, maxTokens: Int = 2048): GenerativeModel =
        Firebase.ai.generativeModel(
            modelName = modelName,
            generationConfig = generationConfig {
                responseMimeType = "application/json"
                responseSchema = schema
                maxOutputTokens = maxTokens
                temperature = 0.7f
                thinkingConfig = thinkingConfig {
                    thinkingLevel = ThinkingLevel.MINIMAL
                }
            },
            requestOptions = RequestOptions(timeoutInMillis = 60_000L)
        )

    private val quizModel by lazy { buildJsonModel(PRIMARY_MODEL, quizSchema, maxTokens = 2400) }
    private val quizFastFallbackModel by lazy { buildJsonModel(FAST_FALLBACK_MODEL, quizSchema, maxTokens = 2400) }

    private val roleplayModel by lazy { buildJsonModel(PRIMARY_MODEL, roleplaySchema, maxTokens = 2400) }
    private val roleplayFastFallbackModel by lazy { buildJsonModel(FAST_FALLBACK_MODEL, roleplaySchema, maxTokens = 2400) }

    private val speechFeedbackModel by lazy { buildJsonModel(PRIMARY_MODEL, speechFeedbackSchema, maxTokens = 1400) }
    private val speechFeedbackFastFallbackModel by lazy { buildJsonModel(FAST_FALLBACK_MODEL, speechFeedbackSchema, maxTokens = 1400) }

    private suspend fun streamJsonWithFallback(
        primary: GenerativeModel,
        fallback: GenerativeModel,
        prompt: String
    ): String = withContext(Dispatchers.IO) {
        suspend fun collectStream(model: GenerativeModel, timeoutMs: Long): String {
            val sb = StringBuilder()
            withTimeout(timeoutMs) {
                model.generateContentStream(prompt).collect { chunk ->
                    chunk.text?.let { sb.append(it) }
                }
            }
            val raw = sb.toString().trim()
            if (raw.isEmpty()) {
                throw IllegalStateException("Gemini returned an empty response.")
            }
            return raw
        }

        try {
            collectStream(primary, PRIMARY_TIMEOUT_MS)
        } catch (primaryTimeout: TimeoutCancellationException) {
            Log.w(TAG, "Primary model ($PRIMARY_MODEL) timed out after ${PRIMARY_TIMEOUT_MS}ms; retrying with $FAST_FALLBACK_MODEL", primaryTimeout)
            collectStream(fallback, FALLBACK_TIMEOUT_MS)
        }
    }

    suspend fun generateKahootQuiz(
        topic: String,
        cefrLevel: CefrLevel,
        questionCount: Int,
        focusWords: List<String> = emptyList()
    ): Result<GeneratedQuizDraft> {
        val cleanTopic = topic.trim().ifBlank { "Everyday English" }.take(60)
        val count = questionCount.coerceIn(3, 10)
        val vocabHint = if (focusWords.isNotEmpty()) {
            " Incorporate several of these vocabulary words naturally: ${focusWords.take(12).joinToString(", ")}."
        } else {
            ""
        }
        val prompt = buildString {
            append("Create an interactive Kahoot-style English learning quiz for CEFR level ${cefrLevel.label} ")
            append("on the topic \"$cleanTopic\" with exactly $count questions.$vocabHint ")
            append("Make each question concise and fun for friends playing together: real-life expressions, grammar in context, or meaning choices. ")
            append("Each question must have exactly 4 distinct concise options and correctIndex between 0 and 3.")
        }

        return try {
            val rawJson = streamJsonWithFallback(quizModel, quizFastFallbackModel, prompt)
            val json = JSONObject(rawJson)
            val title = json.optString("title", "$cleanTopic Clash").trim().take(80).ifBlank { "$cleanTopic Clash" }
            val resolvedTopic = json.optString("topic", cleanTopic).trim().take(40).ifBlank { cleanTopic.take(40) }
            val qArray = json.getJSONArray("questions")
            val parsedQuestions = buildList {
                for (i in 0 until qArray.length()) {
                    val obj = qArray.getJSONObject(i)
                    val optArray = obj.getJSONArray("options")
                    val options = (0 until optArray.length()).map { optArray.getString(it).trim() }
                        .filter { it.isNotEmpty() }
                        .take(4)
                    if (options.size >= 2) {
                        val paddedOptions = if (options.size == 4) options else options + List(4 - options.size) { "None of the above" }
                        val idx = obj.optInt("correctIndex", 0).coerceIn(0, 3).toLong()
                        add(
                            QuizQuestionItem(
                                prompt = obj.getString("prompt").trim(),
                                options = paddedOptions,
                                correctIndex = idx,
                                timeLimitSec = if (cefrLevel == CefrLevel.A1 || cefrLevel == CefrLevel.A2) 20L else 18L,
                                tip = obj.optString("tip", "").trim()
                            )
                        )
                    }
                }
            }
            if (parsedQuestions.isEmpty()) {
                Result.failure(IllegalStateException("Generated quiz had no valid questions."))
            } else {
                Result.success(
                    GeneratedQuizDraft(
                        title = title,
                        topic = resolvedTopic,
                        cefrLevel = cefrLevel,
                        questions = parsedQuestions
                    )
                )
            }
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "AI quiz generation timed out", e)
            Result.failure(IllegalStateException("AI quiz generation timed out after 60 seconds. Please try again."))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "AI quiz generation failed", e)
            Result.failure(e)
        }
    }

    suspend fun generateRoleplay(
        setting: String,
        cefrLevel: CefrLevel,
        tone: String
    ): Result<RoleplayScenario> {
        val cleanSetting = setting.trim().ifBlank { "Neighborhood Café" }.take(80)
        val cleanTone = tone.trim().ifBlank { "Friendly" }.take(30)
        val prompt = buildString {
            append("Write a 6-turn English teaching roleplay for two speakers at CEFR level ${cefrLevel.label}. ")
            append("Setting/Scenario: \"$cleanSetting\". Tone: \"$cleanTone\". ")
            append("Keep vocabulary natural and appropriate for ${cefrLevel.label} learners (simple clear sentences for A1/A2; rich idiomatic language for B1/B2). ")
            append("Alternate speakerRole between A and B. Include a useful highlighted phrase and teaching cue on each turn, plus 2 fun plotTwists.")
        }

        return try {
            val rawJson = streamJsonWithFallback(roleplayModel, roleplayFastFallbackModel, prompt)
            val json = JSONObject(rawJson)
            val linesArr = json.getJSONArray("lines")
            val parsedLines = buildList {
                for (i in 0 until linesArr.length()) {
                    val obj = linesArr.getJSONObject(i)
                    val speaker = if (obj.optString("speakerRole", "A").uppercase() == "B") "B" else "A"
                    val phrase = obj.optString("phrase", "").trim()
                    val highlights = if (phrase.isNotEmpty()) {
                        listOf(
                            HighlightedPhrase(
                                phrase = phrase,
                                meaning = obj.optString("phraseMeaning", "Key expression").trim(),
                                example = obj.optString("phraseExample", obj.optString("text", "")).trim()
                            )
                        )
                    } else {
                        emptyList()
                    }
                    add(
                        RoleplayLine(
                            speakerRole = speaker,
                            text = obj.getString("text").trim(),
                            keyHint = obj.optString("keyHint", "Respond naturally").trim(),
                            highlights = highlights
                        )
                    )
                }
            }
            val twistsArr = json.optJSONArray("plotTwists")
            val twists = buildList {
                if (twistsArr != null) {
                    for (i in 0 until twistsArr.length()) {
                        val t = twistsArr.optString(i).trim()
                        if (t.isNotEmpty()) add(t)
                    }
                }
            }.ifEmpty { listOf("Plot Twist: A sudden announcement changes both characters' plans!") }

            if (parsedLines.isEmpty()) {
                Result.failure(IllegalStateException("Generated roleplay had no dialogue lines."))
            } else {
                Result.success(
                    RoleplayScenario(
                        id = "ai_rp_${System.currentTimeMillis()}",
                        title = json.optString("title", cleanSetting).trim().take(80),
                        setting = json.optString("setting", cleanSetting).trim().take(160),
                        cefrLevel = cefrLevel,
                        roleAName = json.optString("roleAName", "Speaker A").trim().take(40),
                        roleBName = json.optString("roleBName", "Speaker B").trim().take(40),
                        goal = json.optString("goal", "Complete the scene smoothly.").trim().take(200),
                        lines = parsedLines,
                        plotTwists = twists
                    )
                )
            }
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "AI roleplay generation timed out", e)
            Result.failure(IllegalStateException("AI roleplay generation timed out after 60 seconds. Try Offline Mode or retry."))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "AI roleplay generation failed", e)
            Result.failure(e)
        }
    }

    suspend fun evaluateRoleplaySpeech(
        scenarioTitle: String,
        cefrLevel: CefrLevel,
        speakerRoleName: String,
        targetScript: String,
        spokenTranscript: String
    ): Result<RoleplaySpeechFeedback> {
        val cleanSpoken = spokenTranscript.trim().take(1200)
        if (cleanSpoken.isBlank()) {
            return Result.failure(IllegalArgumentException("Please record or enter what you spoke first."))
        }
        val cleanTarget = targetScript.trim().take(1200)
        val cleanRole = speakerRoleName.trim().ifBlank { "Speaker" }.take(50)
        val cleanTitle = scenarioTitle.trim().ifBlank { "Roleplay Scene" }.take(80)

        val prompt = buildString {
            append("You are an encouraging English speaking coach evaluating a learner practicing a roleplay at CEFR level ${cefrLevel.label}. ")
            append("Scene: \"$cleanTitle\" (Role: $cleanRole). ")
            append("Target roleplay script:\n\"$cleanTarget\"\n")
            append("Learner's speech-to-text transcript:\n\"$cleanSpoken\"\n")
            append("Compare what the learner actually said against the target script (keeping in mind minor speech-to-text punctuation differences). ")
            append("Return a fair 0-100 score, a warm 1-sentence summary, specific clarity/word-accuracy feedback, naturalness & grammar feedback suited for ${cefrLevel.label}, ")
            append("a polished suggestedLine they can say out loud, and one concrete practiceTip.")
        }

        return try {
            val rawJson = streamJsonWithFallback(speechFeedbackModel, speechFeedbackFastFallbackModel, prompt)
            val json = JSONObject(rawJson)
            val score = json.optInt("score", 75).coerceIn(0, 100)
            val summary = json.optString("summary", "Great effort practicing your spoken English!").trim()
            val clarity = json.optString("clarityFeedback", "").trim()
            val naturalness = json.optString("naturalnessFeedback", "").trim()
            val suggested = json.optString("suggestedLine", cleanTarget).trim().ifBlank { cleanTarget }
            val tip = json.optString("practiceTip", "Pause slightly at commas and stress key content words.").trim()
            Result.success(
                RoleplaySpeechFeedback(
                    score = score,
                    summary = summary,
                    clarityFeedback = clarity.ifBlank { "Your spoken words closely follow the scene's intent." },
                    naturalnessFeedback = naturalness.ifBlank { "Good conversational rhythm for ${cefrLevel.label}." },
                    suggestedLine = suggested,
                    practiceTip = tip
                )
            )
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "AI speech feedback timed out", e)
            Result.failure(IllegalStateException("AI speech feedback timed out after 60 seconds. Please try again."))
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "AI speech feedback failed", e)
            Result.failure(e)
        }
    }

    private companion object {
        const val TAG = "LingoAiGenerator"
        const val PRIMARY_MODEL = "gemini-3.8-flash"
        const val FAST_FALLBACK_MODEL = "gemini-3.5-flash-lite"
        const val PRIMARY_TIMEOUT_MS = 38_000L
        const val FALLBACK_TIMEOUT_MS = 22_000L
    }
}
