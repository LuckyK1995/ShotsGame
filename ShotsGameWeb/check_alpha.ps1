Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem 'd:\ShotsGame\public\images\horse-*.png'
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $bmp = New-Object System.Drawing.Bitmap($img)
    $w = $bmp.Width
    $h = $bmp.Height
    # Sample 4 corners and center
    $corners = @(
        @{x=0; y=0; name='TL'},
        @{x=$w-1; y=0; name='TR'},
        @{x=0; y=$h-1; name='BL'},
        @{x=$w-1; y=$h-1; name='BR'},
        @{x=[int]($w/2); y=[int]($h/2); name='Center'}
    )
    $out = "$($f.Name) ${w}x${h}: "
    foreach ($c in $corners) {
        $px = $bmp.GetPixel($c.x, $c.y)
        $out += "$($c.name)=$($px.A),$($px.R),$($px.G),$($px.B) "
    }
    Write-Output $out
    $bmp.Dispose()
    $img.Dispose()
}
