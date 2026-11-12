# Repack generated square cells without resampling or repainting any pixels.
param(
    [string]$SourceName = 'koharu-faces-grid.png',
    [string]$OutputName = 'koharu-faces.png'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$assetDir = Join-Path $PSScriptRoot '../assets'
$source = [System.Drawing.Bitmap]::new((Join-Path $assetDir $SourceName))
try {
    if ($source.Width -ne 1536 -or $source.Height -ne 1024) { throw 'Expected 1536x1024 source grid' }
    $strip = [System.Drawing.Bitmap]::new(2560, 512)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($strip)
        try {
            $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
            for ($i = 0; $i -lt 5; $i++) {
                $rect = [System.Drawing.Rectangle]::new(($i % 3) * 512, [Math]::Floor($i / 3) * 512, 512, 512)
                $cell = $source.Clone($rect, $source.PixelFormat)
                try { $graphics.DrawImageUnscaled($cell, $i * 512, 0) } finally { $cell.Dispose() }
            }
        } finally { $graphics.Dispose() }
        $strip.Save((Join-Path $assetDir $OutputName), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $strip.Dispose() }
} finally { $source.Dispose() }
