<?php
declare(strict_types=1);

// Fixed allowlist: never use a request parameter as a filesystem path.
$gamePages = [
    'provincie-klik' => 'games/topo/nederland-topografie-provincie-selectiespel.html',
    'provincie-schrijf' => 'games/topo/nederland-topografie-provincie-schrijfspel.html',
    'atlascode' => 'games/topo/atlascode-avontuur-3d.html',
    'europa-landen-klik' => 'games/topo/europa-landen-klikspel-3d.html',
    'europa-landen-schrijf' => 'games/topo/europa-landen-schrijfspel-3d.html',
    'europa-hoofdsteden-klik' => 'games/topo/europa-hoofdsteden-klikspel-3d.html',
    'europa-hoofdsteden-schrijf' => 'games/topo/europa-hoofdsteden-schrijfspel-3d.html',
    'europa-raster-landen' => 'games/topo/europa-raster-landen-3d.html',
    'europa-raster-hoofdsteden' => 'games/topo/europa-raster-hoofdsteden-3d.html',
    'reken-race' => 'games/rekenen/rekenen-race.html',
    'rekencraft' => 'games/rekenen/rekencraft.html',
    'getallenzee' => 'games/rekenen/getallenzee.html',
] ;
if (!isset($leercraftGameSlug) || !is_string($leercraftGameSlug) || !isset($gamePages[$leercraftGameSlug])) {
    http_response_code(404);
    exit;
}
header('Content-Type: text/html; charset=utf-8');
readfile(dirname(__DIR__, 2) . '/' . $gamePages[$leercraftGameSlug]);
