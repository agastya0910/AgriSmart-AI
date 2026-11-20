# One-time setup. Run from the AgriSmart-AI folder in Windows PowerShell:
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\setup.ps1
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "== Backend ==" -ForegroundColor Green
Set-Location "$root\backend"
if (-not (Test-Path ".venv")) { python -m venv .venv }
$py = "$root\backend\.venv\Scripts\python.exe"
& $py -m pip install --upgrade pip
& $py -m pip install -r requirements.txt

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    $secret = & $py -c "import secrets; print(secrets.token_urlsafe(48))"
    (Get-Content ".env") -replace '^SECRET_KEY=.*', "SECRET_KEY=$secret" | Set-Content ".env"
    Write-Host "Created backend\.env with a new random SECRET_KEY"
}

Write-Host "== Training ML model ==" -ForegroundColor Green
& $py -m app.ml.train

Write-Host "== Running backend tests ==" -ForegroundColor Green
& $py -m pytest -q

Write-Host "== Frontend ==" -ForegroundColor Green
Set-Location "$root\frontend"
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
npm install

Set-Location $root
Write-Host "`nSetup complete. Start the app with:  .\start.ps1" -ForegroundColor Green
