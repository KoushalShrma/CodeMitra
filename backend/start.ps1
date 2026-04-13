# Load .env from project root and start backend
Set-Location $PSScriptRoot
$envFile = Join-Path $PSScriptRoot "..\.env"

if (-not (Test-Path $envFile)) {
  throw "Missing env file at $envFile"
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match '^(?<k>[A-Za-z_][A-Za-z0-9_]*)=(?<v>.*)$') {
    [System.Environment]::SetEnvironmentVariable($matches['k'], $matches['v'])
  }
}

if (Test-Path ".\mvnw.cmd") {
  .\mvnw.cmd spring-boot:run
} else {
  mvn spring-boot:run
}
