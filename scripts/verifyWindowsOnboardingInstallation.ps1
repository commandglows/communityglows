# Run only on the disposable Windows CI runner, never against a user's installation.
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or -not $IsWindows -or -not $env:RUNNER_TEMP) {
  throw 'Windows installer acceptance requires the disposable GitHub Actions runner.'
}

$acceptanceRoot = Join-Path $env:RUNNER_TEMP 'communityglows-onboarding-installation-acceptance'
if (Test-Path -LiteralPath $acceptanceRoot) { throw 'Acceptance directory already exists.' }
New-Item -ItemType Directory -Path $acceptanceRoot | Out-Null
$markerName = 'communityglows-onboarding-installation-v1'
$nsis = @(Get-ChildItem 'src-tauri/target/release/bundle/nsis/*.exe')
$msi = @(Get-ChildItem 'src-tauri/target/release/bundle/msi/*.msi')
if ($nsis.Count -ne 1 -or $msi.Count -ne 1) { throw 'Expected exactly one NSIS and one MSI package.' }

# This sentinel contains no accounts, credentials or actual user data.
$sentinels = @($env:APPDATA, $env:LOCALAPPDATA) | ForEach-Object {
  $directory = Join-Path $_ 'com.communityglows.desktop'
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
  $sentinel = Join-Path $directory 'onboarding-ci-preserve.txt'
  if (Test-Path -LiteralPath $sentinel) { throw 'User-data sentinel already exists.' }
  Set-Content -LiteralPath $sentinel -Value 'keep-existing-user-data' -NoNewline
  $sentinel
}

function Assert-UserDataPreserved {
  foreach ($sentinel in $sentinels) {
    if ((Get-Content -LiteralPath $sentinel -Raw) -ne 'keep-existing-user-data') {
      throw 'Installer changed existing AppData.'
    }
  }
  # Silent package tests must never start the normal Tauri application.
  if (Get-Process -Name 'app' -ErrorAction SilentlyContinue) {
    throw 'The installer unexpectedly started the application.'
  }
}

function Read-Witness([string] $directory) {
  $value = Get-Content -LiteralPath (Join-Path $directory $markerName) -Raw
  if ($value -cnotmatch '^[a-f0-9]{64}$') { throw 'Missing or invalid installer witness.' }
  return $value
}

function Run-Package([string] $executable, [string[]] $arguments) {
  $process = Start-Process -FilePath $executable -ArgumentList $arguments -WindowStyle Hidden -PassThru -Wait
  if ($process.ExitCode -notin @(0, 3010)) { throw "Package operation failed with exit code $($process.ExitCode)." }
  Assert-UserDataPreserved
}

$nsisDirectory = Join-Path $acceptanceRoot 'nsis'
Run-Package $nsis[0].FullName @('/S', "/D=$nsisDirectory")
$first = Read-Witness $nsisDirectory
Run-Package $nsis[0].FullName @('/S', "/D=$nsisDirectory")
if ((Read-Witness $nsisDirectory) -eq $first) { throw 'NSIS reinstall did not rotate the witness.' }
Run-Package (Join-Path $nsisDirectory 'uninstall.exe') @('/S', "_?=$nsisDirectory")
if (Test-Path -LiteralPath (Join-Path $nsisDirectory $markerName)) { throw 'NSIS uninstall left the witness.' }
Write-Output 'NSIS: install, identical-package reinstall, uninstall and AppData preservation passed.'

$msiDirectory = Join-Path $acceptanceRoot 'msi'
Run-Package 'msiexec.exe' @('/i', "`"$($msi[0].FullName)`"", '/qn', '/norestart', "INSTALLDIR=`"$msiDirectory`"")
$first = Read-Witness $msiDirectory
Run-Package 'msiexec.exe' @('/i', "`"$($msi[0].FullName)`"", '/qn', '/norestart', 'REINSTALL=ALL', 'REINSTALLMODE=amus', "INSTALLDIR=`"$msiDirectory`"")
if ((Read-Witness $msiDirectory) -eq $first) { throw 'MSI identical-package repair/reinstall did not rotate the witness.' }
Run-Package 'msiexec.exe' @('/x', "`"$($msi[0].FullName)`"", '/qn', '/norestart')
if (Test-Path -LiteralPath (Join-Path $msiDirectory $markerName)) { throw 'MSI uninstall left the witness.' }
Write-Output 'MSI: install, identical-package repair/reinstall, uninstall and AppData preservation passed.'

# Never print installation generations or any runtime environment values.
Assert-UserDataPreserved
foreach ($sentinel in $sentinels) { Remove-Item -LiteralPath $sentinel }
if ($env:GITHUB_STEP_SUMMARY) {
  'Windows onboarding lifecycle: both generated packages rotate their witness on identical-package reinstall/repair, remove it on uninstall, preserve AppData, and do not start the normal application.' >> $env:GITHUB_STEP_SUMMARY
}
