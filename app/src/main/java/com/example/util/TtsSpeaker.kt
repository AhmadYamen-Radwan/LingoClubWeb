package com.example.util

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import java.util.Locale

class TtsSpeaker(context: Context) {
    private var ready = false
    private var tts: TextToSpeech? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var onStartCallback: ((String) -> Unit)? = null
    private var onQueueDoneCallback: (() -> Unit)? = null
    private var lastQueueId: String? = null

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                val res = tts?.setLanguage(Locale.US)
                ready = res != TextToSpeech.LANG_MISSING_DATA && res != TextToSpeech.LANG_NOT_SUPPORTED
                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        val id = utteranceId ?: return
                        mainHandler.post { onStartCallback?.invoke(id) }
                    }

                    override fun onDone(utteranceId: String?) {
                        if (utteranceId != null && utteranceId == lastQueueId) {
                            mainHandler.post { onQueueDoneCallback?.invoke() }
                        }
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        if (utteranceId != null && utteranceId == lastQueueId) {
                            mainHandler.post { onQueueDoneCallback?.invoke() }
                        }
                    }
                })
            }
        }
    }

    fun speak(text: String, rate: Float = 0.95f) {
        if (ready && text.isNotBlank()) {
            onStartCallback = null
            onQueueDoneCallback = null
            lastQueueId = null
            tts?.setSpeechRate(rate)
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, text.hashCode().toString())
        }
    }

    fun speakSequence(
        items: List<Pair<String, String>>,
        rate: Float = 0.95f,
        onUtteranceStart: (String) -> Unit,
        onFinished: () -> Unit
    ) {
        if (!ready || items.isEmpty()) {
            onFinished()
            return
        }
        onStartCallback = onUtteranceStart
        onQueueDoneCallback = onFinished
        lastQueueId = items.last().first
        tts?.setSpeechRate(rate)
        items.forEachIndexed { index, (id, text) ->
            val mode = if (index == 0) TextToSpeech.QUEUE_FLUSH else TextToSpeech.QUEUE_ADD
            tts?.speak(text, mode, null, id)
        }
    }

    fun stop() {
        onStartCallback = null
        onQueueDoneCallback = null
        lastQueueId = null
        tts?.stop()
    }

    fun shutdown() {
        stop()
        tts?.shutdown()
        tts = null
    }
}

@Composable
fun rememberTtsSpeaker(): TtsSpeaker {
    val context = LocalContext.current
    val speaker = remember(context) { TtsSpeaker(context) }
    DisposableEffect(speaker) {
        onDispose { speaker.shutdown() }
    }
    return speaker
}
