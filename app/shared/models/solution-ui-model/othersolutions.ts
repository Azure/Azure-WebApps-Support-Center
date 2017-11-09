import { SolutionUIModelBase } from './solution-ui-model-base';
import { SolutionProperties, SubAction, SolutionMetadata } from './solutionproperties';
import * as Enums from '../enumerations';
import { INameValuePair } from '../namevaluepair';
import { SiteService, AvailabilityLoggingService } from '../../services';

function _window(): any {
    // return the native window obj
    return window;
}

export class EnableLocalCache extends SolutionUIModelBase {

    constructor(rank: number, _logger: AvailabilityLoggingService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 7;
        this.properties.title = "Explore Local Cache feature for your web app.";
        this.properties.description = "The local cache is a copy of the /site and /siteextensions folders of the web app. It is created on the local VM instance on web app startup.";

        this.properties.type = Enums.SolutionType.BestPractices;

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "You can learn about the *local cache feature*";
        metaDataItem.og_Url = "https://goo.gl/BQJOpY";
        metaDataItem.og_Title = "Azure App Service Local Cache overview";
        metaDataItem.og_Description = "This article describes how to enable, resize, and query the status of the Azure App Service Local Cache feature.";
        metaDataItem.og_ImageUrl = "https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}

export class EnableAutoHeal extends SolutionUIModelBase {
    constructor(rank: number, _logger: AvailabilityLoggingService) {

        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 9;
        this.properties.title = "Explore Auto-Heal feature for web apps.";
        this.properties.description = "Auto Healing for a Web App lets you take an action when certain unexpected events occur like requests failing or slow.";

        this.properties.type = Enums.SolutionType.BestPractices;

        this.properties.additionalData = [];

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn how to set *auto heal rules*";
        metaDataItem.og_Url = "https://goo.gl/AJIzHx";
        metaDataItem.og_Title = "Auto Heal your Azure Web App";
        metaDataItem.og_Description = "Auto Healing for a Web App lets you take an action when certain events occur like when reuests are failing or experiencing slowness.";
        metaDataItem.og_ImageUrl = "https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}

export class SplitAppsIntoDifferentServerFarms extends SolutionUIModelBase {
    constructor(rank: number, _logger: AvailabilityLoggingService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 12;
        this.properties.title = "Move Apps into Different App Service Plans";
        this.properties.description = "When there are too many Apps in one App Service Plan, they can use all of the underlying resources. Analyze which Apps are using the most resources, i.e. CPU and Memory, and divide them among different app service plans.";

        this.properties.type = Enums.SolutionType.BestPractices;
    }

    run(): void {
    }
}

export class CheckWebConfig extends SolutionUIModelBase {

    constructor(rank: number, private _parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 13;
        this.properties.title = "Check your Web.config";
        this.properties.description = "You can check and modify your web.config file in kudu console. In Debug Console, navigate to site\\wwwroot folder and find your Web.config file there.";

        this.properties.type = Enums.SolutionType.DeepInvestigation;
        this.properties.actionType = Enums.ActionType.NewTab;
        this.properties.actionText = "Open Kudu Console to check Web.Config";
    }

    run(): void {
        if (this._parameters && this._parameters.length > 0) {
            let siteName = this._parameters[0].find(p => p.name.toLowerCase() === "sitename");
            if (siteName && siteName.value === this._siteService.currentSiteStatic.name) {
                //Temporary. We need to get scm hostname from the API.
                let scmHostName = this._siteService.currentSiteStatic.enabledHostNames.find(x => x.indexOf(".scm.") > 0);

                if (scmHostName) {
                    this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), 'other', this.properties.actionText);
                    _window().open("https://" + scmHostName + "/DebugConsole");
                }
            }
        }
    }
}

export class CheckAppServiceQuotas extends SolutionUIModelBase {

    constructor(rank: number, _logger: AvailabilityLoggingService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 14;
        this.properties.title = "Check App Service Quota Limits";
        this.properties.type = Enums.SolutionType.BestPractices;

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn about Azure App Service limits, quotas and constraints *here*.";
        metaDataItem.og_Url = "https://goo.gl/1hW5ky";
        metaDataItem.og_Title = "Learn about Azure App Service limits, quotas and constraints.";
        metaDataItem.og_Description = "The App Service limits include limits for Web Apps, Mobile Apps, API Apps, and Logic Apps";
        metaDataItem.og_ImageUrl = "https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}

export class CheckAutoHeal extends SolutionUIModelBase {
    constructor(rank: number, _logger: AvailabilityLoggingService) {

        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 102;
        this.properties.title = "Check Your App Auto-Heal Settings.";
        this.properties.description = "Make sure your auto heal configurations are not causing undesired app restarts.";

        this.properties.type = Enums.SolutionType.BestPractices;

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn how to set auto heal rules *here*.";
        metaDataItem.og_Url = "https://goo.gl/OqEkKO";
        metaDataItem.og_Title = "Auto Heal your Azure Web App";
        metaDataItem.og_Description = "Auto Healing for a Web App lets you take an action when certain events occur like when reuests are failing or experiencing slowness.";
        metaDataItem.og_ImageUrl = "https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}

export class GetDumpOfProcess extends SolutionUIModelBase {
    constructor(rank: number, _logger: AvailabilityLoggingService) {

        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 103;
        this.properties.title = "Get Memory Dump of Process and analyze it.";
        this.properties.description = "A memory dump of your site process reveals which threads are blocking or slow. It can also show you which parts of your application are using the most CPU and memory, and with that information you can improve your app's functionality.";

        this.properties.type = Enums.SolutionType.DeepInvestigation;

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn how to get *memory dump* for your web app";
        metaDataItem.og_Url = "https://goo.gl/Ru3X3p";
        metaDataItem.og_Title = "How to get a full memory dump in Azure App Services.";
        metaDataItem.og_Description = "There are a ton of blogs on getting full memory dumps but some get complicated. Note then when you create a full memory dump it will have the effect of pausing your web app so use this judiciously.";
        metaDataItem.og_ImageUrl = "https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}

export class RunRemoteProfiler extends SolutionUIModelBase {
    constructor(rank: number, _logger: AvailabilityLoggingService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 104;
        this.properties.title = "Remote profile your web app.";
        this.properties.description = "If your process is running slower than expected, or the latency of HTTP requests are higher than normal and the CPU usage of the process is also pretty high, you can remotely profile your process and get the CPU sampling call stacks to analyze the process activity and code hot paths.";

        this.properties.type = Enums.SolutionType.DeepInvestigation;

        this.properties.additionalData = [];

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn how to *remote profile* your web app";
        metaDataItem.og_Url = "https://goo.gl/5DN9jc";
        metaDataItem.og_Title = "Remote Profiling support in Azure App Service";
        metaDataItem.og_Description = "In order to diagnose latency or high CPU issues, you can remote profile your web app using Visual Studio 2015, Kudu, or REST calls.";
        metaDataItem.og_ImageUrl = "https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}

export class UpgradeDatabase extends SolutionUIModelBase {
    constructor(rank: number, _logger: AvailabilityLoggingService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 105;
        this.properties.title = "Scale Up Your Database Plan";

        this.properties.type = Enums.SolutionType.QuickSolution;

        this.properties.additionalData = [];

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn more information on how to *Upgrade ClearDB*";
        metaDataItem.og_Url = "https://goo.gl/b0pZ0j";
        metaDataItem.og_Title = "Scale Up Your Clear DB Database";

        this.properties.additionalData.push(metaDataItem);

        metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "For more information on how to *Upgrade Azure Database* for MySQL";
        metaDataItem.og_Url = "https://goo.gl/zqdOMd";
        metaDataItem.og_Title = "Upgrade Azure Database for MySQL";
        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}

export class ContactDatabaseProvider extends SolutionUIModelBase {
    constructor(rank: number, _logger: AvailabilityLoggingService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 106;
        this.properties.title = "Contact ClearDB or Azure Database Support for more information";

        this.properties.type = Enums.SolutionType.DeepInvestigation;

        this.properties.additionalData = [];

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Contact *ClearDB Support* if your are using ClearDB database.";
        metaDataItem.og_Url = "https://goo.gl/R0xFql";
        metaDataItem.og_Title = "Contact ClearDB";
        this.properties.additionalData.push(metaDataItem);

        metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Contact *Microsoft Support* if you are using Azure Database for MySQL";
        metaDataItem.og_Url = "https://goo.gl/9xnWRi";
        metaDataItem.og_Title = "Contact Azure Database for MySQL";
        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}

export class IncreasePHPTimeOUt extends SolutionUIModelBase {
    constructor(rank: number, private _parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 107;
        this.properties.title = "Increase your PHP App Time out";
        this.properties.type = Enums.SolutionType.QuickSolution;
        this.properties.description = "Increase execution time by adding max_execution_time (change the value to your needs) in .user.ini under D:\\home\\site\\wwwroot.";

        this.properties.actionType = Enums.ActionType.NewTab;
        this.properties.actionText = "Open Kudu Console to edit .user.ini";

        this.properties.additionalData = [];
        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn how to *configure your PHP runtime* on web app.";
        metaDataItem.og_Url = "https://goo.gl/lKrCWA";
        metaDataItem.og_Title = "Learn how to  configure your PHP runtime on web app.";
        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
        if (this._parameters && this._parameters.length > 0) {
            let siteName = this._parameters[0].find(p => p.name.toLowerCase() === "sitename");
            if (siteName && siteName.value === this._siteService.currentSiteStatic.name) {
                //Temporary. We need to get scm hostname from the API.
                let scmHostName = this._siteService.currentSiteStatic.enabledHostNames.find(x => x.indexOf(".scm.") > 0);
                if (scmHostName) {
                    this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), 'other', this.properties.actionText);
                    _window().open("https://" + scmHostName + "/DebugConsole");
                }
            }
        }
    }
}

export class SetPHPMemoryLimit extends SolutionUIModelBase {
    constructor(rank: number, private _parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 109;
        this.properties.title = "Increase your PHP App Memory Limit";
        this.properties.type = Enums.SolutionType.QuickSolution;
        this.properties.description = "Increase memory_limit setting in .user.ini under D:\\home\\site\\wwwroot. Note that increasing the amount of memory each PHP process can use impact the number of concurrent processes that can run when auto-scaling.";

        this.properties.actionType = Enums.ActionType.NewTab;
        this.properties.actionText = "Open Kudu Console to edit .user.ini";

        this.properties.additionalData = [];
        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn how to *configure your PHP runtime* on web app.";
        metaDataItem.og_Url = "https://goo.gl/lKrCWA";
        metaDataItem.og_Title = "Learn how to  configure your PHP runtime on web app.";
        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
        if (this._parameters && this._parameters.length > 0) {
            let siteName = this._parameters[0].find(p => p.name.toLowerCase() === "sitename");
            if (siteName && siteName.value === this._siteService.currentSiteStatic.name) {
                //Temporary. We need to get scm hostname from the API.
                let scmHostName = this._siteService.currentSiteStatic.enabledHostNames.find(x => x.indexOf(".scm.") > 0);
                if (scmHostName) {
                    this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), 'other', this.properties.actionText);
                    _window().open("https://" + scmHostName + "/DebugConsole");
                }
            }
        }
    }
}

export class EnablePHPLogging extends SolutionUIModelBase {
    constructor(rank: number, private _parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 110;
        this.properties.title = "Turn on PHP Logging";
        this.properties.description = "PHP Logs can help identify slowness, HTTP 500 Fatal Errors,  WordPress 'white screen of death' and other issues your Azure App Service Web App may be experiencing.";
        this.properties.type = Enums.SolutionType.BestPractices;

        this.properties.additionalData = [];

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.og_Url = "https://goo.gl/WLwDAE";
        metaDataItem.message = "Learn how to turn on *PHP Logging*.";
        this.properties.additionalData.push(metaDataItem);

        metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.og_Url = "https://goo.gl/vFTGm9";
        metaDataItem.message = "Learn how to turn on *Logging for WordPress Applications*.";
        this.properties.additionalData.push(metaDataItem);

        this.properties.actionType = Enums.ActionType.NewTab;
        this.properties.actionText = "Open Kudu Console to enable PHP logging";
    }

    run(): void {
        if (this._parameters && this._parameters.length > 0) {
            let siteName = this._parameters[0].find(p => p.name.toLowerCase() === "sitename");
            if (siteName && siteName.value === this._siteService.currentSiteStatic.name) {
                //Temporary. We need to get scm hostname from the API.
                let scmHostName = this._siteService.currentSiteStatic.enabledHostNames.find(x => x.indexOf(".scm.") > 0);
                if (scmHostName) {
                    this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), 'other', this.properties.actionText);
                    _window().open("https://" + scmHostName + "/DebugConsole");
                }
            }
        }
    }
}

export class CheckPHPLogs extends SolutionUIModelBase {
    constructor(rank: number, private _parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 111;
        this.properties.title = "Check PHP Logs";
        this.properties.description = "It seems there are issues with the code like Syntax Error or call to an Unknown Method. Please investigate PHP logs for further debugging";
        this.properties.type = Enums.SolutionType.DeepInvestigation;

        this.properties.actionType = Enums.ActionType.NewTab;
        this.properties.actionText = "Open Kudu Console to View PHP logs";
    }

    run(): void {
        if (this._parameters && this._parameters.length > 0) {
            let siteName = this._parameters[0].find(p => p.name.toLowerCase() === "sitename");
            if (siteName && siteName.value === this._siteService.currentSiteStatic.name) {
                //Temporary. We need to get scm hostname from the API.
                let scmHostName = this._siteService.currentSiteStatic.enabledHostNames.find(x => x.indexOf(".scm.") > 0);

                if (scmHostName) {
                    this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), 'other', this.properties.actionText);
                    _window().open("https://" + scmHostName + "/DebugConsole");
                }
            }
        }
    }
}

export class CheckStdOutLog extends SolutionUIModelBase {

    constructor(rank: number, private _parameters: INameValuePair[][], _logger: AvailabilityLoggingService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 16;
        this.properties.title = "Check your Stdout Log";
        this.properties.description = "Please check your stdout log for indications of ASP.NET core issues.";

        this.properties.type = Enums.SolutionType.DeepInvestigation;
        this.properties.actionType = Enums.ActionType.NewTab;
        this.properties.actionText = "Open Stdout Log";
        this.properties.warning = "It is reccomended that you disable stdout log redirection once you have troubleshooted your application start up issues."
    }

    run(): void {
        if (this._parameters && this._parameters.length > 0) {
            let stdLogFile = this._parameters[0].find(p => p.name.toLowerCase() === "stdlogfile").value;
            let subscriptionId = this._parameters[0].find(p => p.name.toLowerCase() === "subscriptionid").value;
            let resourceGroup = this._parameters[0].find(p => p.name.toLowerCase() === "resourcegroup").value;
            let siteName = this._parameters[0].find(p => p.name.toLowerCase() === "sitename").value;

            this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), 'other', this.properties.actionText);

            if (stdLogFile) {
                _window().open(stdLogFile);
            }
        }
    }
}

export class EnableStdOutRedirection extends SolutionUIModelBase {

    constructor(rank: number, private _parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 16;
        this.properties.title = "Enable Stdout Log Redirection";
        this.properties.description = "You can redirect stdout and stderr logs to disk by setting attributes of the aspNetCore element in your web.config. It is recommended that these logs be used to diagnose application start up issues and not for general application logging purposes.";


        this.properties.type = Enums.SolutionType.DeepInvestigation;
        this.properties.actionType = Enums.ActionType.NewTab;
        this.properties.actionText = "Open Kudu Console to edit Web.Config";

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "For details on how to enable stdout log redirection, please refer to the *ASP.NET Core Module configuration reference*";
        metaDataItem.og_Url = "https://goo.gl/TybdIu";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
        if (this._parameters && this._parameters.length > 0) {
            let subscriptionId = this._parameters[0].find(p => p.name.toLowerCase() === "subscriptionid").value;
            let resourceGroup = this._parameters[0].find(p => p.name.toLowerCase() === "resourcegroup").value;
            let siteName = this._parameters[0].find(p => p.name.toLowerCase() === "sitename").value;

            if (siteName && siteName === this._siteService.currentSiteStatic.name) {
                let scmHostName = this._siteService.currentSiteStatic.enabledHostNames.find(x => x.indexOf(".scm.") > 0);

                if (scmHostName) {
                    this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), 'other', this.properties.actionText);
                    _window().open("https://" + scmHostName + "/DebugConsole");
                }
            }
        }
    }
}

export class FixStdOutLogPath extends SolutionUIModelBase {

    constructor(rank: number, private _parameters: INameValuePair[][], _logger: AvailabilityLoggingService, private _siteService: SiteService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 17;
        this.properties.title = "Fix Stdout Log Path";
        this.properties.description = "ASP.NET Core stdout logging is enabled, however, the log creation is failing. Ensure that the log folder location that is specified in your web.config actually exists. You can use Kudu Console to create the designated folder.";

        this.properties.type = Enums.SolutionType.DeepInvestigation;
        this.properties.actionType = Enums.ActionType.NewTab;
        this.properties.actionText = "Open Kudu Console to edit Web.Config";

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "For details on how to enable stdout log redirection, please refer to the *ASP.NET Core Module configuration reference*";
        metaDataItem.og_Url = "https://goo.gl/TybdIu";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
        if (this._parameters && this._parameters.length > 0) {
            let subscriptionId = this._parameters[0].find(p => p.name.toLowerCase() === "subscriptionid").value;
            let resourceGroup = this._parameters[0].find(p => p.name.toLowerCase() === "resourcegroup").value;
            let siteName = this._parameters[0].find(p => p.name.toLowerCase() === "sitename").value;

            if (siteName && siteName === this._siteService.currentSiteStatic.name) {
                let scmHostName = this._siteService.currentSiteStatic.enabledHostNames.find(x => x.indexOf(".scm.") > 0);
                if (scmHostName) {
                    this._logger.LogSolutionTried(this.properties.title, this.rank.toString(), 'other', this.properties.actionText);
                    _window().open("https://" + scmHostName + "/DebugConsole");
                }
            }
        }
    }
}

export class RevertChanges extends SolutionUIModelBase {
    constructor(rank: number, _logger: AvailabilityLoggingService) {
        super(rank, new SolutionProperties(), _logger);

        this.properties.id = 17;
        this.properties.title = "Revert Deployment";
        this.properties.description = "Please review your latest code changes or config changes that may have contributed to these failures and take appropriate actions. If this is only a small blip in availability, please be aware that deploying new code may cause restarts and momentary availability blips otherwise consider using site swap feature for quick reversions.";

        this.properties.type = Enums.SolutionType.QuickSolution;

        this.properties.additionalData = [];

        let metaDataItem = new SolutionMetadata();
        metaDataItem.type = "blog";
        metaDataItem.message = "Learn how to create and swap deployment slots *here*.";
        metaDataItem.og_Url = "https://goo.gl/UsII49";
        metaDataItem.og_Title = "Set up staging environments for web apps in Azure App Service";
        metaDataItem.og_Description = "Use deployment slots as a quick way to revert your changes and go back to a healthy state.";
        metaDataItem.og_ImageUrl = "https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png";

        this.properties.additionalData.push(metaDataItem);
    }

    run(): void {
    }
}
