# Azure App Services Diagnostics Portal And Applens

This is the repository for Azure App Service diagnostics experience. 

## Prerequisites
- [Node 6.*](https://nodejs.org/en/download/)
- Node Package Manager (npm)
- Typescript
  `npm install -g typescript`
- Angular-CLI
  `npm install -g @angular/cli@6`
  
## Project Structure

```
root
│   
└───AngularApp
│   │   This is the home of the angular code for App Service Diangositics Portal and Applens
|   |
|   |   angular.json - This is the angular-cli configruation file
│   │
│   └───projects
|       |   This is the list of projects registered in angular.json
|       |
│       └───app-service-diagnostics
|       |   |    This is the code for the external App Service Diangostics Portal 
|       |
|       └───applens
|       |   |    This is the code for Applens
|       |
|       └───diagnostic-data
|           |    This is a library containing the common component and services 
|           |    that are used to generate detector views in ASD/Applens.
|           |    Any component or feature that you want to use both internally 
|           |    or externally should be put here
│
└───Backend
│   │   ASP.Net Core Backend for App Service Diagnostics Portal
|
└───ApplensBackend
│   │   ASP.Net Core Backend for Applens
```

## Getting Started
- Clone repo `git clone https://github.com/Azure/Azure-WebApps-Support-Center.git`
- Navigate to the angular root folder `AngularApp` and run `npm install` (This will install all the required packages.)

## App Service Diagnostics Portal

### Development server

- You need to update `projects/app-service-diagnostics/src/app/startup/services/auth.service.ts` with the Authorization Token and resource ID. (only for local development)
- To get the token, you can use <a href="https://github.com/projectkudu/ARMClient">ArmClient</a> `ARMClient.exe token [tenant|subscription]`. This will copy token to clipboard.
- Get a resource id that you want to test. A good way to do this is to take it from Applens or Azure Portal route.
- Put values in `auth.service`

```Typescript
private localStartUpInfo: StartupInfo = <StartupInfo>{
    sessionId: '',
    token: '[PUT TOKEN HERE]',
    subscriptions: null,
    resourceId: '[PUT RESOURCE ID HERE]',
    workflowId: '',
    supportTopicId: ''
};
```

- Run `ng serve` for a dev server, or alternatively `npm start`. Navigate to `http://localhost:3000/`. The app will automatically reload if you change any of the source files.

### SSL Development Server

- To run with ssl, you will need to create a self signed certificate and install it in Trusted Root. Go to the `ssl` folder for directions on how to create this certificate. 
- Once you have completed this, you can run an ssl server with the command `npm run ssl`. You can navigate to `https://localhost:3000/`. The app will automatically reload if you change any of the source files.

### Testing Local Changes in the Portal

- In order to test your local changes in the portal, you can use the following links:
  - [Local](https://ms.portal.azure.com/?websitesextension_ext=appsvc.env%3Dlocal): This will load the iframe from `https://localhost:3000`. Must be running in *ssl* mode. 
  - [Staging](https://ms.portal.azure.com/?websitesextension_ext=appsvc.env%3Dstaging): This will load the iframe from `https://supportcenter-bay-staging.azurewebsites.net`
  
### Back End

- Right now the back end is optional as it is not required for functionality of the angular project. 
- You will need appropriate secrets to be added to appsettings.Development.json.
- Open the `Backend` project in Visual Studio 2017 and run it in `IIS Express` mode. 

### Production Build

- The production build commands for the angular projects are as follows:
  - `npm run build-applens` - Build Applens. Build output is placed in `ApplensBackend/wwwroot`.
  - `npm run build-asd` - Build App Service Diagnostic Portal. Build output is placed in `Backend/wwwroot`.
  - `npm run build` - Build both App Service Diagnostic Portal and Applens.
- If you have the appropriate Publishing Profiles, you can deploy these changes to the staging slots. 
- TODO: Azure Dev Ops Integration


