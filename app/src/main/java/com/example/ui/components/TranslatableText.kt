package com.example.ui.components

import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LocalTextStyle
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLayoutResult
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.data.content.ArabicWordGlossary
import com.example.data.content.WordGlossaryMatch
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.JetBrainsMonoFontFamily
import com.example.util.rememberTtsSpeaker
import kotlin.math.abs

private val WORD_TOKEN_REGEX = Regex("[A-Za-z]+(?:['’][A-Za-z]+)?")
private const val TAG_ARABIC_WORD = "AR_WORD"

/**
 * Renders English text where recognized vocabulary words are subtly underlined.
 * Tapping an underlined word pops a crisp Arabic translation card with pronunciation.
 * Non-underlined taps pass cleanly through to any parent clickable container.
 */
@Composable
fun TranslatableEnglishText(
    text: String,
    modifier: Modifier = Modifier,
    style: TextStyle = LocalTextStyle.current,
    color: Color = Color.Unspecified,
    fontWeight: FontWeight? = null,
    textAlign: TextAlign? = null,
    underlineColor: Color = MaterialTheme.colorScheme.primary,
    maxLines: Int = Int.MAX_VALUE,
    overflow: TextOverflow = TextOverflow.Clip
) {
    var activePopupMatch by remember(text) { mutableStateOf<WordGlossaryMatch?>(null) }

    val (annotatedText, matchLookup) = remember(text, underlineColor) {
        buildTranslatableAnnotatedText(text, underlineColor)
    }

    var textLayoutResult by remember(annotatedText) { mutableStateOf<TextLayoutResult?>(null) }

    val tapModifier = if (matchLookup.isEmpty()) {
        modifier
    } else {
        modifier.pointerInput(annotatedText) {
            awaitPointerEventScope {
                while (true) {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    val layout = textLayoutResult ?: continue
                    val offset = layout.getOffsetForPosition(down.position)
                    val annotation = annotatedText
                        .getStringAnnotations(tag = TAG_ARABIC_WORD, start = offset, end = offset)
                        .firstOrNull()
                        ?: continue

                    // Track release without breaking scrolling; consume if it's a tap on the underlined word.
                    val up = waitForUpOrCancellation()
                    if (up != null) {
                        val dx = abs(up.position.x - down.position.x)
                        val dy = abs(up.position.y - down.position.y)
                        if (dx < 24f && dy < 24f) {
                            val upOffset = layout.getOffsetForPosition(up.position)
                            val upAnn = annotatedText
                                .getStringAnnotations(tag = TAG_ARABIC_WORD, start = upOffset, end = upOffset)
                                .firstOrNull()
                            val targetKey = upAnn?.item ?: annotation.item
                            matchLookup[targetKey]?.let { matched ->
                                up.consume()
                                activePopupMatch = matched
                            }
                        }
                    }
                }
            }
        }
    }

    Text(
        text = annotatedText,
        style = style,
        color = color,
        fontWeight = fontWeight,
        textAlign = textAlign,
        maxLines = maxLines,
        overflow = overflow,
        onTextLayout = { textLayoutResult = it },
        modifier = tapModifier.semantics {
            contentDescription = text
        }
    )

    val popup = activePopupMatch
    if (popup != null) {
        WordTranslationPopupDialog(
            match = popup,
            onDismiss = { activePopupMatch = null }
        )
    }
}

internal fun buildTranslatableAnnotatedText(
    text: String,
    underlineColor: Color
): Pair<AnnotatedString, Map<String, WordGlossaryMatch>> {
    val foundMatches = LinkedHashMap<String, WordGlossaryMatch>()
    val annotated = buildAnnotatedString {
        var lastCursor = 0
        WORD_TOKEN_REGEX.findAll(text).forEach { result ->
            val start = result.range.first
            val end = result.range.last + 1
            if (start > lastCursor) {
                append(text.substring(lastCursor, start))
            }
            val token = result.value
            val match = ArabicWordGlossary.lookup(token)
            if (match != null) {
                val key = "${start}_${token.lowercase()}"
                foundMatches[key] = match.copy(word = token)
                pushStringAnnotation(tag = TAG_ARABIC_WORD, annotation = key)
                withStyle(
                    SpanStyle(
                        textDecoration = TextDecoration.Underline,
                        color = underlineColor,
                        fontWeight = FontWeight.Medium
                    )
                ) {
                    append(token)
                }
                pop()
            } else {
                append(token)
            }
            lastCursor = end
        }
        if (lastCursor < text.length) {
            append(text.substring(lastCursor))
        }
    }
    return annotated to foundMatches
}

@Composable
fun WordTranslationPopupDialog(
    match: WordGlossaryMatch,
    onDismiss: () -> Unit
) {
    val tts = rememberTtsSpeaker()

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 8.dp,
            shadowElevation = 8.dp,
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 360.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        color = IndigoSoft,
                        shape = RoundedCornerShape(99.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Translate,
                                contentDescription = null,
                                tint = IndigoOnSoft,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = match.partOfSpeech.ifBlank { "Vocabulary" },
                                color = IndigoOnSoft,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(40.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Close,
                            contentDescription = "Close translation popup",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = match.word,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (match.phonetic.isNotBlank()) {
                        Text(
                            text = match.phonetic,
                            fontFamily = JetBrainsMonoFontFamily,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Surface(
                    color = AmberSoft,
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                        Text(
                            text = match.arabic,
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = AmberOnSoft,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                        )
                    }
                }

                if (match.meaning.isNotBlank()) {
                    Text(
                        text = match.meaning,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                if (match.exampleAr.isNotBlank()) {
                    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                        Text(
                            text = match.exampleAr,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = { tts.speak(match.word) },
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.VolumeUp,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(6.dp))
                        Text("Listen")
                    }
                }
            }
        }
    }
}
