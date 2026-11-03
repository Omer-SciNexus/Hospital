$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path $PSScriptRoot -Parent
$manifestPath = Join-Path $PSScriptRoot 'chat-insurance-image-manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$progress = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'chat-insurance-image-progress.json') -Raw | ConvertFrom-Json
$validation = @()
foreach ($entry in $manifest.assets) {
    $sourceEntry = $progress | Where-Object id -eq $entry.id
    if (@($sourceEntry).Count -ne 1) { throw "Missing or duplicate source: $($entry.file)" }
    $destination = Join-Path $projectRoot ('public/images/' + $entry.file)
    $source = [System.Drawing.Bitmap]::new($sourceEntry.source)
    $originalSize = "$($source.Width)x$($source.Height)"
    $targetWidth = if ($entry.transparent) { 1024 } else { 1536 }
    $targetHeight = 1024
    if ($source.Width -ne $targetWidth -or $source.Height -ne $targetHeight) {
        $output = [System.Drawing.Bitmap]::new($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [System.Drawing.Graphics]::FromImage($output)
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0,0,$targetWidth,$targetHeight), 0,0,$source.Width,$source.Height,[System.Drawing.GraphicsUnit]::Pixel)
        $graphics.Dispose()
        $output.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
        $output.Dispose()
    }
    $source.Dispose()
    $final = [System.Drawing.Bitmap]::new($destination)
    $corners = @($final.GetPixel(0,0).A, $final.GetPixel($final.Width-1,0).A, $final.GetPixel(0,$final.Height-1).A, $final.GetPixel($final.Width-1,$final.Height-1).A)
    $clear = 0
    $opaque = 0
    $solid = 0
    $maxAlpha = 0
    $samples = 0
    for ($y=0; $y -lt $final.Height; $y+=16) {
        for ($x=0; $x -lt $final.Width; $x+=16) {
            $alpha = $final.GetPixel($x,$y).A
            if ($alpha -eq 0) { $clear++ }
            if ($alpha -eq 255) { $opaque++ }
            if ($alpha -ge 250) { $solid++ }
            $maxAlpha = [Math]::Max($maxAlpha, $alpha)
            $samples++
        }
    }
    $dimensionsPass = $final.Width -eq $targetWidth -and $final.Height -eq $targetHeight
    # Allow one alpha level of export rounding at the canvas corners.
    # Generated subjects can peak at 254 rather than 255; require visible content.
    $alphaPass = if ($entry.transparent) { ($corners | Where-Object { $_ -gt 1 }).Count -eq 0 -and $clear -gt 0 -and $solid -gt 0 } else { $opaque -eq $samples }
    $validation += [PSCustomObject]@{
        file = $entry.file
        generatedSize = $originalSize
        finalSize = "$($final.Width)x$($final.Height)"
        transparent = $entry.transparent
        cornerAlpha = $corners
        maxSampleAlpha = $maxAlpha
        clearSampleFraction = [Math]::Round($clear/$samples,4)
        dimensionsPass = $dimensionsPass
        alphaPass = $alphaPass
        bytes = (Get-Item -LiteralPath $destination).Length
        sha256 = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
    }
    $final.Dispose()
}
$validation | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'chat-insurance-image-validation.json') -Encoding UTF8
if (($validation | Where-Object { -not $_.dimensionsPass -or -not $_.alphaPass }).Count -gt 0) { throw 'Image validation failed; inspect report.' }
if (($validation.sha256 | Select-Object -Unique).Count -ne 37) { throw 'Unexpected duplicate image.' }

$sheet = [System.Drawing.Bitmap]::new(1200, 2340)
$canvas = [System.Drawing.Graphics]::FromImage($sheet)
$canvas.Clear([System.Drawing.ColorTranslator]::FromHtml('#f4f7f7'))
$canvas.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$font = [System.Drawing.Font]::new('Arial',9)
$brush = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#17323a'))
for ($i=0; $i -lt $manifest.assets.Count; $i++) {
    $entry = $manifest.assets[$i]
    $x = ($i % 5) * 240
    $y = [Math]::Floor($i / 5) * 290
    $asset = [System.Drawing.Bitmap]::new((Join-Path $projectRoot ('public/images/' + $entry.file)))
    $scale = [Math]::Min(220 / $asset.Width, 245 / $asset.Height)
    $width = [int]($asset.Width * $scale)
    $height = [int]($asset.Height * $scale)
    $canvas.DrawImage($asset,[int]($x+10+(220-$width)/2),[int]($y+10+(245-$height)/2),$width,$height)
    $canvas.DrawString($entry.file,$font,$brush,[System.Drawing.RectangleF]::new($x+10,$y+258,225,32))
    $asset.Dispose()
}
$canvas.Dispose()
$font.Dispose()
$brush.Dispose()
$sheet.Save((Join-Path $PSScriptRoot 'chat-insurance-contact-sheet.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()
[PSCustomObject]@{Files=$validation.Count;DimensionChecksPassed=($validation | Where-Object dimensionsPass).Count;AlphaChecksPassed=($validation | Where-Object alphaPass).Count;TotalMB=[Math]::Round(($validation.bytes | Measure-Object -Sum).Sum/1MB,2)} | ConvertTo-Json

