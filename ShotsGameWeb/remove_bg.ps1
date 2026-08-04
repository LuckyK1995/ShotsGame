Add-Type -AssemblyName System.Drawing

function Convert-RGBtoHSL($r, $g, $b) {
    $rN = $r / 255.0
    $gN = $g / 255.0
    $bN = $b / 255.0
    $max = [Math]::Max([Math]::Max($rN, $gN), $bN)
    $min = [Math]::Min([Math]::Min($rN, $gN), $bN)
    $delta = $max - $min
    $L = ($max + $min) / 2.0
    $S = 0.0
    if ($delta -ne 0) {
        if ($L -lt 0.5) { $S = $delta / ($max + $min) }
        else { $S = $delta / (2.0 - $max - $min) }
    }
    return @{ L = $L; S = $S }
}

function Remove-Background($file) {
    Write-Output "Processing: $($file.Name)"
    $img = [System.Drawing.Image]::FromFile($file.FullName)
    $bmp = New-Object System.Drawing.Bitmap($img)
    $img.Dispose()
    $w = $bmp.Width
    $h = $bmp.Height

    # Pass 1: mark transparent pixels (white or dark background)
    for ($x = 0; $x -lt $w; $x++) {
        for ($y = 0; $y -lt $h; $y++) {
            $px = $bmp.GetPixel($x, $y)
            $hsl = Convert-RGBtoHSL $px.R $px.G $px.B
            # White background (L > 0.85, S < 0.15) OR Dark background (L < 0.45, S < 0.30)
            $isWhiteBg = ($hsl.L -gt 0.85 -and $hsl.S -lt 0.15)
            $isDarkBg = ($hsl.L -lt 0.45 -and $hsl.S -lt 0.30)
            if ($isWhiteBg -or $isDarkBg) {
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            }
        }
    }

    # Pass 2-4: 3 rounds of edge feathering (semi-transparent pixels near transparent edges)
    for ($round = 0; $round -lt 3; $round++) {
        $feathered = @()
        for ($x = 0; $x -lt $w; $x++) {
            for ($y = 0; $y -lt $h; $y++) {
                $px = $bmp.GetPixel($x, $y)
                if ($px.A -eq 255) {
                    # Check if any 8-neighbor is transparent
                    $hasTransparentNeighbor = $false
                    for ($dx = -1; $dx -le 1; $dx++) {
                        for ($dy = -1; $dy -le 1; $dy++) {
                            if ($dx -eq 0 -and $dy -eq 0) { continue }
                            $nx = $x + $dx
                            $ny = $y + $dy
                            if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
                                $npx = $bmp.GetPixel($nx, $ny)
                                if ($npx.A -eq 0) { $hasTransparentNeighbor = $true; break }
                            }
                        }
                        if ($hasTransparentNeighbor) { break }
                    }
                    if ($hasTransparentNeighbor) {
                        $feathered += @{x=$x; y=$y; px=$px}
                    }
                }
            }
        }
        # Apply feathering (reduce alpha to ~150 for edge pixels)
        foreach ($fp in $feathered) {
            $bmp.SetPixel($fp.x, $fp.y, [System.Drawing.Color]::FromArgb(150, $fp.px.R, $fp.px.G, $fp.px.B))
        }
        Write-Output "  Round $($round+1) feathered: $($feathered.Count) edge pixels"
    }

    # Save (overwrite) - preserve PNG format with alpha
    $bmp.Save($file.FullName, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "  Saved: $($file.Name)"
}

$files = Get-ChildItem 'd:\ShotsGame\public\images\horse-*.png' | Where-Object { $_.Name -ne 'horse-icon.png' }
foreach ($f in $files) {
    Remove-Background $f
}
Write-Output "All done."
