# FolkNettside V2 — metadata-only course indexing from local Windows/webedit.
# Configuration is stored outside Git and NTNU (AppData). Dry run by default.
[CmdletBinding()]
param(
    [switch]$Configure,
    [string]$WebRoot,
    [string]$Allowlist,
    [string]$BackupRoot,
    [switch]$Apply,
    [switch]$AllowRemovals
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot
$ConfigFolder = Join-Path ([Environment]::GetFolderPath("ApplicationData")) "FolkNettsideV2"
$ConfigFile = Join-Path $ConfigFolder "course-index-paths.json"
$ReleaseConfig = Join-Path $ConfigFolder "webedit-paths.json"

function Invoke-Python([string[]]$Params) {
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        & $py.Source -3 @Params
    } else {
        $python = Get-Command python -ErrorAction SilentlyContinue
        if (-not $python) { throw "Python 3 is required." }
        & $python.Source @Params
    }
    if ($LASTEXITCODE -ne 0) { throw "Course index validation failed (exit $LASTEXITCODE)." }
}
function Require-File([string]$Path) {
    if (-not $Path -or -not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required reviewed file is missing: $Path"
    }
}
if (Test-Path -LiteralPath $ReleaseConfig) {
    $release = Get-Content -LiteralPath $ReleaseConfig -Raw | ConvertFrom-Json
    if (-not $WebRoot) { $WebRoot = [string]$release.webroot }
}
if (Test-Path -LiteralPath $ConfigFile) {
    $saved = Get-Content -LiteralPath $ConfigFile -Raw | ConvertFrom-Json
    if (-not $WebRoot) { $WebRoot = [string]$saved.webroot }
    if (-not $Allowlist) { $Allowlist = [string]$saved.allowlist }
    if (-not $BackupRoot) { $BackupRoot = [string]$saved.backupRoot }
}
if (-not $WebRoot -or -not $Allowlist -or -not $BackupRoot) {
    throw "First configure: .\Update-Kursindeks.ps1 -Configure -WebRoot <verified-webedit> -Allowlist <private-reviewed-json> -BackupRoot <folder-outside-webedit>"
}
Require-File $Allowlist
Require-File (Join-Path $WebRoot "index.html")
Require-File (Join-Path $WebRoot "v2-staging/index.html")
if (-not (Test-Path -LiteralPath (Join-Path $WebRoot "semestre") -PathType Container)) {
    throw "Expected NTNU semester root is not mounted."
}
if ($Configure) {
    if ($Apply -or $AllowRemovals) { throw "Configuration cannot publish a catalog." }
    $WebRoot = (Resolve-Path -LiteralPath $WebRoot).ProviderPath
    $Allowlist = (Resolve-Path -LiteralPath $Allowlist).ProviderPath
    $BackupRoot = [IO.Path]::GetFullPath($BackupRoot)
    $fullRoot = [IO.Path]::GetFullPath($WebRoot).TrimEnd('\','/')
    $fullBackup = $BackupRoot.TrimEnd('\','/')
    if ($fullBackup.Equals($fullRoot,[StringComparison]::OrdinalIgnoreCase) -or
        $fullBackup.StartsWith($fullRoot + [IO.Path]::DirectorySeparatorChar,
           [StringComparison]::OrdinalIgnoreCase)) {
        throw "Backup location must be outside NTNU webedit."
    }
    New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
    New-Item -ItemType Directory -Force -Path $ConfigFolder | Out-Null
    @{webroot=$WebRoot;allowlist=$Allowlist;backupRoot=$BackupRoot} |
        ConvertTo-Json | Set-Content -LiteralPath $ConfigFile -Encoding UTF8
    Write-Host "Reviewed catalog paths stored locally: $ConfigFile"
    Write-Host "Next: .\Update-Kursindeks.ps1 (dry run), then -Apply after review."
    return
}
if (-not (Test-Path -LiteralPath $BackupRoot -PathType Container) -and $Apply) {
    throw "External backup folder missing. Run -Configure first."
}
$pythonArgs = @((Join-Path $Root "scripts/publish_ntnu_autocatalog.py"),
    "--webroot", $WebRoot, "--allowlist", $Allowlist, "--backup-root", $BackupRoot)
if ($Apply) { $pythonArgs += "--apply" }
if ($AllowRemovals) {
    if (-not $Apply) { throw "Mass-removal override requires explicit -Apply." }
    $pythonArgs += "--allow-removals"
}
Invoke-Python $pythonArgs
if ($Apply) {
    Write-Host "V2 catalog checked. Refresh the future NTNU V2 staging page to see changes."
} else {
    Write-Host "Read-only dry run finished. No original files were changed."
}
