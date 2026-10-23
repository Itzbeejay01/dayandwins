<?php

/**
 * Generate the static iOS/Android launch assets for NativePHP Mobile v4.
 * Run: php scripts/generate-native-assets.php
 *
 * Requires ext-gd, which is also required by NativePHP's icon/splash pipeline.
 * The animated transition is handled in resources/js/components/brand-splash.tsx.
 */

declare(strict_types=1);

if (! extension_loaded('gd')) {
    fwrite(STDERR, "PHP GD is required. Enable ext-gd and rerun this command.\n");
    exit(1);
}

$public = dirname(__DIR__).'/public';

function rgb(int $hex): array
{
    return [($hex >> 16) & 255, ($hex >> 8) & 255, $hex & 255];
}

function ink(GdImage $image, int $hex, int $alpha = 0): int
{
    [$r, $g, $b] = rgb($hex);

    return imagecolorallocatealpha($image, $r, $g, $b, $alpha);
}

function rect(GdImage $image, float $x1, float $y1, float $x2, float $y2, int $color): void
{
    imagefilledrectangle($image, (int) $x1, (int) $y1, (int) $x2, (int) $y2, $color);
}

function art(GdImage $image, int $w, int $h, float $centerX, float $centerY, float $scale): void
{
    $violetShadow = ink($image, 0xCABBE7);
    $dark = ink($image, 0x543A95);
    $page = ink($image, 0xFFF8EC);
    $lavender = ink($image, 0xA58DE2);
    $light = ink($image, 0xC6B6F2);
    $gold = ink($image, 0xEDBB4C);
    $goldLight = ink($image, 0xFFF1B4);

    $x = fn (float $v): int => (int) round($centerX + $v * $scale);
    $y = fn (float $v): int => (int) round($centerY + $v * $scale);

    // Soft shadow and book depth.
    imagefilledellipse($image, $x(8), $y(145), $x(190) - $x(0), $y(24) - $y(0), $violetShadow);
    imagefilledpolygon($image, [$x(-103), $y(-122), $x(108), $y(-126), $x(108), $y(126), $x(-103), $y(136)], $dark);
    imagefilledpolygon($image, [$x(-89), $y(-112), $x(99), $y(-114), $x(100), $y(118), $x(-89), $y(123)], $page);
    imagefilledpolygon($image, [$x(-108), $y(-130), $x(88), $y(-130), $x(90), $y(111), $x(-108), $y(126)], $lavender);
    imagefilledpolygon($image, [$x(-108), $y(-130), $x(-77), $y(-130), $x(-77), $y(119), $x(-108), $y(126)], $dark);
    rect($image, $x(-83), $y(-125), $x(-78), $y(117), $light);
    imagefilledpolygon($image, [$x(56), $y(-129), $x(77), $y(-129), $x(77), $y(-15), $x(66), $y(-24), $x(55), $y(-14)], $gold);

    // Gold embossed star on cover.
    imagefilledpolygon($image, [
        $x(-3), $y(-35), $x(9), $y(-9), $x(32), $y(3), $x(9), $y(14),
        $x(-3), $y(39), $x(-16), $y(13), $x(-39), $y(3), $x(-16), $y(-10),
    ], $goldLight);

    // Signature star above the book.
    imagefilledpolygon($image, [
        $x(-2), $y(-217), $x(15), $y(-179), $x(54), $y(-161), $x(15), $y(-144),
        $x(-2), $y(-105), $x(-20), $y(-144), $x(-58), $y(-161), $x(-20), $y(-180),
    ], $gold);
    imagefilledellipse($image, $x(-2), $y(-160), $x(19) - $x(0), $y(19) - $y(0), $goldLight);
}

function canvas(int $width, int $height): GdImage
{
    $image = imagecreatetruecolor($width, $height);
    imageantialias($image, true);
    $base = ink($image, 0xFAF7F2);
    imagefill($image, 0, 0, $base);

    return $image;
}

$icon = canvas(1024, 1024);
art($icon, 1024, 1024, 512, 545, 1.65);
imagepng($icon, $public.'/icon.png', 9);
imagedestroy($icon);

$splash = canvas(1080, 1920);
art($splash, 1080, 1920, 540, 910, 1.7);
imagepng($splash, $public.'/splash.png', 9);
imagepng($splash, $public.'/splash-dark.png', 9);
imagedestroy($splash);

fwrite(STDOUT, "Generated public/icon.png (1024x1024), public/splash.png and public/splash-dark.png (1080x1920).\n");
