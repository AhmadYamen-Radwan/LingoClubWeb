package com.example.ui.components

import android.graphics.BitmapFactory
import androidx.annotation.DrawableRes
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Style
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.produceState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.data.model.CefrLevel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.ConcurrentHashMap
import com.example.ui.theme.AmberAccent
import com.example.ui.theme.AmberOnSoft
import com.example.ui.theme.AmberSoft
import com.example.ui.theme.CoralOnSoft
import com.example.ui.theme.CoralSoft
import com.example.ui.theme.IndigoOnSoft
import com.example.ui.theme.IndigoSoft
import com.example.ui.theme.KahootAmber
import com.example.ui.theme.KahootBlue
import com.example.ui.theme.KahootGreen
import com.example.ui.theme.KahootRed
import com.example.ui.theme.MintOnSoft
import com.example.ui.theme.MintSoft

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CefrFilterRow(
    selectedLevel: CefrLevel?,
    onSelectLevel: (CefrLevel?) -> Unit,
    tagPrefix: String,
    modifier: Modifier = Modifier
) {
    FlowRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        FilterChip(
            selected = selectedLevel == null,
            onClick = { onSelectLevel(null) },
            label = { Text("All (A1–B2)") },
            modifier = Modifier.testTag("${tagPrefix}_level_all")
        )
        CefrLevel.entries.forEach { lvl ->
            FilterChip(
                selected = selectedLevel == lvl,
                onClick = { onSelectLevel(if (selectedLevel == lvl) null else lvl) },
                label = { Text(lvl.label) },
                modifier = Modifier.testTag("${tagPrefix}_level_${lvl.name.lowercase()}")
            )
        }
    }
}

@Composable
fun CefrBadge(
    level: CefrLevel,
    modifier: Modifier = Modifier
) {
    val (bg, fg) = when (level) {
        CefrLevel.A1, CefrLevel.A2 -> MintSoft to MintOnSoft
        CefrLevel.B1 -> AmberSoft to AmberOnSoft
        CefrLevel.B2 -> IndigoSoft to IndigoOnSoft
    }
    Surface(
        color = bg,
        shape = RoundedCornerShape(99.dp),
        modifier = modifier
    ) {
        Text(
            text = level.label,
            color = fg,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

@Composable
fun StatPill(
    icon: ImageVector,
    value: String,
    label: String,
    containerColor: Color,
    contentColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        color = containerColor,
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = contentColor,
                modifier = Modifier.size(18.dp)
            )
            Text(
                text = value,
                color = contentColor,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                color = contentColor.copy(alpha = 0.85f),
                style = MaterialTheme.typography.labelSmall
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun UserStatsRow(
    xp: Long,
    streak: Long,
    mastered: Long,
    modifier: Modifier = Modifier
) {
    FlowRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        StatPill(
            icon = Icons.Filled.Bolt,
            value = xp.toString(),
            label = "XP",
            containerColor = AmberSoft,
            contentColor = AmberOnSoft
        )
        StatPill(
            icon = Icons.Filled.LocalFireDepartment,
            value = "${streak}d",
            label = "Streak",
            containerColor = CoralSoft,
            contentColor = CoralOnSoft
        )
        StatPill(
            icon = Icons.Filled.Style,
            value = mastered.toString(),
            label = "Cards",
            containerColor = MintSoft,
            contentColor = MintOnSoft
        )
    }
}

fun kahootTileColor(index: Int): Color = when (index % 4) {
    0 -> KahootRed
    1 -> KahootBlue
    2 -> KahootAmber
    else -> KahootGreen
}

@Composable
fun KahootShapeGlyph(
    index: Int,
    color: Color = Color.White,
    size: Dp = 18.dp,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier.size(size)) {
        val w = this.size.width
        val h = this.size.height
        when (index % 4) {
            0 -> {
                // Triangle
                val path = Path().apply {
                    moveTo(w / 2f, h * 0.1f)
                    lineTo(w * 0.9f, h * 0.88f)
                    lineTo(w * 0.1f, h * 0.88f)
                    close()
                }
                drawPath(path, color = color)
            }
            1 -> {
                // Diamond
                val path = Path().apply {
                    moveTo(w / 2f, h * 0.08f)
                    lineTo(w * 0.92f, h / 2f)
                    lineTo(w / 2f, h * 0.92f)
                    lineTo(w * 0.08f, h / 2f)
                    close()
                }
                drawPath(path, color = color)
            }
            2 -> {
                // Circle
                drawCircle(
                    color = color,
                    radius = w * 0.4f,
                    center = Offset(w / 2f, h / 2f)
                )
            }
            else -> {
                // Square
                drawRect(
                    color = color,
                    topLeft = Offset(w * 0.14f, h * 0.14f),
                    size = Size(w * 0.72f, h * 0.72f)
                )
            }
        }
    }
}

fun avatarColorForTag(tag: String): Color = when (tag.uppercase()) {
    "CORAL" -> KahootRed
    "BLUE" -> KahootBlue
    "AMBER" -> AmberAccent
    "MINT" -> KahootGreen
    else -> Color(0xFF563AE4)
}

private val decodedDrawableCache = ConcurrentHashMap<Int, ImageBitmap>()

@Composable
fun AsyncDrawableImage(
    @DrawableRes resId: Int,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop,
    sampleSize: Int = 2,
    placeholderColor: Color = IndigoSoft
) {
    val context = LocalContext.current
    val bitmap by produceState<ImageBitmap?>(initialValue = decodedDrawableCache[resId], resId, context) {
        if (value == null) {
            val decoded = withContext(Dispatchers.IO) {
                runCatching {
                    val opts = BitmapFactory.Options().apply {
                        inSampleSize = sampleSize.coerceAtLeast(1)
                    }
                    BitmapFactory.decodeResource(context.resources, resId, opts)?.asImageBitmap()
                }.getOrNull()
            }
            if (decoded != null) {
                decodedDrawableCache[resId] = decoded
                value = decoded
            }
        }
    }

    val readyBitmap = bitmap
    if (readyBitmap != null) {
        Image(
            bitmap = readyBitmap,
            contentDescription = contentDescription,
            contentScale = contentScale,
            modifier = modifier
        )
    } else {
        Box(modifier = modifier.background(placeholderColor))
    }
}

