$path = "temp_js.txt"
if (Test-Path $path) {
    $content = Get-Content $path -Raw
    $idx = $content.IndexOf("wbajyysqvkkdqsugupyj")
    if ($idx -ge 0) {
        $start = $idx
        $length = 600
        if ($start + $length -gt $content.Length) { $length = $content.Length - $start }
        Write-Output $content.Substring($start, $length)
    } else {
        Write-Output "Pattern not found in file"
    }
} else {
    Write-Output "File not found: $path"
}
