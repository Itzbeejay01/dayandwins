<?php

/**
 * Imports original Stitch-generated illustration URLs into local, bundled PNG
 * assets. These URLs come from the project's user-provided Stitch HTML export.
 *
 * php scripts/cache-stitch-art.php
 */

declare(strict_types=1);

if (! extension_loaded('gd')) {
    fwrite(STDERR, "GD is needed to import Stitch artwork.\n");
    exit(1);
}

$urls = [
    'journal' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvodyPv4mYkUzGv3MSmzX_fdwrKE6veXV5BDjt5V8haP9ybUVIolsYH79xObXZFyqq4d7aCXixpyiuub_nmOU5Ws_FSGlzpmzxX25YHduUHnNcq9GuAkLWsM91Bs9_8y_lNXLTHyQQ3NhXT76-dbu-9gPP8RUPIX-BAoCp33zRP1QtkVDhCCWmTuEE8dVh00RstFcvr3zH2UX33LdryZ01JyvvH2smdJNQ742I-g4kSjttHM-KBVS2kA',
    'trophy' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfYysbX1xZAHCvm0kZYWOsm1bxi5Y6M7oZoqtYiSssnL9y9AHZsqleImEjCXeooFyFkthK48xN1cMQUiMgk7n-IoKLIKLTIc_kw9yhLoEVDz1xdgRPgGxMBCPednQyV-1HbpvpcOFHDYQMW4fRs6Gh2337JzP9Gs0EulGethJzD_yIIPPv27SoyLgGcrKM2bHWUuqPAIvgFRlTWsBD7qIVzVRdJhmG9YW8rr7qmUKpKp9QwvLyVmisAw',
    'flame' => 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlwyvofVPuwLYoI3g2piZ4aV8H_E-rpcEGjzU5GwladNjRGA3iUSejRf7rtfBGcXAKULPlu31wzMiYQSKAxvj5WguuBDHULvhC3-W8M-r8q5NUKFGFhHIU9p9K6SMXcO6yhgNPCsIWXyzp_crmcs29Um7KV4Xqt6qSVqQ8lHtM9iPy0E5FOtowItGhHuvu_4X6w2GGAyY2TT-vM3NOdVuktkV0HuAhWcgrtRojTRB7WyN6Ui4qjEPbnA',
];

$target = dirname(__DIR__).'/public/brand';
if (! is_dir($target)) {
    mkdir($target, 0775, true);
}

$failed = 0;
foreach ($urls as $name => $url) {
    $destination = $target.'/stitch-'.$name.'.png';
    $context = stream_context_create([
        'http' => [
            'timeout' => 25,
            'follow_location' => 1,
            'header' => "User-Agent: DaysAndWinsAssetImporter/1.0\r\n",
        ],
    ]);

    $bytes = @file_get_contents($url, false, $context);

    if ($bytes === false || strlen($bytes) > 8 * 1024 * 1024) {
        fwrite(STDERR, 'Could not download artwork for '.$name."\n");
        $failed++;

        continue;
    }

    $image = @imagecreatefromstring($bytes);

    if (! $image instanceof GdImage) {
        fwrite(STDERR, 'Stitch returned a non-image for '.$name."\n");
        $failed++;

        continue;
    }

    imagepalettetotruecolor($image);
    imagealphablending($image, false);
    imagesavealpha($image, true);
    imagepng($image, $destination, 9);
    imagedestroy($image);
    fwrite(STDOUT, 'Saved '.$destination."\n");
}

exit($failed === 0 ? 0 : 1);
