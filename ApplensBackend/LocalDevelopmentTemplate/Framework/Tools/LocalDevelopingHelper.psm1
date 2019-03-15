Add-Type -Path "$($PSScriptRoot)\References\Microsoft.IdentityModel.Clients.ActiveDirectory\Microsoft.IdentityModel.Clients.ActiveDirectory.Platform.dll"
Add-Type -Path "$($PSScriptRoot)\References\Microsoft.IdentityModel.Clients.ActiveDirectory\Microsoft.IdentityModel.Clients.ActiveDirectory.dll"
Add-type -Path "$($PSScriptRoot)\References\Newtonsoft.Json\Newtonsoft.Json.dll"

function Get-AuthenticationResult
{
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

    $authContext = New-Object Microsoft.IdentityModel.Clients.ActiveDirectory.AuthenticationContext ("{0}/{1}" -f $login,$tenantId)
    $authenticationResult = $authContext.AcquireTokenAsync($resourceId, $clientID, $redirectUri, $platformParams).Result 

    return $authenticationResult
}

function Get-RequestHeader
{
    [CmdletBinding()]
    param
    (
    [Parameter(Mandatory=$true)]
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
    "Authorization" = "Bearer $($authenticationResult.AccessToken)"
    "Content-Type" = "application/json; charset=utf-8"
    "Accept" = "application/json"
    "x-ms-method" = "POST"
    "X-ms-path-query" = "$Path"
    "x-ms-internal-client" = $IsInternalClient
    "x-ms-internal-view" = $IsInternalView
    }

    return $header
}

############################### Rest API Call to run detector #################################

function Get-ResourceIdFromSettings
{
    $ErrorActionPreference = 'Stop'
    $VerbosePreference = 'Continue'

    $json = [System.IO.File]::ReadAllText("$($PSScriptRoot)\..\..\Detector\detectorSettings.json")
   # $json = [System.IO.File]::ReadAllText("F:\AppService\LocalDevTemplate\appcrashes41\Detector\detectorSettings.json")

    $jsonObject = ConvertFrom-Json $json
    $resourceId =  $jsonObject.ResourceId

    if ([String]::IsNullOrEmpty($resourceId))
    {
        Write-Error "No resource Id provided in detector settings file:("
    }
    else
    {
        Write-Verbose "Get resource Id from detectorSettings.json:"
        Write-host $resourceId -ForegroundColor Cyan
    }

    return $resourceId
}

function Set-ResourceInfo
{
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
    if ($ResourceId -match "Microsoft.Web/sites")
    {
        $versionPrefix = "v4"
    }
    elseif ($ResourceId -match "Microsoft.Web/hostingEnvironments")
    {
        $versionPrefix = "v2"
    }

    $path = $versionPrefix + $ResourceId
    
     $detectorSettings = @{
        "ResourceId" = $ResourceId;
        "Version" = $versionPrefix;
        "DetectorId" = $DetectorId;
        "Token" = $AccessToken;
        "StartTime" = $StartTime;
        "EndTime" = $EndTime
    } | ConvertTo-Json 

    [System.IO.File]::WriteAllText("$PSScriptRoot\..\UI\Detector-UI-Rendering\dist\assets\detectorSettings.json", $detectorSettings) 
}

function Start-Compilation
{
    [CmdletBinding()]
    Param
    (
        [parameter(Mandatory = $false)]
        [System.String]
        $DetectorCsxPath,

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
        $IsStaging
    )

    $ErrorActionPreference = 'Stop'
    $VerbosePreference = 'Continue'

    if ([string]::IsNullOrEmpty($DetectorCsxPath))
    {
        if (Test-Path "$($PSScriptRoot)\..\..\Detector\detector.csx")
        {
            $DetectorCsxPath = "$($PSScriptRoot)\..\..\Detector\detector.csx"
            Write-Host "Start compiling detector from: $DetectorCsxPath" -ForegroundColor Green
        }
        else
        {
            Write-Error "Please make sure LocalDevHelper module or detector.csx is under the right folder"
        }
    }

    # Get Path Prefix
    if ([string]::IsNullOrEmpty($ResourceId))
    {
        $detectorSettingsPath = "$($PSScriptRoot)\..\..\Detector\detectorSettings.json"
        Write-Verbose "No ResourceId parameter provided by the command line."
        Write-Verbose "Reading ResourceId from detector settings $detectorSettingsPath"
        $ResourceId = Get-ResourceIdFromSettings
    }
    else
    {
        Write-Verbose "Compile detector with ResourceId: $ResourceId"
    }

    $versionPrefix = ""
    if ($ResourceId -match "Microsoft.Web/sites")
    {
        $versionPrefix = "v4"
    }
    elseif ($ResourceId -match "Microsoft.Web/hostingEnvironments")
    {
        $versionPrefix = "v2"
    }

    $path = $versionPrefix + $ResourceId + "/diagnostics/query";
    Write-Verbose "Get path: $path"

    # Get request header
    $header = Get-RequestHeader -Path  $path -IsInternalClient $IsInternalClient -IsInternalView $IsInternalView

    # Passing request body with detector location, without specifying resourceId will be fine
    $codeString = [System.IO.File]::ReadAllText($detectorCsxPath)
        
    $body = @{
        "script" = $codeString
    } | ConvertTo-Json 

    $endpoint = "https://applens.azurewebsites.net/api/invoke"

    # This is for testing purpose
    if ($IsLocalhost)
    {
        $endpoint = "http://localhost:5000/api/invoke"
    }

    if ($IsStaging)
    {
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
    if ($response.compilationOutput.compilationSucceeded -eq $true)
    {
        Write-Host "========== Build: 1 succeeded, 0 failed ==========" -ForegroundColor Green
        Write-Host "Detector Compilation succeeded!" -ForegroundColor Magenta 
    }
    else
    {
        Write-Host -ForegroundColor Red "========== Build: 0 succeeded, 1 failed =========="
    }


    $detectorId = ""
    if ($response.invocationOutput.metadata.id)
    {
        $detectorId = $response.invocationOutput.metadata.id
    }

    Set-ResourceInfo -ResourceId $ResourceId -AccessToken $header.Authorization -DetectorId $DetectorId

    return $response
}


############################## Publish detector ##################################################################

function Publish-Detector
{
    [CmdletBinding()]
    param
    (
    [Parameter(Mandatory=$false)]
    [string]
    $DetectorCsxPath,

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
    $IsStaging
    )
    
	$ErrorActionPreference = 'Stop'
    $VerbosePreference = 'Continue'

    Write-host "Preparing publishing package " -ForegroundColor Green

    ## Preparing header
    if ([string]::IsNullOrEmpty($ResourceId))
    {
        $detectorSettingsPath = "$($PSScriptRoot)\..\..\Detector\detectorSettings.json"
        Write-Verbose "No ResourceId parameter provided by the command line."
        Write-Verbose "Reading resource app from detector settings $detectorSettingsPath"
        $ResourceId = Get-ResourceIdFromSettings
    }
    else
    {
        Write-Verbose "Compile detector with ResourceId: $ResourceId"
    }

    $path = $ResourceId + "/diagnostics/publish"
    $publishHeader= Get-RequestHeader -path $path

    # Preparing body/ package:

    # Prepare publishing package    
    $authenticationResult = Get-AuthenticationResult
    $userAlias = $authenticationResult.UserInfo.DisplayableId.Replace('@microsoft.com', '')
    
    # Compile the package first to get the response, making sure all the detector are compiled successfully before published
    
    if ([string]::IsNullOrEmpty($DetectorCsxPath))
    {
        if (Test-Path "$($PSScriptRoot)\..\..\Detector\detector.csx")
        {
            $DetectorCsxPath = "$($PSScriptRoot)\..\..\Detector\detector.csx"
            Write-Verbose "Start preparing package for detector from: $DetectorCsxPath"
        }
        else
        {
            Write-Error "Please make sure LocalDevHelper module or detector.csx is under the right folder"
        }
    }

    $compilationResponse = Start-Compilation -DetectorCsxPath $DetectorCsxPath -ResourceId $ResourceId -IsInternalClient $IsInternalClient -IsInternalView $IsInternalView -IsLocalhost:$IsLocalhost

    $codeString = [System.IO.File]::ReadAllText($DetectorCsxPath)

    if (($compilationResponse -eq $null) -or ($compilationResponse.compilationOutput.compilationSucceeded -eq $false))
    {
        Write-Error "Build Failed. Please make sure compilation succeed before publishing"
        exit
    }
    if($compilationResponse.runtimeSucceeded -eq $false) {
        Write-Error "Runtime exception occurred. Please make sure there are no runtime exceptions before publishing"
        exit
    }
    else
    {
        $publishingPackage = @{
            codeString = $codeString
            id = $compilationResponse.invocationOutput.metadata.id
            dllBytes = $compilationResponse.compilationOutput.assemblyBytes
            pdbBytes = $compilationResponse.compilationOutput.pdbBytes
            committedByAlias = $userAlias
        }

        Write-Host "Preparing package succeeded!" -ForegroundColor Magenta
    }

    $publishingPackageBody = $publishingPackage | ConvertTo-Json 

    # Publish package
    $endpoint = "https://applens.azurewebsites.net/api/invoke"

	# This is for testing purpose
    if ($IsLocalhost)
    {
        $endpoint = "http://localhost:5000/api/invoke"
    }

    if ($IsStaging)
    {
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
  
    if ($response -eq $null)
    {
        Write-Error "Detector published failed!"
        exit
    }
    else{
        Write-Host "Detector is published successfully!" -ForegroundColor Magenta
        
        if ($compilationResponse.invocationOutput.metadata.id)
        {
            $detectorId = $compilationResponse.invocationOutput.metadata.id
            $resourceUrl = $ResourceId -ireplace "resourcegroup", "resourceGroup"
            $publishedLink = "https://applens.azurewebsites.net" + $resourceUrl + "/detectors/" + $detectorId
            Write-Host "Changes will be live shortly at: $publishedLink" -ForegroundColor Cyan
        }
    }
}