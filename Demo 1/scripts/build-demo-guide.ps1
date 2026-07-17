$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root 'deliverables\YDP_Automation_Demo_Guide.html'
$pdfPath = Join-Path $root 'YDP_Automation_Demo_Guide.pdf'

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Demo guide source not found: $sourcePath"
}

$browserCandidates = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
)

$browser = $browserCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $browser) {
    throw 'Google Chrome or Microsoft Edge is required to render the demo guide PDF.'
}

$sourcePath = (Resolve-Path -LiteralPath $sourcePath).Path
$sourceUri = [System.Uri]::new($sourcePath).AbsoluteUri
$profilePath = Join-Path $env:TEMP ('ydp-demo-pdf-' + [System.Guid]::NewGuid().ToString('N'))

New-Item -ItemType Directory -Path $profilePath -Force | Out-Null

try {
    $arguments = @(
        '--headless=new',
        '--disable-gpu',
        '--disable-extensions',
        '--run-all-compositor-stages-before-draw',
        '--no-pdf-header-footer',
        "--user-data-dir=`"$profilePath`"",
        "--print-to-pdf=`"$pdfPath`"",
        "`"$sourceUri`""
    )

    $process = Start-Process -FilePath $browser -ArgumentList $arguments -Wait -PassThru -WindowStyle Hidden

    if ($process.ExitCode -ne 0) {
        throw "Browser PDF rendering failed with exit code $($process.ExitCode)."
    }

    if (-not (Test-Path -LiteralPath $pdfPath)) {
        throw "The browser completed without creating the PDF: $pdfPath"
    }

    Write-Output "Created $pdfPath"
}
finally {
    $resolvedTemp = [System.IO.Path]::GetFullPath($env:TEMP)
    $resolvedProfile = [System.IO.Path]::GetFullPath($profilePath)
    if ($resolvedProfile.StartsWith($resolvedTemp, [System.StringComparison]::OrdinalIgnoreCase) -and
        (Split-Path -Leaf $resolvedProfile).StartsWith('ydp-demo-pdf-')) {
        Remove-Item -LiteralPath $resolvedProfile -Recurse -Force -ErrorAction SilentlyContinue
    }
}
