# Fix PowerShell execution policy for this session
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Resolve repo root from script location
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

# Load .env
$envFile = Join-Path $repoRoot ".env"
if (-not (Test-Path $envFile)) {
  throw "Missing env file at $envFile"
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^(?<k>[A-Za-z_][A-Za-z0-9_]*)=(?<v>.*)$') {
    [System.Environment]::SetEnvironmentVariable($matches['k'], $matches['v'])
  }
}

# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoRoot\\backend'; if (Test-Path .\\mvnw.cmd) { .\\mvnw.cmd spring-boot:run } else { mvn spring-boot:run }" -WindowStyle Normal

# Start frontend
& "C:\Program Files\nodejs\npm.cmd" run dev
