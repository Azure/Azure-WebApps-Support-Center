export enum SolutionText {
    AppRestartDescription = "AppRestartDescription",
    RestartInstructions = "RestartInstructions",
    UpdateSettingsInstructions = "UpdateSettingsInstructions",
    UpdateSettingsDescription = "UpdateSettingsDescription"
}

namespace SolutionConstants {
    export const AppRestartDescription = `
 #### App Restart

 An App Restart will kill the app process on all instances.

 If your app is in a bad state, performing a web app restart can be enough to fix the problem in some cases.`;

    export const UpdateSettingsDescription = `
 #### Update App Settings

 Apply the following settings to the application:`;

    export const RestartInstructions = " 1. Navigate to the resource in Azure Portal\n" +
        " 2. Click `Restart` to invoke a site restart";

    export const UpdateSettingsInstructions = " 1. Navigate to the resource in Azure Portal\n" +
        " 2. Navigate to the `Application Settings` tab\n" +
        " 3. Enter the following settings under the `Application Settings` section:";
}

export function getSolutionText(flag: SolutionText) {
    try {
        return SolutionConstants[flag.toString()]
    }
    catch (e) {
        // It's okay if the enum doesn't have a string defined
    }

    return "";
}
