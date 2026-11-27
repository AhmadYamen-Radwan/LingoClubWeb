package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

private val LightColorScheme = lightColorScheme(
    primary = IndigoPrimary,
    onPrimary = CrispWhite,
    primaryContainer = IndigoSoft,
    onPrimaryContainer = IndigoOnSoft,
    secondary = CoralSecondary,
    onSecondary = CrispWhite,
    secondaryContainer = CoralSoft,
    onSecondaryContainer = CoralOnSoft,
    tertiary = MintTertiary,
    onTertiary = CrispWhite,
    tertiaryContainer = MintSoft,
    onTertiaryContainer = MintOnSoft,
    background = WarmCreamBg,
    onBackground = InkDark,
    surface = CrispWhite,
    onSurface = InkDark,
    surfaceVariant = WarmSurfaceVariant,
    onSurfaceVariant = InkMuted,
    outline = SubtleOutline,
    error = Color(0xFFDC2626),
    onError = CrispWhite
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF8B77FF),
    onPrimary = Color(0xFF140B4D),
    primaryContainer = Color(0xFF2D2175),
    onPrimaryContainer = IndigoSoft,
    secondary = Color(0xFFFF7D82),
    onSecondary = Color(0xFF560A0E),
    secondaryContainer = Color(0xFF5C1E23),
    onSecondaryContainer = CoralSoft,
    tertiary = Color(0xFF34D399),
    onTertiary = Color(0xFF003824),
    tertiaryContainer = Color(0xFF0B4F37),
    onTertiaryContainer = MintSoft,
    background = NightBg,
    onBackground = NightInk,
    surface = NightSurface,
    onSurface = NightInk,
    surfaceVariant = NightSurfaceHigh,
    onSurfaceVariant = NightInkMuted,
    outline = NightOutline,
    error = Color(0xFFF87171),
    onError = Color(0xFF450A0A)
)

val LingoShapes = Shapes(
    extraSmall = RoundedCornerShape(8.dp),
    small = RoundedCornerShape(12.dp),
    medium = RoundedCornerShape(18.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(32.dp)
)

@Composable
fun LingoClubTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = LingoShapes,
        content = content
    )
}
