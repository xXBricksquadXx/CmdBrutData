[CmdletBinding()]
param(
  # Path to tldr.zip OR a folder that contains 'pages'
  [Parameter(Mandatory = $true, Position = 0)]
  [Alias('Input')] # keep old flag working: -Input
  [string] $Source,

  # Where to write the static site output
  [Parameter()]
  [string] $OutDir = (Join-Path $PSScriptRoot '..\site'),

  # If $Source is a folder, allow pointing at repo root and auto-find /pages
  [Parameter()]
  [switch] $AutoFindPages,

  # Remove OutDir/pages and OutDir/index.json before rebuilding
  [Parameter()]
  [switch] $Clean
)

$ErrorActionPreference = 'Stop'

function Get-DescFromTldrFile([string]$File) {
  $lines = Get-Content -LiteralPath $File -ErrorAction SilentlyContinue
  $descLines = @()
  foreach ($ln in $lines) {
    if ($ln -like '> *') { $descLines += ($ln -replace '^>\s*', '').Trim() }
    elseif ($descLines.Count -gt 0) { break }
  }
  return (($descLines -join ' ').Trim())
}

# Prepare output
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$pagesOut = Join-Path $OutDir 'pages'
$indexPath = Join-Path $OutDir 'index.json'

if ($Clean) {
  Remove-Item -Recurse -Force $pagesOut  -ErrorAction SilentlyContinue
  Remove-Item -Force          $indexPath -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Force -Path $pagesOut | Out-Null

$tmp = $null
$pagesRoot = $null

# Resolve pagesRoot
if (Test-Path $Source -PathType Leaf) {
  # Zip
  $tmp = Join-Path $env:TEMP ("cmdbrutdata_" + [guid]::NewGuid().ToString('n'))
  New-Item -ItemType Directory -Force -Path $tmp | Out-Null
  Expand-Archive -Path $Source -DestinationPath $tmp -Force

  $hit = Get-ChildItem -Path $tmp -Directory -Recurse -Filter 'pages' -ErrorAction SilentlyContinue |
  Select-Object -First 1

  if (-not $hit) { throw "Zip did not contain a 'pages' folder: $Source" }
  $pagesRoot = $hit.FullName
}
elseif (Test-Path $Source -PathType Container) {
  $pagesRoot = $Source

  if ($AutoFindPages) {
    $maybe = Join-Path $Source 'pages'
    if (Test-Path $maybe) { $pagesRoot = $maybe }
  }

  # If user points directly at tldr repo root, try /pages
  $maybePages = Join-Path $pagesRoot 'pages'
  if (Test-Path $maybePages) { $pagesRoot = $maybePages }

  if (-not (Test-Path $pagesRoot)) { throw "Pages folder not found at: $pagesRoot" }
}
else {
  throw "Source not found: $Source"
}

# Copy pages -> site/pages (portable)
Copy-Item -Recurse -Force -Path (Join-Path $pagesRoot '*') -Destination $pagesOut

# Build site/index.json (portable doc paths)
$platformPriority = @{ common = 0; linux = 1; osx = 2; windows = 3; sunos = 4 }
$files = Get-ChildItem -Path $pagesOut -Filter '*.md' -Recurse -File -ErrorAction SilentlyContinue

$best = @{}
foreach ($f in $files) {
  $platform = Split-Path -Leaf (Split-Path -Parent $f.FullName)
  $name = [IO.Path]::GetFileNameWithoutExtension($f.Name)
  if (-not $name) { continue }

  $desc = Get-DescFromTldrFile $f.FullName

  # Relative URL path under site/
  $rel = $f.FullName.Substring((Resolve-Path $OutDir).Path.Length).TrimStart('\', '/')
  $rel = $rel -replace '\\', '/'

  $obj = [pscustomobject]@{
    name        = $name
    description = $desc
    platform    = $platform
    doc         = $rel
  }

  if (-not $best.ContainsKey($name)) { $best[$name] = $obj; continue }

  $cur = $best[$name]
  $pNew = $platformPriority[$platform]
  $pCur = $platformPriority[$cur.platform]
  if ($pNew -lt $pCur) { $best[$name] = $obj }
}

$index = $best.Values | Sort-Object name
$index | ConvertTo-Json -Depth 4 | Set-Content -Path $indexPath -Encoding UTF8

if ($tmp) { Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue }

[pscustomobject]@{
  OutDir = (Resolve-Path $OutDir).Path
  Pages  = (Resolve-Path $pagesOut).Path
  Index  = (Resolve-Path $indexPath).Path
  Count  = $index.Count
}
