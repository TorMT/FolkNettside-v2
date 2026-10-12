# FolkNettside V2 – lokale GitHub-oppdateringer til NTNUs webedit.
# Krever Git, Python 3.10+ og Node.js. Standard uten -Apply er tørrkjøring.
# Bruk kun v2-staging; eksisterende NTNU rot, semestre og PHP røres aldri.
[CmdletBinding()]
param(
    [switch]$Configure,
    [string]$WebRoot,
    [string]$BackupRoot,
    [switch]$Apply,
    [string]$Rollback,
    [switch]$NoPull
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
$ConfigFolder = Join-Path ([Environment]::GetFolderPath("ApplicationData")) "FolkNettsideV2"
$ConfigPath = Join-Path $ConfigFolder "webedit-paths.json"

function Invoke-Checked([string]$Name, [string[]]$Arguments) {
    & $Name @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Name exited with status $LASTEXITCODE"
    }
}
function Invoke-Python([string[]]$Arguments) {
    $launcher = Get-Command py -ErrorAction SilentlyContinue
    if ($launcher) { Invoke-Checked $launcher.Source (@("-3") + $Arguments); return }
    $launcher = Get-Command python -ErrorAction SilentlyContinue
    if (-not $launcher) { throw "Python 3 is required." }
    Invoke-Checked $launcher.Source $Arguments
}
function Require-Host([string]$Root) {
    if (-not $Root -or -not (Test-Path -LiteralPath (Join-Path $Root "index.html") -PathType Leaf)) {
        throw "webedit root is missing its existing index.html."
    }
    if (-not (Test-Path -LiteralPath (Join-Path $Root "semestre") -PathType Container)) {
        throw "webedit root has no 'semestre' directory; refusing wrong target."
    }
}

if ($Configure) {
    if ($Apply -or $Rollback) { throw "-Configure cannot be combined with deployment or rollback." }
    if (-not $WebRoot -or -not $BackupRoot) {
        throw "Configure with -WebRoot <verified webedit path> -BackupRoot <outside webedit>."
    }
    Require-Host $WebRoot
    $resolvedRoot = (Resolve-Path -LiteralPath $WebRoot).ProviderPath.TrimEnd('\', '/')
    $resolvedBackup = [IO.Path]::GetFullPath($BackupRoot).TrimEnd('\', '/')
    if ($resolvedBackup -eq $resolvedRoot -or
        $resolvedBackup.StartsWith($resolvedRoot + [IO.Path]::DirectorySeparatorChar,
                                   [StringComparison]::OrdinalIgnoreCase)) {
        throw "Backups must stay outside public NTNU webroot."
    }
    New-Item -ItemType Directory -Force -Path $ConfigFolder | Out-Null
    @{webroot=$resolvedRoot;backupRoot=$resolvedBackup} |
        ConvertTo-Json | Set-Content -LiteralPath $ConfigPath -Encoding UTF8
    Write-Host "Paths saved outside Git and webedit: $ConfigPath"
    Write-Host "Next: .\Oppdater-FolkNettside.ps1 (dry-run), then -Apply after reviewing."
    return
}

if ($Rollback) {
    if ($WebRoot -or $BackupRoot -or $NoPull) {
        throw "Rollback takes the release backup path only."
    }
    $args = @((Join-Path $RepoRoot "scripts/ntnu_release.py"), "--rollback", $Rollback)
    if ($Apply) { $args += "--apply" }
    Invoke-Python $args
    return
}

if (Test-Path -LiteralPath $ConfigPath) {
    $saved = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
    if (-not $WebRoot) { $WebRoot = [string]$saved.webroot }
    if (-not $BackupRoot) { $BackupRoot = [string]$saved.backupRoot }
}
if (-not $WebRoot -or -not $BackupRoot) {
    throw "First run: .\Oppdater-FolkNettside.ps1 -Configure -WebRoot <path> -BackupRoot <outside-webedit-path>"
}
Require-Host $WebRoot
Invoke-Checked "git" @("-C", $RepoRoot, "rev-parse", "--is-inside-work-tree")
$branch = (& git -C $RepoRoot branch --show-current).Trim()
if ($LASTEXITCODE -ne 0 -or $branch -ne "main") {
    throw "Only the main branch is allowed for NTNU releases."
}
$remote = (& git -C $RepoRoot remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or
    $remote -notmatch '^(https://github\.com/|git@github\.com:)TorMT/FolkNettside-v2(\.git)?$') {
    throw "Unexpected origin Git remote: $remote"
}
$dirty = (& git -C $RepoRoot status --porcelain).Trim()
if ($LASTEXITCODE -ne 0 -or $dirty) {
    throw "Git working tree is not clean. Commit/stash changes before deploying."
}

if ($Apply -and -not $NoPull) {
    Invoke-Checked "git" @("-C", $RepoRoot, "pull", "--ff-only", "origin", "main")
}
$commit = (& git -C $RepoRoot rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $commit -notmatch '^[a-f0-9]{40}$') {
    throw "Could not resolve Git commit SHA."
}
Set-Location -LiteralPath $RepoRoot

Write-Host "Validating V2 code at $commit"
Invoke-Python @("scripts/audit_public_assets.py")
Invoke-Python @("scripts/validate_content.py")
Invoke-Checked "npm" @("test")
Invoke-Python @("-m", "unittest", "discover", "-s", "tests", "-p", "test_ntnu_release.py", "-v")
Invoke-Python @("-m", "unittest", "discover", "-s", "tests", "-p", "test_publish_ntnu_staging.py", "-v")

Write-Host "Building code-only NTNU bundle (no semester files)."
Invoke-Python @("scripts/build_ntnu_staging.py", "--version", $commit)

$stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssfffZ")
$releaseDir = Join-Path $BackupRoot ("FolkNetV2-" + $stamp)
$args = @("scripts/ntnu_release.py", "--stage", ".deploy-ntnu-staging",
          "--webroot", $WebRoot, "--backup-dir", $releaseDir)
if ($Apply) { $args += "--apply" }
Invoke-Python $args
if ($Apply) {
    Write-Host "Staging deployment finished. Check https://tormt.folk.ntnu.no/v2-staging/"
    Write-Host "Rollback with:"
    Write-Host "  .\Oppdater-FolkNettside.ps1 -Rollback `"$releaseDir`" -Apply"
} else {
    Write-Host "Dry run only; no files changed on webedit. Use -Apply after reviewing."
}
