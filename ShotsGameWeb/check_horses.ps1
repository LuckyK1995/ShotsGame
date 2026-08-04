Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem 'd:\ShotsGame\public\images\horse-*.png'
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $w = $img.Width
    $h = $img.Height
    $size = (Get-Item $f.FullName).Length
    $img.Dispose()
    Write-Output "$($f.Name) ${w}x${h} $($size)bytes"
}
