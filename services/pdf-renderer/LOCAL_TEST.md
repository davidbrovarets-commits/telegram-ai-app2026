# PDF Renderer - Lokaalne Test

## 1. Käivita server lokaalult
```powershell
cd C:\Projektid\telegram-ai-app\services\pdf-renderer
node src/server.js
```

Peaks nägema:
```
PDF Renderer listening on port 8080
```

## 2. Testi curl'iga (PowerShellis)
```powershell
$body = @{
    html = "<html><body><h1>Test PDF</h1><p>This is a test.</p></body></html>"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:8080/render-pdf -Method POST -Body $body -ContentType "application/json" -OutFile test.pdf
```

Peaks genereerima `test.pdf` faili.

## 3. Kui see töötab
Siis saame selle deployda.

## 4. Kui see ei tööta
- Kontrolli, kas Puppeteer on installitud (`npm install`)
- Vaata errore konsoolist
