Prerequisites

Install the following developing tools if you don't have them on your local box
    1.  Visual Studio Code and Visual Studio C# Extension
    2. Node.js version 8.x or later
    3. Git

Instructions

    1. How to download local development tool set from applens portal.
        a. Go to https://applens.azurewebsites.net/ and choose a resource
        b. Go to "New Detector" or "Develop" tab of any existing detector on left side menu
        c. Click "Download Local Detector Package" on the pop-up modal
        (If this modal dismissed, you can always get it back by clicking the VS code fab button on right side corner)


    2. How to editing detector code on your Visual Studio Code
        a. Extract local detector zip toolset.
        b. Open the unzipped folder, double startup.cmd to run. 
        (Click "Run anyway" if you get windows defender smartscreen prevention).
        c. Wait for "startup.cmd" completion. This will help you launch you Visual Studio Code automatically.

    3. How to run detector and publish detector locally
        a. Open Powershell terminal on your Visual Studio Code by : Ctrl + ` (Or Go to menu: View->Intergrated Terminal)
        b. Get ".\Diag.ps1" command help info:  .\Diag.ps1 -help
        c. Compile and Run a detector:  .\Diag.ps1 -run
        d. Publish Detector: .\Diag.ps1 -publish

    4. "./Diag.ps1" Command help info:
        
        Command Name
            .\Diag.ps1

        Syntax
                -run: Run detector script
                -publish: Publish detector script
                -resourceId: ResourceId parameter to run or publish
                -detectorFile: Detector file to run or publish
                -help: Help info for Diag command
                -systemCheck: Check prerequisite for your compilation and publish environment

        Examples
                .\Diag.ps1 -run
                Run default detector script 'detector.csx' with settings from 'detectorSettings.json'

                .\Diag.ps1 -run -resourceId '/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourcegroups/badsites/providers/Microsoft.Web/sites/highcpuscenario'
                Run default detector script with spcified resourceId

                .\Diag.ps1 -run -detectorFile './appcrashes.csx'
                Run detector script './appcrashes.csx'

                .\Diag.ps1 -publish
                Run and publish default 'detector.csx' script with settings from 'detectorSettings.json'
        
                .\Diag.ps1 -publish -resourceId '/subscriptions/1402be24-4f35-4ab7-a212-2cd496ebdf14/resourcegroups/badsites/providers/Microsoft.Web/sites/highcpuscenario'
                Run and publish default 'detector.csx' script with specified resourceId

                .\Diag.ps1 -publish -detectorFile './appcrashes.csx'
                Run and publish detector script './appcrashes.csx'

                .\Diag.ps1 -help
                Get help info for Diag.ps1 command

                .\Diag.ps1 -systemCheck
                Check Node.js and Npm version'./appcrashes.csx'