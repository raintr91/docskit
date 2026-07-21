# docskit installer for Windows (PowerShell).
#
#   irm https://raw.githubusercontent.com/raintr91/docskit/main/install.ps1 | iex
#
# Prefers WSL if available. Falls back to native Windows when Node ≥ 22 is on PATH.
#
# Env:
#   DOCSKIT_REPO, DOCSKIT_INSTALL_DIR, DOCSKIT_REF
#   DOCSKIT_USE_WSL=0 to force native Windows install

$ErrorActionPreference = 'Stop'
$repo = if ($env:DOCSKIT_REPO) { $env:DOCSKIT_REPO } else { 'raintr91/docskit' }
$ref = if ($env:DOCSKIT_REF) { $env:DOCSKIT_REF } else { 'main' }
$useWsl = $env:DOCSKIT_USE_WSL -ne '0'

function Test-Wsl {
  try {
    $null = & wsl.exe -e echo ok 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch { return $false }
}

if ($useWsl -and (Test-Wsl)) {
  Write-Host "Installing docskit inside WSL (github.com/$repo @$ref)..."
  $bash = @"
set -euo pipefail
curl -fsSL https://raw.githubusercontent.com/$repo/$ref/install.sh | bash
"@
  & wsl.exe -e bash -lc $bash
  if ($LASTEXITCODE -ne 0) { throw "WSL install failed (exit $LASTEXITCODE)" }

  Write-Host ""
  Write-Host "Package installed. From WSL, cd into a docs hub and run:"
  Write-Host "  docskit init --location=local --yes --wsl"
  Write-Host "Then restart the agent and try MCP tool docskit_list_ids."
  Write-Host "CLI (WSL): wsl docskit version"
  return
}

# --- Native Windows (Node required) ---
$installDir = if ($env:DOCSKIT_INSTALL_DIR) { $env:DOCSKIT_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'docskit' }
Write-Host "Installing docskit natively → $installDir"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js ≥ 22 required on PATH (or use WSL install)."
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "git required on PATH."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm required on PATH."
}

$tmp = Join-Path $env:TEMP ("hd-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
try {
  git clone --depth 1 --branch $ref "https://github.com/$repo.git" (Join-Path $tmp 'src')
  if (Test-Path $installDir) { Remove-Item -Recurse -Force $installDir }
  New-Item -ItemType Directory -Force -Path (Split-Path $installDir) | Out-Null
  Move-Item (Join-Path $tmp 'src') $installDir
} finally {
  Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
}

Push-Location $installDir
try {
  npm install
  npm run build
} finally {
  Pop-Location
}

$binDir = Join-Path $installDir 'bin'
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (($userPath -split ';') -notcontains $binDir) {
  [Environment]::SetEnvironmentVariable('Path', "$binDir;$userPath", 'User')
  Write-Host "Added $binDir to User PATH (restart terminal)."
}

$cmdShim = Join-Path $binDir 'docskit.cmd'
@"
@echo off
node "%~dp0docskit.mjs" %*
"@ | Set-Content -Path $cmdShim -Encoding ASCII

Write-Host "Run: docskit version"
Write-Host "Then cd into a docs hub and run: docskit init --location=local --yes"
Write-Host "Or: npx --yes github:$repo"
