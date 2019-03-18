Add-Type -Path "$($PSScriptRoot)\References\Microsoft.IdentityModel.Clients.ActiveDirectory\Microsoft.IdentityModel.Clients.ActiveDirectory.Platform.dll"
Add-Type -Path "$($PSScriptRoot)\References\Microsoft.IdentityModel.Clients.ActiveDirectory\Microsoft.IdentityModel.Clients.ActiveDirectory.dll"
Add-type -Path "$($PSScriptRoot)\References\Newtonsoft.Json\Newtonsoft.Json.dll"

function Get-AuthenticationResult {
    $ErrorActionPreference = 'Stop'
    $VerbosePreference = 'Continue'

    # Detector-Local-Development app clientId
    $clientId = "21e09a0e-34d6-4e67-8e2e-a01fe5c8f2d5"
    $resourceId = "192bd8f2-c844-4977-aefd-77407619e80c"
    $redirectUri = New-Object system.uri("https://applens.azurewebsites.net")

    # Microsoft Tenant
    $tenantId = "72f988bf-86f1-41af-91ab-2d7cd011db47"
    $login = "https://login.microsoftonline.com"

    $promptBehavior = [Microsoft.IdentityModel.Clients.ActiveDirectory.PromptBehavior]::Auto
    $platformParams = [Microsoft.IdentityModel.Clients.ActiveDirectory.PlatformParameters]::New($promptBehavior)

    $authContext = New-Object Microsoft.IdentityModel.Clients.ActiveDirectory.AuthenticationContext ("{0}/{1}" -f $login, $tenantId)
    $authenticationResult = $authContext.AcquireTokenAsync($resourceId, $clientID, $redirectUri, $platformParams).Result 

    return $authenticationResult
}

function Get-RequestHeader {
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $true)]
        [string]
        $Path,

        [parameter(Mandatory = $false)]
        [boolean]
        $IsInternalClient = $true, 

        [parameter(Mandatory = $false)]
        [boolean]
        $IsInternalView = $true
    )

    $authenticationResult = Get-AuthenticationResult

    $header = @{
        "Authorization"        = "Bearer $($authenticationResult.AccessToken)"
        "Content-Type"         = "application/json; charset=utf-8"
        "Accept"               = "application/json"
        "x-ms-method"          = "POST"
        "X-ms-path-query"      = "$Path"
        "x-ms-internal-client" = $IsInternalClient
        "x-ms-internal-view"   = $IsInternalView
    }

    return $header
}

############################### Rest API Call to run detector #################################

function Get-ResourceIdFromSettings {
    $ErrorActionPreference = 'Stop'
    $VerbosePreference = 'Continue'

    $json = [System.IO.File]::ReadAllText("$($PSScriptRoot)\..\..\Detector\package.json")

    $jsonObject = ConvertFrom-Json $json
    $jsonObject = $jsonObject.detectorSettings
    $resourceId = $jsonObject.ResourceId

    if ([String]::IsNullOrEmpty($resourceId)) {
        Write-Error "No resource Id provided in detector settings file:("
    }
    else {
        Write-Verbose "Get resource Id from package.json:"
        Write-host $resourceId -ForegroundColor Cyan
    }

    return $resourceId
}

function Set-ResourceInfo {
    [CmdletBinding()]
    Param
    (
        [parameter(Mandatory = $false)]
        [System.String]
        $ResourceId = "",

        [parameter(Mandatory = $false)]
        [System.String]
        $AccessToken = "",

        [parameter(Mandatory = $false)]
        [System.String]
        $DetectorId = "",

        [parameter(Mandatory = $false)]
        [System.String]
        $StartTime = "",

        [parameter(Mandatory = $false)]
        [System.String]
        $EndTime = ""

    )

    
    $versionPrefix = ""
    if ($ResourceId -match "Microsoft.Web/sites") {
        $versionPrefix = "v4"
    }
    elseif ($ResourceId -match "Microsoft.Web/hostingEnvironments") {
        $versionPrefix = "v2"
    }

    $path = $versionPrefix + $ResourceId
    
    $detectorSettings = @{
        "ResourceId" = $ResourceId;
        "Version"    = $versionPrefix;
        "DetectorId" = $DetectorId;
        "Token"      = $AccessToken;
        "StartTime"  = $StartTime;
        "EndTime"    = $EndTime
    } | ConvertTo-Json 

    [System.IO.File]::WriteAllText("$PSScriptRoot\..\UI\Detector-UI-Rendering\dist\assets\detectorSettings.json", $detectorSettings) 
}

function Get-References {
    $json = New-Object PSObject
    Get-ChildItem "$PSScriptRoot\..\..\Detector\gists" -Filter *.csx -Recurse | 
        ForEach-Object {
        $file = Get-Content $_.FullName
        $json | Add-Member -Type NoteProperty -Name $_.BaseName -Value "$($file)"
    }

    return $json
}

function Start-Compilation {
    [CmdletBinding()]
    Param
    (
        [parameter(Mandatory = $false)]
        [System.String]
        $FilePath,

        [parameter(Mandatory = $false)]
        [System.String]
        $ResourceId = "",

        [parameter(Mandatory = $false)]
        [boolean]
        $IsInternalClient = $true, 

        [parameter(Mandatory = $false)]
        [boolean]
        $IsInternalView = $true,

        [parameter(Mandatory = $false)]
        [switch]
        $IsLocalhost,

        [parameter(Mandatory = $false)]
        [switch]
        $IsStaging,
    
        [parameter(Mandatory = $false)]
        [boolean]
        $IsGist = $false
    )

    $ErrorActionPreference = 'Stop'
    $VerbosePreference = 'Continue'

    if ([string]::IsNullOrEmpty($FilePath)) {
        if ($IsGist) {
            Write-Error "Please specify gist name."
            exit
        }

        if (Test-Path "$($PSScriptRoot)\..\..\Detector\detector.csx") {
            $FilePath = "$($PSScriptRoot)\..\..\Detector\detector.csx"
            Write-Host "Start compiling detector from: $FilePath" -ForegroundColor Green
        }
        else {
            Write-Error "Please make sure LocalDevHelper module or detector.csx is under the right folder"
        }
    }

    # Get Path Prefix
    if ([string]::IsNullOrEmpty($ResourceId)) {
        $detectorSettingsPath = "$($PSScriptRoot)\..\..\Detector\package.json"
        Write-Verbose "No ResourceId parameter provided by the command line."
        Write-Verbose "Reading ResourceId from detector settings $detectorSettingsPath"
        $ResourceId = Get-ResourceIdFromSettings
    }
    else {
        Write-Verbose "Compile detector with ResourceId: $ResourceId"
    }

    $versionPrefix = ""
    if ($ResourceId -match "Microsoft.Web/sites") {
        $versionPrefix = "v4"
    }
    elseif ($ResourceId -match "Microsoft.Web/hostingEnvironments") {
        $versionPrefix = "v2"
    }

    $path = $versionPrefix + $ResourceId + "/diagnostics/query";
    Write-Verbose "Get path: $path"

    # Get request header
    $header = Get-RequestHeader -Path  $path -IsInternalClient $IsInternalClient -IsInternalView $IsInternalView

    # Passing request body with detector location, without specifying resourceId will be fine
    $codeString = [System.IO.File]::ReadAllText($FilePath)

    $codeString = $codeString -replace "(\#load\s*`")gists/\w+/(\w+).csx(`")", "`$1`$2`$3"

    $body = @{
        "script"     = $codeString
        "references" = if ($IsGist) {@{}
        }
        else {Get-References}
        "entityType" = if ($IsGist) {"gist"} else {"signal"}
    } | ConvertTo-Json 

    $endpoint = "https://applens.azurewebsites.net/api/invoke"

    # This is for testing purpose
    if ($IsLocalhost) {
        $endpoint = "http://localhost:5000/api/invoke"
    }

    if ($IsStaging) {
        $endpoint = "https://applens-staging.azurewebsites.net/api/invoke"
    }

    Write-Host "============  Build started ============ " -ForegroundColor Green

    try {
        $response = Invoke-RestMethod -Method Post -Uri $endpoint -Headers $header -Body $body -ContentType "application/json; charset=utf-8"
    }
    catch {
        Write-Host "Reponse Status Code:" $_.Exception.Response.StatusCode.value__  -ForegroundColor Magenta
        Write-Host "Status Description:" $_.Exception.Response.StatusDescription -ForegroundColor Magenta
    }

    foreach ($output in $response.compilationOutput.compilationTraces)
    {
        Write-Host $output -ForegroundColor Magenta
    }

    write-host "`n " -Verbose
    if ($response.compilationOutput.compilationSucceeded -eq $true) {
        Write-Host "========== Build: 1 succeeded, 0 failed ==========" -ForegroundColor Green
        Write-Host "Detector Compilation succeeded!" -ForegroundColor Magenta 
    }
    else {
        Write-Host -ForegroundColor Red "========== Build: 0 succeeded, 1 failed =========="
    }

    if ($IsGist) {
        return $response
    }
    
    $detectorId = ""
    if ($response.invocationOutput.metadata.id) {
        $detectorId = $response.invocationOutput.metadata.id
    }

    Set-ResourceInfo -ResourceId $ResourceId -AccessToken $header.Authorization -DetectorId $DetectorId

    if ($response.compilationOutput -and $response.compilationOutput.references) {
        $json = (Get-Content "$($PSScriptRoot)\..\..\Detector\package.json" -Raw) | ConvertFrom-Json
        $ref = $response.compilationOutput.references
        $installed = $json.packageDefinition.dependencies.psobject.properties.name
        $installed | ? {$ref -notcontains $_} | ForEach-Object { Remove-Gist -Name $_ }
        $ref | ? {$installed -notcontains $_} | ForEach-Object { Install-Gist -Name $_ -IsLocalhost:$IsLocalhost }
    }

    return $response
}


############################## Publish detector ##################################################################

function Publish-Package {
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $false)]
        [string]
        $FilePath,

        [parameter(Mandatory = $false)]
        [System.String]
        $ResourceId = "",

        [parameter(Mandatory = $false)]
        [boolean]
        $IsInternalClient = $true, 

        [parameter(Mandatory = $false)]
        [boolean]
        $IsInternalView = $true,

        [Parameter(Mandatory = $false)]
        [Switch]
        $IsLocalhost,

        [Parameter(Mandatory = $false)]
        [Switch]
        $IsStaging,

        [Parameter(Mandatory = $false)]
        [boolean]
        $IsGist = $false
    )

    $ErrorActionPreference = 'Stop'
    $VerbosePreference = 'Continue'

    Write-host "Preparing publishing package " -ForegroundColor Green

    ## Preparing header
    if ([string]::IsNullOrEmpty($ResourceId)) {
        $detectorSettingsPath = "$($PSScriptRoot)\..\..\Detector\package.json"
        Write-Verbose "No ResourceId parameter provided by the command line."
        Write-Verbose "Reading resource app from detector settings $detectorSettingsPath"
        $ResourceId = Get-ResourceIdFromSettings
    }
    else {
        Write-Verbose "Compile detector with ResourceId: $ResourceId"
    }

    $path = $ResourceId + "/diagnostics/publish"
    $publishHeader = Get-RequestHeader -path $path

    # Preparing body/ package:

    # Prepare publishing package    
    $authenticationResult = Get-AuthenticationResult
    $userAlias = $authenticationResult.UserInfo.DisplayableId.Replace('@microsoft.com', '')
    
    # Compile the package first to get the response, making sure all the detector are compiled successfully before published

    if ([string]::IsNullOrEmpty($FilePath)) {
        if ($IsGist) {
            Write-Error "Please specify gist file path."
            exit
        }

        if (Test-Path "$($PSScriptRoot)\..\..\Detector\detector.csx") {
            $FilePath = "$($PSScriptRoot)\..\..\Detector\detector.csx"
            Write-Verbose "Start preparing package for detector from: $FilePath"
        }
        else {
            Write-Error "Please make sure LocalDevHelper module or detector.csx is under the right folder"
        }
    }

    $compilationResponse = Start-Compilation -FilePath $FilePath -ResourceId $ResourceId -IsInternalClient $IsInternalClient -IsInternalView $IsInternalView -IsLocalhost:$IsLocalhost -IsGist $IsGist

    if (($null -eq $compilationResponse) -or ($compilationResponse.compilationOutput.compilationSucceeded -eq $false)) {
        Write-Error "Build Failed. Please make sure compilation succeed before publishing"
        exit
    }

    if (!$IsGist -and $compilationResponse.runtimeSucceeded -eq $false) {
        Write-Error "Runtime exception occurred. Please make sure there are no runtime exceptions before publishing"
        exit
    }
    else {
        if ($IsGist) {
            $path = (Get-Item "$PSScriptRoot\..\..\Detector\$FilePath").Directory
            $json = (Get-Content ((Get-ChildItem $path -Filter *.json).FullName)) | ConvertFrom-Json
        }
        else {
            $tmp = (Get-Content "$($PSScriptRoot)\..\..\Detector\package.json" -Raw) | ConvertFrom-Json
            $json = $tmp.packageDefinition
        }

        $codeString = [System.IO.File]::ReadAllText($FilePath)
        $codeString = $codeString -replace "(\#load\s*`")gists/\w+/(\w+).csx(`")", "`$1`$2`$3"

        $publishingPackage = @{
            codeString       = $codeString
            id               = $compilationResponse.invocationOutput.metadata.id
            dllBytes         = $compilationResponse.compilationOutput.assemblyBytes
            pdbBytes         = $compilationResponse.compilationOutput.pdbBytes
            committedByAlias = $userAlias
            packageConfig    = ($json | ConvertTo-Json)
        }

        Write-Host "Preparing package succeeded!" -ForegroundColor Magenta
    }

    $publishingPackageBody = $publishingPackage | ConvertTo-Json 

    # Publish package
    $endpoint = "https://applens.azurewebsites.net/api/invoke"

    # This is for testing purpose
    if ($IsLocalhost) {
        $endpoint = "http://localhost:5000/api/invoke"
    }

    if ($IsStaging) {
        $endpoint = "https://applens-staging.azurewebsites.net/api/invoke"
    }

    try {
        Write-Host "Publishing package..." -ForegroundColor Green
        $response = Invoke-RestMethod -Method Post -Uri $endpoint -Headers $publishHeader -Body $publishingPackageBody -ContentType "application/json; charset=utf-8"
    }
    catch {
        Write-Host "Reponse Status Code:" $_.Exception.Response.StatusCode.value__  -ForegroundColor Red
        Write-Host "Status Description:" $_.Exception.Response.StatusDescription -ForegroundColor Red
    }
  
    if ($null -eq $response) {
        Write-Error "Package published failed!"
        exit
    }
    else {
        Write-Host "Package is published successfully!" -ForegroundColor Magenta

        if (!$IsGist -and $compilationResponse.invocationOutput.metadata.id) {
            $detectorId = $compilationResponse.invocationOutput.metadata.id
            $resourceUrl = $ResourceId -ireplace "resourcegroup", "resourceGroup"
            $publishedLink = "https://applens.azurewebsites.net" + $resourceUrl + "/detectors/" + $detectorId
            Write-Host "Changes will be live shortly at: $publishedLink" -ForegroundColor Cyan
        }

        if ($IsGist) {
            $name = (Get-Item "$PSScriptRoot\..\..\Detector\$FilePath").BaseName
            Update-GistDefinition -Name $name -IsLocalhost:$IsLocalhost -IsStaging:$IsStaging

            Install-Gist -Name $name -IsLocalhost:$IsLocalhost -IsStaging:$IsStaging
        }
    }
}

################################ Gists operation ######################################
function Update-GistDefinition {
    [CmdletBinding()]
    Param
    (
        [parameter(Mandatory = $true)]
        [System.String]
        $Name,

        [parameter(Mandatory = $false)]
        [switch]
        $IsLocalhost,

        [parameter(Mandatory = $false)]
        [switch]
        $IsStaging
    )

    # Get request header
    $header = Get-RequestHeader -Path  "xxx" -IsInternalClient $true -IsInternalView $true

    $endpoint = "https://applens.azurewebsites.net/api/github/package/$Name/changelist"
    
    # This is for testing purpose
    if ($IsLocalhost) {
        $endpoint = "http://localhost:5000/api/github/package/$Name/changelist"
    }
    
    if ($IsStaging) {
        $endpoint = "https://applens-staging.azurewebsites.net/api/github/package/$Name/changelist"
    }
    
    Write-Host "============ Update gist definition started ============" -ForegroundColor Green
    
    try {
        $response = Invoke-RestMethod -Method Get -Uri "$endpoint" -Headers $header -ContentType "application/json; charset=utf-8"
    }
    catch {
        Write-Host "Reponse Status Code:" $_.Exception.Response.StatusCode.value__  -ForegroundColor Magenta
        Write-Host "Status Description:" $_.Exception.Response.StatusDescription -ForegroundColor Magenta
    }

    $array = @()
    $response |? {
        $array += $_.sha
    }

    $json = (Get-Content "$($PSScriptRoot)\..\..\Detector\package.json" -Raw) | ConvertFrom-Json
    $json.gistDefinitions.$Name = $array
    $json | ConvertTo-Json -Compress -Depth 100 | Set-Content "$($PSScriptRoot)\..\..\Detector\package.json"

    Write-Host "============ Update gist definition successfully ============" -ForegroundColor Green
}

function Install-Gist {
    [CmdletBinding()]
    Param
    (
        [parameter(Mandatory = $true)]
        [System.String]
        $Name,

        [parameter(Mandatory = $false)]
        [System.String]
        $Version = "",

        [parameter(Mandatory = $false)]
        [switch]
        $IsLocalhost,

        [parameter(Mandatory = $false)]
        [switch]
        $IsStaging
    )

    $json = (Get-Content "$PSScriptRoot\..\..\Detector\package.json" -Raw) | ConvertFrom-Json

    $names = $json.gistDefinitions.psobject.properties.name 
    if (!$names.Contains($Name)) {
        Write-Error "Cannot find gist $($Name)"
        exit
    }

    $versions = $json.gistDefinitions.$Name

    if ($Version -eq "") {
        if ($versions.Count -eq 1) {
            $Version = $versions
        }
        else {
            $Version = $versions[-1]
        }
    }

    if (!$versions.Contains($Version)) {
        Write-Error "$($Version) is not a version of gist $($Name). Please run .\Diag.ps1 -listGist $($Name) to check all versions."
        exit
    }

    $installed = $json.packageDefinition.dependencies.$Name
    if ($installed -eq $Version) {
        Write-Host "$($Version) has already been installed." -ForegroundColor Green
        exit
    }

    # Get request header
    $header = Get-RequestHeader -Path  "xxx" -IsInternalClient $true -IsInternalView $true

    $baseUrl = "https://applens.azurewebsites.net/api/github/"

    # This is for testing purpose
    if ($IsLocalhost) {
        $baseUrl = "http://localhost:5000/api/github/"
    }

    if ($IsStaging) {
        $baseUrl = "https://applens-staging.azurewebsites.net/api/github/"
    }

    Write-Host "============  Install started ============ " -ForegroundColor Green

    try {
        $response = Invoke-RestMethod -Method Get -Uri "$baseUrl/package/$($Name)/commit/$($Version)" -Headers $header -ContentType "application/json; charset=utf-8"
    }
    catch {
        Write-Host "Reponse Status Code:" $_.Exception.Response.StatusCode.value__  -ForegroundColor Magenta
        Write-Host "Status Description:" $_.Exception.Response.StatusDescription -ForegroundColor Magenta
        exit
    }

    New-Item -ItemType Directory -Path "$PSScriptRoot\..\..\Detector\gists\$Name" -Force

    $response | Set-Content "$($PSScriptRoot)\..\..\Detector\gists\$Name\$($Name).csx"

    Write-Host "Download $Name.csx to $($PSScriptRoot)\..\..\Detector\gists\$Name\$($Name).csx successfully!" -ForegroundColor Cyan

    try {
        $response = Invoke-RestMethod -Method Get -Uri "$baseUrl/package/$($Name)/configuration/$($Version)" -Headers $header -ContentType "application/json; charset=utf-8"
    }
    catch {
        Write-Host "Reponse Status Code:" $_.Exception.Response.StatusCode.value__  -ForegroundColor Magenta
        Write-Host "Status Description:" $_.Exception.Response.StatusDescription -ForegroundColor Magenta
        exit
    }

    $response | ConvertFrom-Json | ConvertTo-Json -Compress -Depth 100 | Set-Content "$($PSScriptRoot)\..\..\Detector\gists\$Name\package.json"

    Write-Host "Download package.json to $($PSScriptRoot)\..\..\Detector\gists\$Name\package.json successfully!" -ForegroundColor Cyan

    Write-Host "Start updating package.json." -ForegroundColor Magenta

    if ($Name -in $json.packageDefinition.dependencies.psobject.properties.name) {
        $json.packageDefinition.dependencies.$Name = $Version
    }
    else {
        $json.packageDefinition.dependencies | Add-Member -Type NoteProperty -Name $Name -Value $Version
    }

    ($json | ConvertTo-Json -Compress -depth 100) | Set-Content "$PSScriptRoot\..\..\Detector\package.json"

    Write-Host "Install $($Name) successfully!" -ForegroundColor Green
}

function Remove-Gist {
    [CmdletBinding()]
    param (
        [parameter(Mandatory = $true)]
        [System.String]
        $Name
    )

    Write-Host "Start updating package.json" -ForegroundColor Magenta

    $json = (Get-Content "$PSScriptRoot\..\..\Detector\package.json" -Raw) | ConvertFrom-Json
    $json.packageDefinition.dependencies.psobject.properties.remove($Name)

    ($json | ConvertTo-Json -depth 100) | Set-Content "$PSScriptRoot\..\..\Detector\package.json"

    Write-Host "Start deleting gist file" -ForegroundColor Red
    $path = "$PSScriptRoot\..\..\Detector\gists\$Name"
    if (Test-Path $path) {
        Remove-Item $path -Recurse
    }

    Write-Host "Remove $Name successfully." -ForegroundColor Green
}

function Add-FrameworkReferences {
    [CmdletBinding()]
    param
    (
        [Parameter(Mandatory = $true)]
        [string]
        $filePath
    )

    $fileContent = "";
    $regionToAdd = ""

    foreach ($line in Get-Content $filePath) {
        if ($line -match "(\#load\s*`")(\w+)(`")" -or $line -match "(\#load\s*`")gists/(\w+).csx(`")") {
            $line = $line -replace "(\#load\s*`")(\w+)(`")", "`$1gists/`$2/`$2.csx`$3"
            $regionToAdd += $line + "`r`n";
        }
        else {
            $fileContent += $line + "`r`n";
        }
    }

    [string[]] $referencesArray = 
    @('#load "../Framework/References/_frameworkRef.csx"',
        "using System;",
        "using System.Linq;", 
        "using System.Data;",
        "using System.Collections;",
        "using System.Collections.Generic;",
        "using System.Threading.Tasks;",
        "using System.Text.RegularExpressions;",
        "using System.Xml.Linq;",
        "using Diagnostics.DataProviders;",
        "using Diagnostics.ModelsAndUtils;",
        "using Diagnostics.ModelsAndUtils.Attributes;",
        "using Diagnostics.ModelsAndUtils.Models;",
        "using Diagnostics.ModelsAndUtils.Models.ResponseExtensions;",
        "using Diagnostics.ModelsAndUtils.ScriptUtilities;"
        "using Newtonsoft.Json;"
    )


    foreach ($ref in $referencesArray) {
        if (!$fileContent.Contains($ref)) {
            $regionToAdd += $ref + "`r`n"
        }
    }

    if (![string]::IsNullOrEmpty($regionToAdd)) {
        $fileContent = $regionToAdd + $fileContent
        $fileContent | Set-Content $filePath
    }
}