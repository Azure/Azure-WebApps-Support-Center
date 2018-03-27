# Azure App Services Diagnostics Portal

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.6.5.

## Prerequisites
- [Node 6.*](https://nodejs.org/en/download/)
- Node Package Manager (npm)
- Typescript
  `npm install -g typescript`

## Getting Started
- Clone repo `git clone https://github.com/Azure/Azure-WebApps-Support-Center.git`
- Navigate to project root folder and run `npm install` (This will install all the required packages.)

## Development server

- You need to update `app/shared/services/auth.service.ts` with the Authorization Token. (only for local development)
- Replace `<token>` with the authorization token (note:- Do not put Bearer)
- To get the token, you can use <a href="https://github.com/projectkudu/ARMClient">ArmClient</a> `ARMClient.exe token [tenant|subscription]`. This will copy token to clipboard.
- Run `ng serve` for a dev server, or alternatively `npm start`. Navigate to `http://localhost:3000/`. The app will automatically reload if you change any of the source files.

## SSL Development Server

- To run with ssl, you will need to create a self signed certificate and install it in Trusted Root. Go to the `ssl` folder for directions on how to create this certificate. 
- Once you have completed this, you can run an ssl server with the command `npm run ssl`. You can navigate to `https://localhost:3000/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `wwwroot/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

# Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.microsoft.com.

When you submit a pull request, a CLA-bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., label, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
