[CmdletBinding()]
param(
  [switch]$SkipWebBuild,
  [switch]$SkipAndroidSync,
  [switch]$Release,
  [switch]$Bundle
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-FirstExistingPath {
  param(
    [string[]]$Candidates
  )

  foreach ($candidate in $Candidates) {
    if ($candidate -and (Test-Path $candidate)) {
      return $candidate
    }
  }

  return $null
}

function Invoke-CheckedCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,

    [string[]]$Arguments = @(),

    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory
  )

  Write-Host ">> $FilePath $($Arguments -join ' ')" -ForegroundColor Cyan

  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments

    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code ${LASTEXITCODE}: $FilePath $($Arguments -join ' ')"
    }
  }
  finally {
    Pop-Location
  }
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$androidRoot = Join-Path $projectRoot 'android'
$packageJsonPath = Join-Path $projectRoot 'package.json'
$gradleCache = Join-Path $projectRoot '.gradle-cache'
$releaseSigningPropertiesPath = Join-Path $androidRoot 'release-signing.properties'

if (-not (Test-Path $packageJsonPath)) {
  throw "package.json not found at '$packageJsonPath'."
}

$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$releaseVersion = $packageJson.version

if (-not $releaseVersion) {
  throw "Unable to read the app version from '$packageJsonPath'."
}

$isReleaseBuild = $Release -or $Bundle
$artifactKind = if ($Bundle) { 'bundle' } else { 'apk' }
$buildVariant = if ($isReleaseBuild) { 'release' } else { 'debug' }
$gradleTask = if ($Bundle) { 'bundleRelease' } elseif ($Release) { 'assembleRelease' } else { 'assembleDebug' }
$defaultArtifactName = if ($Bundle) { 'app-release.aab' } elseif ($Release) { 'app-release.apk' } else { 'app-debug.apk' }
$artifactPath = Join-Path $androidRoot "app\build\outputs\$artifactKind\$buildVariant\$defaultArtifactName"
$shareableArtifactName = if ($Bundle) {
  "HerCare-v$releaseVersion-release.aab"
} elseif ($Release) {
  "HerCare-v$releaseVersion-release.apk"
} else {
  "HerCare-v$releaseVersion.apk"
}
$shareableArtifactPath = Join-Path $androidRoot "app\build\outputs\$artifactKind\$buildVariant\$shareableArtifactName"
$artifactLabel = if ($Bundle) { 'release bundle' } elseif ($Release) { 'release APK' } else { 'APK' }

if (-not (Test-Path $androidRoot)) {
  throw "Android project not found at '$androidRoot'. Run 'npx.cmd cap add android' first."
}

if ($isReleaseBuild -and -not (Test-Path $releaseSigningPropertiesPath)) {
  throw "Release signing is not configured yet. Create '$releaseSigningPropertiesPath' first."
}

$javaHome = Get-FirstExistingPath @(
  $env:JAVA_HOME,
  'C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot',
  'C:\Program Files\Android\Android Studio\jbr'
)

if (-not $javaHome) {
  throw "Java JDK not found. Install Java and set JAVA_HOME first."
}

$androidSdkRoot = Get-FirstExistingPath @(
  $env:ANDROID_SDK_ROOT,
  $env:ANDROID_HOME,
  (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
)

if (-not $androidSdkRoot) {
  throw "Android SDK not found. Install Android Studio SDK components first."
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidSdkRoot
$env:ANDROID_SDK_ROOT = $androidSdkRoot
$env:GRADLE_USER_HOME = $gradleCache

$pathParts = @(
  (Join-Path $env:JAVA_HOME 'bin'),
  (Join-Path $env:ANDROID_SDK_ROOT 'platform-tools'),
  $env:Path
)

$env:Path = ($pathParts -join ';')

Write-Host "Using JAVA_HOME: $env:JAVA_HOME" -ForegroundColor DarkGray
Write-Host "Using ANDROID_SDK_ROOT: $env:ANDROID_SDK_ROOT" -ForegroundColor DarkGray

if (-not $SkipWebBuild) {
  Invoke-CheckedCommand -FilePath 'npm.cmd' -Arguments @('run', 'build') -WorkingDirectory $projectRoot
}

if (-not $SkipAndroidSync) {
  Invoke-CheckedCommand -FilePath 'npx.cmd' -Arguments @('cap', 'sync', 'android') -WorkingDirectory $projectRoot
}

Invoke-CheckedCommand -FilePath '.\gradlew.bat' -Arguments @($gradleTask, '--no-daemon', '--console=plain') -WorkingDirectory $androidRoot

if (-not (Test-Path $artifactPath)) {
  throw "Build finished but '$artifactPath' was not found."
}

$artifact = Get-Item $artifactPath

Copy-Item $artifact.FullName $shareableArtifactPath -Force
$shareableArtifact = Get-Item $shareableArtifactPath

Write-Host ""
Write-Host "Shareable $artifactLabel ready:" -ForegroundColor Green
Write-Host $shareableArtifact.FullName -ForegroundColor Green
Write-Host "Size: $([Math]::Round($shareableArtifact.Length / 1MB, 2)) MB" -ForegroundColor Green
Write-Host "Updated: $($shareableArtifact.LastWriteTime)" -ForegroundColor Green
