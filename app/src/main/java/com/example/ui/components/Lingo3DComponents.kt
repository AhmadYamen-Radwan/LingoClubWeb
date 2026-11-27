package com.example.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.example.R
import com.example.ui.theme.AmberAccent
import com.example.ui.theme.CoralSecondary
import com.example.ui.theme.IndigoPrimary
import com.example.ui.theme.MintTertiary
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

private data class Vec3(val x: Float, val y: Float, val z: Float) {
    operator fun plus(other: Vec3) = Vec3(x + other.x, y + other.y, z + other.z)
    operator fun minus(other: Vec3) = Vec3(x - other.x, y - other.y, z - other.z)
    operator fun times(s: Float) = Vec3(x * s, y * s, z * s)

    fun dot(other: Vec3): Float = x * other.x + y * other.y + z * other.z
    fun cross(other: Vec3): Vec3 = Vec3(
        y * other.z - z * other.y,
        z * other.x - x * other.z,
        x * other.y - y * other.x
    )

    fun normalized(): Vec3 {
        val len = sqrt(x * x + y * y + z * z)
        return if (len > 1e-5f) Vec3(x / len, y / len, z / len) else Vec3(0f, 0f, 1f)
    }

    fun rotateX(rad: Float): Vec3 {
        val c = cos(rad)
        val s = sin(rad)
        return Vec3(x, y * c - z * s, y * s + z * c)
    }

    fun rotateY(rad: Float): Vec3 {
        val c = cos(rad)
        val s = sin(rad)
        return Vec3(x * c + z * s, y, -x * s + z * c)
    }
}

private data class CubeFaceSpec(
    val indices: IntArray,
    val baseColor: Color,
    val label: String
)

private val CubeVertices = arrayOf(
    Vec3(-1f, -1f, 1f),  // 0: Front-Top-Left
    Vec3(1f, -1f, 1f),   // 1: Front-Top-Right
    Vec3(1f, 1f, 1f),    // 2: Front-Bottom-Right
    Vec3(-1f, 1f, 1f),   // 3: Front-Bottom-Left
    Vec3(-1f, -1f, -1f), // 4: Back-Top-Left
    Vec3(1f, -1f, -1f),  // 5: Back-Top-Right
    Vec3(1f, 1f, -1f),   // 6: Back-Bottom-Right
    Vec3(-1f, 1f, -1f)   // 7: Back-Bottom-Left
)

private val CubeFaces = listOf(
    CubeFaceSpec(intArrayOf(0, 1, 2, 3), IndigoPrimary, "A1"),
    CubeFaceSpec(intArrayOf(5, 4, 7, 6), CoralSecondary, "B2"),
    CubeFaceSpec(intArrayOf(4, 5, 1, 0), AmberAccent, "EN"),
    CubeFaceSpec(intArrayOf(3, 2, 6, 7), MintTertiary, "AR"),
    CubeFaceSpec(intArrayOf(1, 5, 6, 2), Color(0xFF0EA5E9), "A2"),
    CubeFaceSpec(intArrayOf(4, 0, 3, 7), Color(0xFFA855F7), "B1")
)

/**
 * Real-time interactive 3D language cube with shaded faces, orbiting 3D nodes,
 * touch-drag rotation, and tap spin burst.
 */
@Composable
fun Interactive3DLanguageCube(
    modifier: Modifier = Modifier,
    size: Dp = 88.dp,
    onTap: (() -> Unit)? = null
) {
    val textMeasurer = rememberTextMeasurer()
    val infiniteTransition = rememberInfiniteTransition(label = "cube_3d_spin")
    val autoYaw by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2f * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 9000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "cube_yaw"
    )
    val bobPhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2f * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 3200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "cube_bob"
    )

    var dragYaw by remember { mutableFloatStateOf(0.45f) }
    var dragPitch by remember { mutableFloatStateOf(-0.38f) }
    var spinBoost by remember { mutableFloatStateOf(0f) }
    val animatedBoost by animateFloatAsState(
        targetValue = spinBoost,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
        label = "cube_boost"
    )

    val lightDir = remember { Vec3(-0.45f, -0.65f, 0.85f).normalized() }

    Box(
        modifier = modifier
            .size(size)
            .pointerInput(Unit) {
                detectDragGestures { change, dragAmount ->
                    change.consume()
                    dragYaw += dragAmount.x * 0.012f
                    dragPitch = (dragPitch + dragAmount.y * 0.012f).coerceIn(-1.2f, 1.2f)
                }
            }
            .clickable {
                spinBoost += (PI * 1.5f).toFloat()
                onTap?.invoke()
            }
            .testTag("cube_3d_interactive"),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = this.size.width
            val h = this.size.height
            val cx = w / 2f
            val cy = h / 2f + sin(bobPhase) * (h * 0.03f)
            val radius = minOf(w, h) * 0.27f
            val totalYaw = autoYaw + dragYaw + animatedBoost
            val totalPitch = dragPitch + sin(bobPhase) * 0.08f
            val cameraDist = 4.6f

            // Ground soft drop shadow
            drawOval(
                color = Color.Black.copy(alpha = 0.14f),
                topLeft = Offset(cx - radius * 1.05f, h * 0.83f),
                size = Size(radius * 2.1f, radius * 0.42f)
            )

            // Transform cube vertices
            val rotated = CubeVertices.map { v ->
                v.rotateX(totalPitch).rotateY(totalYaw)
            }

            fun project(v: Vec3): Offset {
                val factor = cameraDist / (cameraDist - v.z)
                return Offset(cx + v.x * radius * factor, cy + v.y * radius * factor)
            }

            // Painter-sort faces by depth
            val visibleFaces = CubeFaces.mapNotNull { face ->
                val v0 = rotated[face.indices[0]]
                val v1 = rotated[face.indices[1]]
                val v2 = rotated[face.indices[2]]
                val v3 = rotated[face.indices[3]]
                val normal = (v1 - v0).cross(v2 - v0).normalized()
                // Backface cull: in screen-projected coords camera looks down -z toward +z?
                // Wait: higher z is closer to camera, so front-facing normals have normal.z > 0.
                if (normal.z <= -0.05f) {
                    null
                } else {
                    val centerZ = (v0.z + v1.z + v2.z + v3.z) * 0.25f
                    val center = (v0 + v1 + v2 + v3) * 0.25f
                    Triple(face, normal, centerZ to center)
                }
            }.sortedBy { it.third.first }

            visibleFaces.forEach { (face, normal, depthAndCenter) ->
                val p0 = project(rotated[face.indices[0]])
                val p1 = project(rotated[face.indices[1]])
                val p2 = project(rotated[face.indices[2]])
                val p3 = project(rotated[face.indices[3]])

                val diffuse = normal.dot(lightDir).coerceIn(0f, 1f)
                val shadeFactor = 0.58f + diffuse * 0.42f
                val faceColor = lerp(Color(0xFF141322), face.baseColor, shadeFactor)
                val highlightColor = lerp(faceColor, Color.White, diffuse * 0.28f)

                val path = Path().apply {
                    moveTo(p0.x, p0.y)
                    lineTo(p1.x, p1.y)
                    lineTo(p2.x, p2.y)
                    lineTo(p3.x, p3.y)
                    close()
                }
                drawPath(
                    path = path,
                    brush = Brush.linearGradient(
                        colors = listOf(highlightColor, faceColor),
                        start = p0,
                        end = p2
                    )
                )
                drawPath(
                    path = path,
                    color = Color.White.copy(alpha = 0.45f),
                    style = Stroke(width = 1.6f, cap = StrokeCap.Round)
                )

                // Draw crisp label on mostly front-facing faces
                if (normal.z > 0.42f && w >= 60.dp.toPx()) {
                    val center2d = project(depthAndCenter.second)
                    val measured = textMeasurer.measure(
                        text = face.label,
                        style = TextStyle(
                            color = Color.White.copy(alpha = normal.z.coerceIn(0.45f, 1f)),
                            fontSize = (radius * 0.52f).toSp(),
                            fontWeight = FontWeight.ExtraBold
                        )
                    )
                    drawText(
                        textLayoutResult = measured,
                        topLeft = Offset(
                            center2d.x - measured.size.width / 2f,
                            center2d.y - measured.size.height / 2f
                        )
                    )
                }
            }

            // Orbiting 3D accent spheres
            for (i in 0 until 3) {
                val angle = totalYaw * 1.4f + (i * (2f * PI.toFloat() / 3f))
                val orbitPos = Vec3(
                    x = cos(angle) * 1.72f,
                    y = sin(angle * 0.8f) * 0.52f,
                    z = sin(angle) * 1.72f
                ).rotateX(0.32f)
                val projected = project(orbitPos)
                val orbColor = when (i) {
                    0 -> AmberAccent
                    1 -> MintTertiary
                    else -> CoralSecondary
                }
                val r = (radius * 0.16f) * (cameraDist / (cameraDist - orbitPos.z))
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(Color.White, orbColor),
                        center = Offset(projected.x - r * 0.3f, projected.y - r * 0.3f),
                        radius = r * 1.4f
                    ),
                    radius = r,
                    center = projected
                )
            }
        }
    }
}

/**
 * Animated 3D Golden Trophy Figure with specular shine, 3D chalice geometry,
 * and orbiting celebratory 3D sparkles.
 */
@Composable
fun Trophy3DFigure(
    modifier: Modifier = Modifier,
    size: Dp = 104.dp,
    primaryGold: Color = Color(0xFFFFC107),
    deepGold: Color = Color(0xFFB45309)
) {
    val infiniteTransition = rememberInfiniteTransition(label = "trophy_3d")
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "trophy_float"
    )
    val orbitAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = (2f * PI).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 4800, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "trophy_orbit"
    )
    val tiltY by infiniteTransition.animateFloat(
        initialValue = -10f,
        targetValue = 10f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "trophy_tilt"
    )

    Box(
        modifier = modifier
            .size(size)
            .graphicsLayer {
                translationY = floatOffset
                rotationY = tiltY
                cameraDistance = 12f * density
            }
            .testTag("trophy_3d_figure"),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val w = this.size.width
            val h = this.size.height
            val cx = w / 2f

            // Ground ellipse shadow
            drawOval(
                color = Color.Black.copy(alpha = 0.14f),
                topLeft = Offset(cx - w * 0.28f, h * 0.87f),
                size = Size(w * 0.56f, h * 0.09f)
            )

            // Glowing radial halo
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(primaryGold.copy(alpha = 0.34f), Color.Transparent),
                    center = Offset(cx, h * 0.42f),
                    radius = w * 0.46f
                ),
                radius = w * 0.46f,
                center = Offset(cx, h * 0.42f)
            )

            // Trophy handles (3D curved tubes)
            val leftHandle = Path().apply {
                moveTo(cx - w * 0.22f, h * 0.22f)
                cubicTo(cx - w * 0.41f, h * 0.22f, cx - w * 0.40f, h * 0.48f, cx - w * 0.15f, h * 0.49f)
            }
            val rightHandle = Path().apply {
                moveTo(cx + w * 0.22f, h * 0.22f)
                cubicTo(cx + w * 0.41f, h * 0.22f, cx + w * 0.40f, h * 0.48f, cx + w * 0.15f, h * 0.49f)
            }
            drawPath(leftHandle, color = deepGold, style = Stroke(width = w * 0.055f, cap = StrokeCap.Round))
            drawPath(rightHandle, color = deepGold, style = Stroke(width = w * 0.055f, cap = StrokeCap.Round))
            drawPath(leftHandle, color = primaryGold, style = Stroke(width = w * 0.03f, cap = StrokeCap.Round))
            drawPath(rightHandle, color = primaryGold, style = Stroke(width = w * 0.03f, cap = StrokeCap.Round))

            // Base pedestal (3D extruded block + highlight)
            drawRoundRect(
                brush = Brush.horizontalGradient(
                    colors = listOf(Color(0xFF451A03), Color(0xFF92400E), Color(0xFF451A03))
                ),
                topLeft = Offset(cx - w * 0.21f, h * 0.72f),
                size = Size(w * 0.42f, h * 0.13f),
                cornerRadius = CornerRadius(w * 0.04f, w * 0.04f)
            )
            // Gold nameplate on base
            drawRoundRect(
                brush = Brush.horizontalGradient(
                    colors = listOf(deepGold, Color(0xFFFFF59D), primaryGold)
                ),
                topLeft = Offset(cx - w * 0.12f, h * 0.755f),
                size = Size(w * 0.24f, h * 0.055f),
                cornerRadius = CornerRadius(w * 0.02f, w * 0.02f)
            )

            // Stem
            drawRoundRect(
                brush = Brush.horizontalGradient(
                    colors = listOf(deepGold, Color(0xFFFFF59D), deepGold)
                ),
                topLeft = Offset(cx - w * 0.055f, h * 0.54f),
                size = Size(w * 0.11f, h * 0.20f),
                cornerRadius = CornerRadius(w * 0.02f, w * 0.02f)
            )

            // Trophy chalice body with 3D cylindrical specular highlight
            val cupPath = Path().apply {
                moveTo(cx - w * 0.24f, h * 0.17f)
                lineTo(cx + w * 0.24f, h * 0.17f)
                cubicTo(cx + w * 0.24f, h * 0.49f, cx + w * 0.11f, h * 0.56f, cx, h * 0.56f)
                cubicTo(cx - w * 0.11f, h * 0.56f, cx - w * 0.24f, h * 0.49f, cx - w * 0.24f, h * 0.17f)
                close()
            }
            drawPath(
                path = cupPath,
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        deepGold,
                        primaryGold,
                        Color(0xFFFFF8E1),
                        primaryGold,
                        deepGold
                    ),
                    startX = cx - w * 0.24f,
                    endX = cx + w * 0.24f
                )
            )

            // 3D top rim ellipse
            drawOval(
                brush = Brush.verticalGradient(
                    colors = listOf(Color(0xFFFFF8E1), deepGold)
                ),
                topLeft = Offset(cx - w * 0.24f, h * 0.135f),
                size = Size(w * 0.48f, h * 0.07f)
            )
            drawOval(
                color = Color(0xFF78350F).copy(alpha = 0.55f),
                topLeft = Offset(cx - w * 0.19f, h * 0.148f),
                size = Size(w * 0.38f, h * 0.042f)
            )

            // Orbiting 3D stars / gems around the trophy
            val starColors = listOf(Color(0xFF38BDF8), CoralSecondary, MintTertiary, Color(0xFFFFF59D))
            for (i in 0 until 4) {
                val theta = orbitAngle + i * (PI.toFloat() / 2f)
                val ox = cx + cos(theta) * (w * 0.38f)
                val oy = h * 0.34f + sin(theta) * (h * 0.12f)
                val depthScale = 0.72f + 0.35f * ((sin(theta) + 1f) * 0.5f)
                val r = w * 0.045f * depthScale
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(Color.White, starColors[i]),
                        center = Offset(ox - r * 0.25f, oy - r * 0.25f),
                        radius = r * 1.4f
                    ),
                    radius = r,
                    center = Offset(ox, oy)
                )
            }
        }
    }
}

/**
 * Interactive 3D clay mascot stage with floating levitation, touch-drag perspective tilt,
 * and tap-to-bounce spring reaction.
 */
@Composable
fun Mascot3DStageBadge(
    modifier: Modifier = Modifier,
    size: Dp = 92.dp,
    onTap: (() -> Unit)? = null
) {
    val density = LocalDensity.current.density
    val infiniteTransition = rememberInfiniteTransition(label = "mascot_3d")
    val bobDp by infiniteTransition.animateFloat(
        initialValue = -3f,
        targetValue = 3f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "mascot_bob"
    )
    var tiltX by remember { mutableFloatStateOf(0f) }
    var tiltY by remember { mutableFloatStateOf(0f) }
    var popCount by remember { mutableFloatStateOf(1f) }
    val animTiltX by animateFloatAsState(
        targetValue = tiltX,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "tilt_x"
    )
    val animTiltY by animateFloatAsState(
        targetValue = tiltY,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "tilt_y"
    )
    val animScale by animateFloatAsState(
        targetValue = popCount,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "mascot_scale",
        finishedListener = { popCount = 1f }
    )

    Box(
        modifier = modifier
            .size(size)
            .graphicsLayer {
                translationY = bobDp * density
                rotationX = animTiltX
                rotationY = animTiltY
                scaleX = animScale
                scaleY = animScale
                cameraDistance = 12f * density
            }
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragEnd = {
                        tiltX = 0f
                        tiltY = 0f
                    },
                    onDragCancel = {
                        tiltX = 0f
                        tiltY = 0f
                    }
                ) { change, dragAmount ->
                    change.consume()
                    tiltY = (tiltY + dragAmount.x * 0.35f).coerceIn(-24f, 24f)
                    tiltX = (tiltX - dragAmount.y * 0.35f).coerceIn(-24f, 24f)
                }
            }
            .clickable {
                popCount = 1.12f
                onTap?.invoke()
            }
            .testTag("mascot_3d_stage"),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.85f),
            shadowElevation = 10.dp,
            modifier = Modifier
                .fillMaxSize()
                .shadow(10.dp, RoundedCornerShape(24.dp))
        ) {
            AsyncDrawableImage(
                resId = R.drawable.img_3d_lingo_mascot,
                contentDescription = stringResource(R.string.cd_mascot_3d_illustration),
                contentScale = ContentScale.Crop,
                sampleSize = 2,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(24.dp))
            )
        }
    }
}

/**
 * 3D Tactile Card with extruded bottom lip and spring press-down motion.
 */
@Composable
fun Tactile3DCard(
    onClick: () -> Unit,
    containerColor: Color,
    lipColor: Color,
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 22.dp,
    lipHeight: Dp = 5.dp,
    content: @Composable () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.97f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "tactile_scale"
    )
    val pressOffset by animateFloatAsState(
        targetValue = if (isPressed) 3f else 0f,
        animationSpec = spring(stiffness = Spring.StiffnessHigh),
        label = "tactile_offset"
    )

    Box(
        modifier = modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    ) {
        // Extruded 3D bottom lip
        Box(
            modifier = Modifier
                .matchParentSize()
                .padding(top = lipHeight)
                .clip(RoundedCornerShape(cornerRadius))
                .background(lipColor)
        )
        // Top interactive face
        Surface(
            shape = RoundedCornerShape(cornerRadius),
            color = containerColor,
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = lipHeight)
                .offset(y = pressOffset.dp)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                content()
            }
        }
    }
}

/**
 * Animated rhythmic audio equalizer bars for Audiobooks / TTS playback.
 */
@Composable
fun AnimatedEqualizerBars(
    isPlaying: Boolean,
    barColor: Color,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "eq_bars")
    val phase1 by infiniteTransition.animateFloat(
        initialValue = 0.25f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(420, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "eq_1"
    )
    val phase2 by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 0.2f,
        animationSpec = infiniteRepeatable(tween(360, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "eq_2"
    )
    val phase3 by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 0.9f,
        animationSpec = infiniteRepeatable(tween(520, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "eq_3"
    )
    val phase4 by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 0.3f,
        animationSpec = infiniteRepeatable(tween(470, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "eq_4"
    )

    Canvas(modifier = modifier.size(width = 24.dp, height = 18.dp)) {
        val levels = if (isPlaying) floatArrayOf(phase1, phase2, phase3, phase4) else floatArrayOf(0.28f, 0.45f, 0.32f, 0.22f)
        val barWidth = size.width / 7f
        val gap = barWidth
        levels.forEachIndexed { idx, lvl ->
            val bh = (size.height * lvl).coerceAtLeast(3f)
            val x = idx * (barWidth + gap)
            val y = size.height - bh
            drawRoundRect(
                color = barColor,
                topLeft = Offset(x, y),
                size = Size(barWidth, bh),
                cornerRadius = CornerRadius(barWidth / 2f, barWidth / 2f)
            )
        }
    }
}

private data class ConfettiParticle(
    val xFraction: Float,
    val speed: Float,
    val wobblePhase: Float,
    val wobbleAmp: Float,
    val sizePx: Float,
    val color: Color,
    val rotationSpeed: Float
)

/**
 * Animated celebratory confetti burst overlay for wins, high scores, and unlocked badges.
 */
@Composable
fun CelebrationConfettiBurst(
    triggerKey: Any,
    modifier: Modifier = Modifier
) {
    val particles = remember(triggerKey) {
        val palette = listOf(
            IndigoPrimary,
            CoralSecondary,
            AmberAccent,
            MintTertiary,
            Color(0xFF38BDF8),
            Color(0xFFA855F7)
        )
        List(44) { idx ->
            val rand = kotlin.random.Random(idx * 31 + triggerKey.hashCode())
            ConfettiParticle(
                xFraction = rand.nextFloat(),
                speed = 0.65f + rand.nextFloat() * 0.75f,
                wobblePhase = rand.nextFloat() * 6.28f,
                wobbleAmp = 14f + rand.nextFloat() * 24f,
                sizePx = 8f + rand.nextFloat() * 9f,
                color = palette[idx % palette.size],
                rotationSpeed = (rand.nextFloat() - 0.5f) * 360f
            )
        }
    }
    val progress = remember(triggerKey) { androidx.compose.animation.core.Animatable(0f) }
    androidx.compose.runtime.LaunchedEffect(triggerKey) {
        progress.snapTo(0f)
        progress.animateTo(
            targetValue = 1f,
            animationSpec = tween(durationMillis = 1900, easing = LinearEasing)
        )
    }
    if (progress.value < 0.99f) {
        Canvas(modifier = modifier.fillMaxSize()) {
            val t = progress.value
            val alpha = (1f - ((t - 0.65f).coerceAtLeast(0f) / 0.35f)).coerceIn(0f, 1f)
            particles.forEach { p ->
                val y = (-0.08f + t * 1.15f * p.speed) * size.height
                val x = p.xFraction * size.width + sin(t * 7f + p.wobblePhase) * p.wobbleAmp
                if (y in -20f..(size.height + 20f)) {
                    val spin = cos(t * (8f + p.rotationSpeed * 0.01f) + p.wobblePhase)
                    drawRect(
                        color = p.color.copy(alpha = alpha),
                        topLeft = Offset(x, y),
                        size = Size(p.sizePx, (p.sizePx * (0.45f + 0.55f * kotlin.math.abs(spin))).coerceAtLeast(3f))
                    )
                }
            }
        }
    }
}
