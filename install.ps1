# hubdocs installer for Windows (PowerShell).
#
#   irm https://raw.githubusercontent.com/raintr91/hubdocs/main/install.ps1 | iex
#
# Prefers WSL if available. Falls back to native Windows when Node ≥ 22 is on PATH.
#
# Env:
#   HUBDOCS_REPO, HUBDOCS_INSTALL_DIR, HUBDOCS_REF
#   HUBDOCS_USE_WSL=0 to force native Windows install

$ErrorActionPreference = 'Stop'
$repo = if ($env:HUBDOCS_REPO) { $env:HUBDOCS_REPO } else { 'raintr91/hubdocs' }
$ref = if ($env:HUBDOCS_REF) { $env:HUBDOCS_REF } else { 'main' }
$useWsl = $env:HUBDOCS_USE_WSL -ne '0'

function Test-Wsl {
  try {
    $null = & wsl.exe -e echo ok 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch { return $false }
}

if ($useWsl -and (Test-Wsl)) {
  Write-Host "Installing hubdocs inside WSL (github.com/$repo @$ref)..."
  $bash = @"
set -euo pipefail
curl -fsSL https://raw.githubusercontent.com/$repo/$ref/install.sh | bash
"@
  & wsl.exe -e bash -lc $bash
  if ($LASTEXITCODE -ne 0) { throw "WSL install failed (exit $LASTEXITCODE)" }

  Write-Host ""
  Write-Host "Configuring Cursor MCP to call WSL hubdocs..."
  & wsl.exe -e bash -lc "hubdocs init --target=auto --yes --wsl --mcp-file `$(wslpath '$env:USERPROFILE')/.cursor/mcp.json"
  if ($LASTEXITCODE -ne 0) {
    Write-Warning "Could not auto-write mcp.json. From WSL run:"
    Write-Warning "  hubdocs init --target=cursor --yes --wsl --mcp-file /mnt/c/Users/<you>/.cursor/mcp.json"
  }

  Write-Host "Done. Restart Cursor, then try MCP tool hubdocs_list_ids."
  Write-Host "CLI (WSL): wsl hubdocs version"
  return
}

# --- Native Windows (Node required) ---
$installDir = if ($env:HUBDOCS_INSTALL_DIR) { $env:HUBDOCS_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'hubdocs' }
Write-Host "Installing hubdocs natively → $installDir"

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

$cmdShim = Join-Path $binDir 'hubdocs.cmd'
@"
@echo off
node "%~dp0hubdocs.mjs" %*
"@ | Set-Content -Path $cmdShim -Encoding ASCII

Write-Host "Run: hubdocs version"
Write-Host "Then: hubdocs init --target=auto --yes   # or cursor,claude,kilo  (docs/INIT.md)"
Write-Host "Or: npx --yes github:$repo"
