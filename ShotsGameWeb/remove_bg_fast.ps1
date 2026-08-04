Add-Type -AssemblyName System.Drawing

$csCode = @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class FastImg {
    public static string Process(string path) {
        // Load original
        using (Image orig = Image.FromFile(path)) {
            int w = orig.Width, h = orig.Height;
            // Create new 32bppArgb bitmap
            using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
                using (Graphics g = Graphics.FromImage(bmp)) {
                    g.DrawImage(orig, 0, 0, w, h);
                }

                Rectangle rect = new Rectangle(0, 0, w, h);
                BitmapData data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
                int bytes = w * h * 4;
                byte[] buf = new byte[bytes];
                Marshal.Copy(data.Scan0, buf, 0, bytes);

                // Pass 1: mark transparent pixels (white or dark background)
                int removed = 0;
                for (int i = 0; i < bytes; i += 4) {
                    byte b = buf[i], g = buf[i+1], r = buf[i+2], a = buf[i+3];
                    if (a == 0) continue;
                    double rN = r / 255.0, gN = g / 255.0, bN = b / 255.0;
                    double max = Math.Max(Math.Max(rN, gN), bN);
                    double min = Math.Min(Math.Min(rN, gN), bN);
                    double L = (max + min) / 2.0;
                    double S = 0;
                    if (max != min) {
                        if (L < 0.5) S = (max - min) / (max + min);
                        else S = (max - min) / (2.0 - max - min);
                    }
                    // Robust white detection: all channels very bright
                    double minC = Math.Min(Math.Min(rN, gN), bN);
                    bool isWhiteBg = (minC > 0.90);
                    bool isDarkBg = (L < 0.45 && S < 0.45);
                    if (isWhiteBg || isDarkBg) {
                        buf[i+3] = 0;
                        removed++;
                    }
                }

                // 3 rounds of feathering
                for (int round = 0; round < 3; round++) {
                    byte[] newBuf = new byte[bytes];
                    Array.Copy(buf, newBuf, bytes);
                    for (int y = 0; y < h; y++) {
                        for (int x = 0; x < w; x++) {
                            int idx = (y * w + x) * 4;
                            if (buf[idx+3] == 255) {
                                bool hasTransNeighbor = false;
                                for (int dy = -1; dy <= 1 && !hasTransNeighbor; dy++) {
                                    for (int dx = -1; dx <= 1 && !hasTransNeighbor; dx++) {
                                        if (dx == 0 && dy == 0) continue;
                                        int nx = x + dx, ny = y + dy;
                                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                                            int nidx = (ny * w + nx) * 4;
                                            if (buf[nidx+3] == 0) hasTransNeighbor = true;
                                        }
                                    }
                                }
                                if (hasTransNeighbor) {
                                    newBuf[idx+3] = 150;
                                }
                            }
                        }
                    }
                    Array.Copy(newBuf, buf, bytes);
                }

                Marshal.Copy(buf, 0, data.Scan0, bytes);
                bmp.UnlockBits(data);

                string tmpPath = path + ".tmp.png";
                bmp.Save(tmpPath, ImageFormat.Png);
                return tmpPath;
            }
        }
    }
}
"@
Add-Type -TypeDefinition $csCode -Language CSharp -ReferencedAssemblies 'System.Drawing'

$files = Get-ChildItem 'd:\ShotsGame\public\images\horse-*.png' | Where-Object { $_.Name -ne 'horse-icon.png' }
foreach ($f in $files) {
    Write-Output "Processing: $($f.Name)"
    $tmp = [FastImg]::Process($f.FullName)
    # Replace original with temp
    Move-Item -Path $tmp -Destination $f.FullName -Force
    Write-Output "  Done: $($f.Name)"
}
Write-Output "All complete."
