$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pythonPath = Join-Path $projectRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Project virtual environment is missing. Create it and install backend\requirements.txt first."
}

$wlanAddress = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
    Where-Object {
        $_.InterfaceAlias -match "WLAN|Wi-?Fi" -and
        $_.IPAddress -notlike "127.*" -and
        $_.IPAddress -notlike "169.254.*"
    } |
    Select-Object -First 1 -ExpandProperty IPAddress

if (-not $wlanAddress) {
    throw "No active Wi-Fi IPv4 address found. Connect this computer to the same Wi-Fi as the phone."
}

$env:SAYNOTE_DB_PATH = Join-Path $projectRoot "data\saynote.sqlite3"
Write-Host "SayNote API will listen only on $wlanAddress`:8011"
Write-Host "For Android preview, set miniprogram\config.js API_BASE_URL to http://$wlanAddress`:8011/api/v1."
Write-Host "Keep this window open while using the mini program."

& $pythonPath -m uvicorn sayn_note.main:app --app-dir (Join-Path $projectRoot "backend") --host $wlanAddress --port 8011
