package com.example.util

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat

class SpeechToTextController(
    private val context: Context,
    private val onRequestPermission: () -> Unit,
    private val onLaunchFallbackIntent: (Intent) -> Unit
) {
    var isListening by mutableStateOf(false)
        private set
    var transcript by mutableStateOf("")
        private set
    var partialTranscript by mutableStateOf("")
        private set
    var rmsLevel by mutableFloatStateOf(0f)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set

    private var speechRecognizer: SpeechRecognizer? = null
    private var pendingStartAfterPermission = false

    fun hasRecordPermission(): Boolean =
        ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO
        ) == PackageManager.PERMISSION_GRANTED

    fun updateTranscript(newText: String) {
        transcript = newText
    }

    fun clear() {
        transcript = ""
        partialTranscript = ""
        errorMessage = null
    }

    fun onPermissionResult(granted: Boolean) {
        if (granted) {
            errorMessage = null
            if (pendingStartAfterPermission) {
                pendingStartAfterPermission = false
                beginListeningInternal()
            }
        } else {
            pendingStartAfterPermission = false
            isListening = false
            errorMessage = "Microphone permission is required for voice recording. You can still type or edit your line below."
        }
    }

    fun onFallbackActivityResult(resultCode: Int, data: Intent?) {
        isListening = false
        rmsLevel = 0f
        if (resultCode == Activity.RESULT_OK && data != null) {
            val matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            val best = matches?.firstOrNull()?.trim().orEmpty()
            if (best.isNotEmpty()) {
                transcript = appendPhrase(transcript, best)
                errorMessage = null
            } else {
                errorMessage = "No speech was detected. Please try speaking again."
            }
        }
    }

    fun toggleListening() {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    fun startListening() {
        errorMessage = null
        if (!hasRecordPermission()) {
            pendingStartAfterPermission = true
            onRequestPermission()
            return
        }
        beginListeningInternal()
    }

    fun stopListening() {
        if (!isListening) return
        isListening = false
        rmsLevel = 0f
        runCatching { speechRecognizer?.stopListening() }
    }

    private fun beginListeningInternal() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak your English roleplay line clearly")
        }

        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            runCatching { onLaunchFallbackIntent(intent) }
                .onFailure {
                    errorMessage = "On-device speech recognition is unavailable on this device. You can type your spoken response below."
                }
            return
        }

        try {
            val recognizer = speechRecognizer ?: SpeechRecognizer.createSpeechRecognizer(context).also { created ->
                created.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        isListening = true
                        errorMessage = null
                    }

                    override fun onBeginningOfSpeech() {
                        isListening = true
                    }

                    override fun onRmsChanged(rmsdB: Float) {
                        rmsLevel = ((rmsdB + 2f) / 12f).coerceIn(0f, 1f)
                    }

                    override fun onBufferReceived(buffer: ByteArray?) = Unit

                    override fun onEndOfSpeech() {
                        rmsLevel = 0f
                    }

                    override fun onError(error: Int) {
                        isListening = false
                        rmsLevel = 0f
                        partialTranscript = ""
                        if (error == SpeechRecognizer.ERROR_CLIENT || error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY) {
                            runCatching { speechRecognizer?.cancel() }
                        }
                        errorMessage = when (error) {
                            SpeechRecognizer.ERROR_AUDIO -> "Microphone audio error. Check your mic and try again."
                            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission is needed to record audio."
                            SpeechRecognizer.ERROR_NETWORK,
                            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Speech recognition needs network connectivity or offline English voice data."
                            SpeechRecognizer.ERROR_NO_MATCH,
                            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "Didn't catch that clearly — tap the mic and speak closer, or edit the text below."
                            else -> "Speech service could not start (code $error). You can retry or type your line below."
                        }
                    }

                    override fun onResults(results: Bundle?) {
                        isListening = false
                        rmsLevel = 0f
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val spoken = matches?.firstOrNull()?.trim().orEmpty()
                        if (spoken.isNotEmpty()) {
                            transcript = appendPhrase(transcript, spoken)
                            errorMessage = null
                        }
                        partialTranscript = ""
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val partial = partialResults
                            ?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            ?.firstOrNull()
                            ?.trim()
                            .orEmpty()
                        if (partial.isNotEmpty()) {
                            partialTranscript = partial
                        }
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) = Unit
                })
                speechRecognizer = created
            }
            partialTranscript = ""
            isListening = true
            recognizer.startListening(intent)
        } catch (_: Exception) {
            isListening = false
            runCatching { onLaunchFallbackIntent(intent) }
                .onFailure {
                    errorMessage = "Could not start voice input. You can type your line below."
                }
        }
    }

    fun destroy() {
        isListening = false
        rmsLevel = 0f
        runCatching {
            speechRecognizer?.cancel()
            speechRecognizer?.destroy()
        }
        speechRecognizer = null
    }

    private fun appendPhrase(existing: String, addition: String): String {
        val base = existing.trim()
        return if (base.isEmpty()) addition else "$base $addition"
    }
}

@Composable
fun rememberSpeechToTextController(): SpeechToTextController {
    val context = LocalContext.current
    val controllerHolder = remember { arrayOfNulls<SpeechToTextController>(1) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        controllerHolder[0]?.onPermissionResult(granted)
    }

    val fallbackLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        controllerHolder[0]?.onFallbackActivityResult(result.resultCode, result.data)
    }

    val controller = remember(context) {
        SpeechToTextController(
            context = context,
            onRequestPermission = {
                permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
            },
            onLaunchFallbackIntent = { intent ->
                fallbackLauncher.launch(intent)
            }
        ).also { controllerHolder[0] = it }
    }

    DisposableEffect(controller) {
        onDispose { controller.destroy() }
    }

    return controller
}
