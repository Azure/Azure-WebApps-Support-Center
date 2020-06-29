<#
 .Synopsis
      Run and Publish detector
#>

[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = "Medium", PositionalBinding = $false, DefaultParameterSetName = "RunDetector")]
param (
    [Parameter(Mandatory = $true, ParameterSetName = "RunDetector")]
    [ValidateNotNullOrEmpty()]
    [switch]
    $run,

    [Parameter(Mandatory = $true, ParameterSetName = "PublishDetector")]
    [Parameter(Mandatory = $true, ParameterSetName = "PublishGist")]
    [ValidateNotNullOrEmpty()]
    [switch]
    $publish,

    [Parameter(Mandatory = $true, ParameterSetName = "UserGuide")]
    [ValidateNotNullOrEmpty()]
    [switch]
    $help,

    [Parameter(Mandatory = $true, ParameterSetName = "SystemCheck")]
    [ValidateNotNullOrEmpty()]
    [switch]
    $systemCheck,

    [Parameter(Mandatory = $false, ParameterSetName = "PublishGist")]
    [Parameter(Mandatory = $false, ParameterSetName = "PublishDetector")]
    [Parameter(Mandatory = $false, ParameterSetName = "RunDetector")]
    [System.String]
    $ResourceId = "",

    [Parameter(Mandatory = $false, ParameterSetName = "PublishDetector")]
    [Parameter(Mandatory = $false, ParameterSetName = "RunDetector")]
    [System.String]
    $DetectorFile,

    [Parameter(Mandatory = $true, ParameterSetName = "PublishGist")]
    [System.String]
    $GistFile,

    [Parameter(Mandatory = $false, ParameterSetName = "PublishGist")]
    [Parameter(Mandatory = $false, ParameterSetName = "PublishDetector")]
    [Parameter(Mandatory = $false, ParameterSetName = "RunDetector")]
    [boolean]
    $IsInternalClient = $true, 

    [Parameter(Mandatory = $false, ParameterSetName = "PublishGist")]
    [Parameter(Mandatory = $false, ParameterSetName = "PublishDetector")]
    [Parameter(Mandatory = $false, ParameterSetName = "RunDetector")]
    [boolean]
    $InternalView = $true,
    
    [Parameter(Mandatory = $false, ParameterSetName = "ManageGists")]
    [switch]
    $listGists,

    [Parameter(Mandatory = $false, ParameterSetName = "ManageGists")]
    [System.String]
    $listGist = "",

    [Parameter(Mandatory = $false, ParameterSetName = "ManageGists")]
    [System.String]
    $install = "",

    [Parameter(Mandatory = $false, ParameterSetName = "ManageGists")]
    [System.String]
    $version = ""
)

Import-Module $PSScriptRoot\..\Framework\Tools\LocalDevelopingHelper.psm1 -Force

$compilationResponse = $null

if ($listGists) {
    $json = (Get-Content "package.json" -Raw) | ConvertFrom-Json
    $output = @()
    $json.gistDefinitions.psobject.properties.name |? {
        $obj = New-Object PSCustomObject

        Add-Member -InputObject $obj -NotePropertyName ("Gists") -NotePropertyValue $_

        $output += $obj
    }

    $output | Format-Table
}

if ($listGist -ne "") {
    $json = (Get-Content "package.json" -Raw) | ConvertFrom-Json
    $config = $json.packageDefinition

    $output = @()
    $json.gistDefinitions.$listGist |? {
        $obj = New-Object PSCustomObject
        Add-Member -InputObject $obj -NotePropertyName ("Gist Version") -NotePropertyValue $_

        $url = "$($json.baseUrl)/gists/$listGist/changelist/$_"

        if ($_ -eq $config.dependencies.$listGist) {
            Add-Member -InputObject $obj -NotePropertyName ("Applens URL") -NotePropertyValue "$url (Currently installed)"
        }
        else {
            Add-Member -InputObject $obj -NotePropertyName ("Applens URL") -NotePropertyValue $url
        }

        $output += $obj
    }

    $output | Format-Table | Out-String -Width 1000
}

if ($install -ne "") {
    Install-Gist -Name $install -Version $version
}

if ($systemCheck) {
    if (Get-Command node -errorAction SilentlyContinue) {
        $current_version = (node -v)
    }

    if (Get-Command npm -errorAction SilentlyContinue) {
        $npm_version = (npm -v)
    }
 
    if ($current_version -or ([System.Version]$current_version.Replace("v", "") -lt [System.Version]"8.0.0") -or $npm_version -or ($npm_version.Replace("v", "") -lt [System.Version]"5.0.0")) {
        write-host "Node.js version: $current_version" -ForegroundColor Cyan
        write-host "Npm version: $npm_version"  -ForegroundColor Cyan
        write-host "System check passed!" -ForegroundColor Green
    }
    else {
        write-host "Please make sure you have installed Node.js version 8.x (or greater), npm version 5.x (or greater). " -ForegroundColor Cyan
        write-host "https://nodejs.org/en/download/" -ForegroundColor Cyan
    }
}

if ($run) {
    $compilationResponse = Start-Compilation  -ResourceId $ResourceId -FilePath $DetectorFile -IsInternalClient $IsInternalClient -IsInternalView $InternalView

    if ($compilationResponse.invocationOutput) {
        Write-Verbose "path: $PSScriptRoot\..\FrameWork\UI\Detector-UI-Rendering\dist\assets\invocationOutput.json" -Verbose
        $invocationOutput = $compilationResponse.invocationOutput | ConvertTo-Json -Depth 8
        [System.IO.File]::WriteAllText("$PSScriptRoot\..\FrameWork\UI\Detector-UI-Rendering\dist\assets\invocationOutput.json", $invocationOutput)

        if ($compilationResponse.compilationOutput.compilationSucceeded -eq $true) {
            http-server "$PSScriptRoot\..\Framework\UI\Detector-UI-Rendering\dist" -o /index.html -a localhost -p 8000 -c-1
        }
    }
}

if ($publish) {
    $filePath = $DetectorFile
    $isGist = $false
    if ($GistFile) {
        $gistid = (Get-Item $GistFile).BaseName
        $json = (Get-Content "package.json" -Raw) | ConvertFrom-Json

        $all = $json.gistDefinitions.$gistid
        $installed = $json.packageDefinition.dependencies.$gistid
        if ($installed -ne $all[-1]) {
            Write-Error "Please update $gistid to the latest version before publishing"
            exit
        }

        $filePath = $GistFile;
        $isGist = $true
    }

    Publish-Package -ResourceId $ResourceId -FilePath $filePath -IsInternalClient $IsInternalClient -IsInternalView $InternalView -IsGist $isGist
}

if ($help) {
    Write-Host "Command Name" -ForegroundColor Green
    Write-Host "`t.\Diag.ps1" -ForegroundColor Magenta

    Write-Host "Syntax" -ForegroundColor Green
    Write-Host "`t-run: Run detector script"-ForegroundColor Magenta
    Write-Host "`t-publish: Publish detector script" -ForegroundColor Magenta
    Write-Host "`t-resourceId: ResourceId parameter to run or publish" -ForegroundColor Magenta
    Write-Host "`t-detectorFile: Detector file to run or publish" -ForegroundColor Magenta
    Write-Host "`t-listGists: List all gists" -ForegroundColor Magenta
    Write-Host "`t-listGist <gist id>: List all versions of the gist" -ForegroundColor Magenta
    Write-Host "`t-install <gist id> [-version <version>]: Install gist. If version is not specified, install the latest version" -ForegroundColor Magenta
    Write-Host "`t-publish -GistFile <file path>: Publish gist file." -ForegroundColor Magenta
    Write-Host "`t-help: Help info for Diag command "-ForegroundColor Magenta
    Write-Host "`t-systemCheck: Check prerequisite for your compilation and publish environment" -ForegroundColor Magenta

    Write-Host "Examples" -ForegroundColor Green
    Write-Host "`t.\Diag.ps1 -run" -ForegroundColor Magenta
    Write-Host "`tRun default detector script 'detector.csx' with settings from 'detectorSettings.json'`n" -ForegroundColor cyan

    Write-Host "`t.\Diag.ps1 -run -resourceId '/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourcegroups/badsites/providers/Microsoft.Web/sites/highcpuscenario'" -ForegroundColor Magenta
    Write-Host "`tRun default detector script with spcified resourceId`n" -ForegroundColor cyan


    Write-Host "`t.\Diag.ps1 -run -detectorFile './appcrashes.csx'" -ForegroundColor Magenta
    Write-Host "`tRun detector script './appcrashes.csx'`n" -ForegroundColor cyan

    Write-Host "`t.\Diag.ps1 -publish" -ForegroundColor Magenta
    Write-Host "`tRun and publish default 'detector.csx' script with settings from 'detectorSettings.json'`n" -ForegroundColor cyan

    Write-Host "`t.\Diag.ps1 -publish -resourceId '/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourcegroups/badsites/providers/Microsoft.Web/sites/highcpuscenario'" -ForegroundColor Magenta
    Write-Host "`tRun and publish default 'detector.csx' script with specified resourceId`n" -ForegroundColor cyan

    Write-Host "`t.\Diag.ps1 -publish -detectorFile './appcrashes.csx'" -ForegroundColor Magenta
    Write-Host "`tRun and publish detector script './appcrashes.csx'`n" -ForegroundColor cyan

    Write-Host "`t.\Diag.ps1 -help" -ForegroundColor Magenta
    Write-Host "`tGet help info for Diag.ps1 command`n" -ForegroundColor cyan

    Write-Host "`t.\Diag.ps1 -systemCheck" -ForegroundColor Magenta
    Write-Host "`tCheck Node.js and Npm version'./appcrashes.csx'`n" -ForegroundColor cyan
}
