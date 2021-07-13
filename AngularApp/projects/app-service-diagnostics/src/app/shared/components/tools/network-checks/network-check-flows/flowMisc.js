import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer,InputStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
import {CommonRecommendations} from './commonRecommendations.js'


export class ResourcePermissionCheckManager{
    constructor(){
        this.hidden = true;
        this.checkView = new CheckStepView({
            title: "Access was restricted to some resources, check results will be incomplete",
            level: 3,
            hidden: true,
            subChecks: []
        });
    }

    addResource(uri){
        if(this.hidden){
            this.hidden = false;
            this.checkView.hidden = false;
        }
        this.checkView.subChecks.push({title:`Have no access to ${uri}`, level:3});
    }
}

export async function getArmData(resourceId, diagProvider) {
    var apiVersion = "2018-07-01";//"2020-11-01"
    var armData = null;
    if (resourceId.includes("/subnets/")) {
        armData = await diagProvider.getArmResourceAsync(resourceId, apiVersion);
    }
    else if (resourceId.includes("Microsoft.Network/virtualNetworks/")) {
        armData = await diagProvider.getArmResourceAsync(resourceId, apiVersion);
    }

    else if (resourceId.includes("Microsoft.Network/networkSecurityGroups")) {
        armData = await diagProvider.getArmResourceAsync(resourceId, apiVersion);
    }
    else if (resourceId.includes("Microsoft.Network/routeTables")) {
        armData = await diagProvider.getArmResourceAsync(resourceId, apiVersion);
    }
    else if (resourceId.includes("config/virtualNetwork")) {
        armData = await diagProvider.getArmResourceAsync(resourceId);
    }
    else if (resourceId.includes("/virtualNetworkConnections")) {
        armData = await diagProvider.getArmResourceAsync(resourceId);
    }
    else {
        armData = await diagProvider.getArmResourceAsync(resourceId);
    }
    return armData;
}

export async function getWebAppVnetInfo(siteArmId, armService) {
    //This is the regional VNet Integration endpoint
    var swiftUrl = siteArmId + "/config/virtualNetwork";
    var siteVnetInfo = await armService.getArmResourceAsync(swiftUrl, "2018-02-01");

    return siteVnetInfo;
}

var armDataDictionary = {};
export async function getSubnet(armService, subnetResourceId) {
    var subnetData;
    var subnetName = subnetResourceId.split("/subnets/")[1];
    var vnetResourceId = subnetResourceId.split("/subnets/")[0];
    //Search for the subnet
    if (!(subnetResourceId in armDataDictionary)) {
        var vnetData = await getArmData(vnetResourceId, armService);
        var subnets = vnetData["properties"]["subnets"];
        subnets.forEach(subnet => {
            if (subnet["name"].toLowerCase() == subnetName.toLowerCase()) {
                subnetData = subnet;
            }
        });
    }
    else if ((subnetResourceId in armDataDictionary)) {
        subnetData = armDataDictionary[subnetResourceId];
    }
    return subnetData;
}

export async function runKuduAccessibleCheck(diagProvider) {
    var isKuduAccessible = await diagProvider.checkKuduReachable(30);
    var views = [];
    if (isKuduAccessible === false) {
        views.push(new CheckStepView({
            title: "Kudu is not reachable, diagnostic will be incomplete",
            level: 1
        }));
        var commonRec = new CommonRecommendations;

        views.push(commonRec.KuduNotAccessible.Get(`https://${diagProvider.scmHostname}`));
    }
    return views;
}

export async function checkVnetIntegrationHealth(siteInfo, diagProvider, isKuduAccessiblePromise, permMgr) {

    var views = [], subnetData, isContinue;

    var promise = checkVnetIntegrationAsync(siteInfo, diagProvider, isKuduAccessiblePromise, permMgr);
    isContinue = await promise.then(d => d.isContinue);
    if (isContinue) {
        // Complete or Incomplete
        var view = new CheckStepView({
            title: "VNet integration is healthy",
            level: 0,
            subChecks: await promise.then(d => d.checks != undefined ? d.checks.filter(c => c.type == 1) : undefined)
        });

        if (isContinue === "Incomplete") {
            view.title += " (incomplete result)";
        }

        views = views.concat(view);
    }
    else {
        var subchecks = await promise.then(d => d.checks != undefined ? d.checks.filter(c => c.type == 1) : undefined);
        if (subchecks != undefined && subchecks[0].title === "App is not configured for VNet Integration") {
            views = views.concat(new CheckStepView({
                title: subchecks[0].title,
                level: 2
            }));
        }
        else {
            views = views.concat(new CheckStepView({
                title: "VNet integration is not healthy",
                level: 2,
                subChecks: subchecks
            }));
        }

        views = views.concat(await promise.then(d => d.checks.filter(c => c.type == 3)));
    }

    subnetData = await promise.then(d => d.subnetData);

    return { views, isContinue, subnetData };
}

export async function isVnetIntegratedAsync(siteInfo, diagProvider) {
    var siteArmId = siteInfo["id"];
    var siteVnetInfo = await getWebAppVnetInfo(siteArmId, diagProvider);
    if (siteVnetInfo != null && siteVnetInfo["properties"] != null) {
        var vnetInfo = siteVnetInfo["properties"];
        var subnetResourceId = vnetInfo["subnetResourceId"];
        if (subnetResourceId != null) { // App is using regional VNet integration
            return true;
        } else {
            var siteGWVnetInfo = await diagProvider.getArmResourceAsync(siteArmId + "/virtualNetworkConnections");
            if (siteGWVnetInfo != null && siteGWVnetInfo.length > 0) { // App is using Gateway VNet integration
                return true;
            }
        }
    }
    
    return false;
}

async function checkVnetIntegrationAsync(siteInfo, diagProvider, isKuduAccessiblePromise, permMgr) {
    var checks = [];

    var siteArmId = siteInfo["id"];
    var thisSite = siteArmId.split("/sites/")[1];
    var serverFarmId = siteInfo["serverFarmId"];
    var serverFarmName = serverFarmId.split("/serverfarms/")[1];

    //Get All apps from the server farm(ASP)
    var aspSitesObjPromise = diagProvider.getArmResourceAsync(serverFarmId + "/sites");

    //Get Instance details async
    var instancesPromise = diagProvider.getArmResourceAsync(siteArmId + "/instances");

    //get Vnet Integration Details for the Web App
    //For Regional Integration path is sitearmId + /config/virtualNetwork
    //For Gateway Integration path is sitearmId + /virtualNetworkConnections
    var siteVnetInfo = await getWebAppVnetInfo(siteArmId, diagProvider);

    if (siteVnetInfo != null && siteVnetInfo["properties"] != null) {
        var vnetInfo = siteVnetInfo["properties"];
        var subnetData = null;

        //We fetch Subnet resource Id here to validate if app is using regional Vnet integration
        //If subnetResourceId is null, it means Regional Vnet integration is not configured for the app
        var subnetResourceId = vnetInfo["subnetResourceId"];
        var vnetResourceId;
        if (subnetResourceId == null) {
            //Lets check if GW VNET is configured for the app                                    
            var siteGWVnetInfo = await diagProvider.getArmResourceAsync(siteArmId + "/virtualNetworkConnections");

            if (siteGWVnetInfo != null && siteGWVnetInfo.length > 0) {
                //Gateway Vnet integration is present
                var viewShowGatewayVnetStatus = showGatewayVnetStatus(thisSite, siteGWVnetInfo);
                checks = checks.concat(viewShowGatewayVnetStatus);

                if (siteGWVnetInfo[0]["properties"] != null && siteGWVnetInfo[0]["properties"]["vnetResourceId"] != null) {
                    //Check if Vnet exists that the gateway is connected to
                    vnetResourceId = siteGWVnetInfo[0]["properties"]["vnetResourceId"];
                    var vnetData = await diagProvider.getArmResourceAsync(vnetResourceId, "2018-07-01");
                    if (vnetData.status == 401) {
                        var missingPermissionResource = `Virtual Network: ${vnetResourceId.split("/virtualNetworks/")[1]}`;
                        var viewMissingPermissionsonResource = showMissingPermissionStatus(missingPermissionResource);
                        checks = checks.concat(viewMissingPermissionsonResource);
                        permMgr.addResource(vnetResourceId);
                        var isContinue = "Incomplete";
                        return { checks, isContinue, subnetData };
                    }
                    else if (vnetData.status == 404) {
                        var resourceNotFound = `Virtual Network ${vnetResourceId.split("/virtualNetworks/")[1]}`;
                        var viewResourceNotFound = showResourceNotFoundStatus(resourceNotFound, "VNet");
                        checks = checks.concat(viewResourceNotFound);
                        var isContinue = false;
                        return { checks, isContinue, subnetData };
                    }

                    var isContinue = "Complete";
                    return { checks, isContinue, subnetData };
                }
                else {
                    checks.push(new CheckStepView({
                        title: `VNet resource information unavailable in site settings`,
                        level: 2
                    }));
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }
            }
            else {

                //VNET integration is not configured
                checks.push(new CheckStepView({
                    title: "App is not configured for VNet Integration",
                    level: 2
                }));

                var aspSitesObj = await aspSitesObjPromise;
                if (aspSitesObj.status == 401) {
                    var missingPermissionResource = `App Service Plan: ${serverFarmName}`;
                    var viewMissingPermissionsonResource = showMissingPermissionStatus(missingPermissionResource);
                    checks = checks.concat(viewMissingPermissionsonResource);
                    permMgr.addResource(serverFarmId);

                    var msg = `<b>Recommendations: </b>`;
                    msg += `<li>For setting up VNet integration, please see [Integrate your app with an Azure virtual network](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet).</li>`;

                    checks.push(new InfoStepView({
                        infoType: 1,
                        title: "Issue found: App is not configured for VNet Integration",
                        markdown: msg
                    }));

                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }
                else if (aspSitesObj.status == 404) {
                    var resourceNotFound = `App Service Plan ${serverFarmName}`;
                    var viewResourceNotFound = showResourceNotFoundStatus(resourceNotFound);
                    checks = checks.concat(viewResourceNotFound);
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }
                var viewVnetNotIntegrated = await showVnetIntegrationNotConfiguredStatus(diagProvider, aspSitesObj, serverFarmId, serverFarmName);
                checks = checks.concat(viewVnetNotIntegrated);
                var isContinue = false;
                return { checks, isContinue, subnetData };
            }
        }
        else {
            //Show step that Regional Vnet integration has been configured
            checks.push(new CheckStepView({
                title: "Regional VNet integration is configured on this app",
                level: 0
            }));

            var viewSubnetResourceIdFormatIncorrect = checkSubnetResourceIdFormat(subnetResourceId);
            checks = checks.concat(viewSubnetResourceIdFormatIncorrect.views);
            if (viewSubnetResourceIdFormatIncorrect.isContinue === false) {
                var isContinue = false;
                return { checks, isContinue, subnetData };
            }

            var subnetName = subnetResourceId.split("/")[10];
            var swiftSupported = vnetInfo["swiftSupported"];

            //Show swiftSupported property status
            var viewSwiftSupported = showSwiftNotSupportedStatus(swiftSupported);
            checks = checks.concat(viewSwiftSupported.views);
            if (viewSwiftSupported.isContinue === false) {
                var isContinue = false;
                return { checks, isContinue, subnetData };
            }

            if (swiftSupported == true && subnetResourceId.includes("/subnets/")) {

                //Get Virtual Network
                vnetResourceId = subnetResourceId.split("/subnets/")[0];
                var vnetDataPromise = diagProvider.getArmResourceAsync(vnetResourceId, "2018-07-01");
                var vnetData = await vnetDataPromise;
                if (vnetData.status == 401) {
                    var missingPermissionResource = `Virtual Network: ${vnetResourceId.split("/virtualNetworks/")[1]}`;
                    var viewMissingPermissionsonResource = showMissingPermissionStatus(missingPermissionResource);
                    checks = checks.concat(viewMissingPermissionsonResource);
                    permMgr.addResource(vnetResourceId);
                    var isContinue = "Incomplete";
                    return { checks, isContinue, subnetData };
                }
                else if (vnetData.status == 404) {
                    var resource = `Virtual Network ${vnetResourceId.split("/virtualNetworks/")[1]}`;
                    var views = [
                        new CheckStepView({
                            title: `${resource} does not exist`,
                            level: 2
                        }),
                        new InfoStepView({
                            infoType: 1,
                            title: `Issue found: ${resource} does not exist`,
                            markdown: `The app is integrated with a nonexistent VNet **${vnetResourceId}**. \r\n\r\n` +
                                `Please re-configure the VNet integration with a valid VNet.`
                        }),
                    ];                
                    checks = checks.concat(views);
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                var vnetProperties = vnetData["properties"]
                var subnets = vnetProperties["subnets"];

                //Search for the subnet
                subnets.forEach(subnet => {
                    if ((subnet && subnet["name"] || "").toLowerCase() == subnetName.toLowerCase()) {
                        subnetData = subnet;
                    }
                });

                //Check if SAL is initialized or not                        
                var subnetProperties = subnetData["properties"];
                var viewSalInitialized = checkSALInitialized(diagProvider, subnetProperties, subnetName);
                checks = checks.concat(viewSalInitialized.views);
                if (viewSalInitialized.isContinue === false) {
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                //Check subnet delegation                        
                var viewSubnetDelegation = checkSubnetDelegationStatus(subnetProperties, subnetName);
                checks = checks.concat(viewSubnetDelegation.views);
                if (viewSubnetDelegation.isContinue === false) {
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                //Check if SAL is owned by the current ASP
                var viewSalOwner = checkSALOwner(diagProvider, subnetData, subnetName, serverFarmId, serverFarmName);
                checks = checks.concat(viewSalOwner.views);
                if (viewSalOwner.isContinue === false) {
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                //Check if App Service plan is connected to 2 subnets                
                var aspSitesObj = await aspSitesObjPromise;
                if (aspSitesObj.status == 401) {
                    var missingPermissionResource = `App Service Plan: ${serverFarmName}`;
                    var viewMissingPermissionsonResource = showMissingPermissionStatus(missingPermissionResource);
                    checks = checks.concat(viewMissingPermissionsonResource);
                    permMgr.addResource(serverFarmId);
                    var isContinue = "Incomplete";
                    return { checks, isContinue, subnetData };
                }
                else if (aspSitesObj.status == 404) {
                    var resourceNotFound = `App Service Plan ${serverFarmName}`;
                    var viewResourceNotFound = showResourceNotFoundStatus(resourceNotFound);
                    checks = checks.concat(viewResourceNotFound);
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                var viewAspMultipleSubnet = await checkASPConnectedToMultipleSubnets(diagProvider, aspSitesObj, thisSite, serverFarmName, serverFarmId);
                checks = checks.concat(viewAspMultipleSubnet.views);
                if (viewAspMultipleSubnet.isContinue === false) {
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                //Check if Private IP is assigned
                //First we need to get the list of instances 
                var instancesObj = await instancesPromise;

                if (instancesObj.status == 401) {
                    var missingPermissionResource = `Instances: ${siteArmId}/instances`;
                    var viewMissingPermissionsonResource = showMissingPermissionStatus(missingPermissionResource);
                    checks = checks.concat(viewMissingPermissionsonResource);
                    permMgr.addResource(siteArmId);
                    var isContinue = "Incomplete";
                    return { checks, isContinue, subnetData };
                }
                else if (instancesObj.status == 404) {
                    var resourceNotFound = `Instance ${siteArmId}/instances`;
                    var viewResourceNotFound = showResourceNotFoundStatus(resourceNotFound);
                    checks = checks.concat(viewResourceNotFound);
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                var viewPrivateIP = await checkPrivateIPAsync(diagProvider, instancesObj, isKuduAccessiblePromise);
                checks = checks.concat(viewPrivateIP.views);

                isContinue = viewPrivateIP.isContinue;

                return { checks, isContinue, subnetData };
            }
        }
    } else {
        return { checks: undefined, isContinue: false, subnetData: undefined };
    }
}

function showGatewayVnetStatus(thisSite, siteGWVnetInfo) {

    var views = [], subChecks = [];
    var msg = "<table>";
    var vNetName = siteGWVnetInfo[0] && siteGWVnetInfo[0]["name"];
    msg += "<tr><td><b>Check Status</b></td><td>Pass</td></tr>";
    msg += `<tr><td><b>Description</b></td><td>App <b>${thisSite}</b> is configured to use Gateway VNET integration and connected to Virtual network` + vNetName ? ` <b>${vNetName}</b>.</td></tr>` : ".";
    msg += "</table>";
    subChecks.push({ level: 0, title: "Gateway VNet Integration detected" });

    views.push(new CheckStepView({
        level: 0,
        title: "Gateway VNet Integration detected",
        subChecks
    }));

    return views;
}

function showMissingPermissionStatus(resourceId) {

    var views = [];

    views.push(new CheckStepView({
        title: `You are missing permissions on ${resourceId}. For this diagnostic to run, you need permissions on this resource.`,
        level: 3
    }));

    return views;
}

function showResourceNotFoundStatus(resource) {

    var views = [
        new CheckStepView({
            title: `${resource} does not exist`,
            level: 2
        }),
        new InfoStepView({
            infoType: 1,
            title: `Issue found: ${resource} does not exist`,
            markdown: "Please re-configure your VNet integration."
        }),
    ];

    return views;
}

async function showVnetIntegrationNotConfiguredStatus(diagProvider, aspSitesObj, serverFarmId, serverFarmName) {

    var views = [];
    var msg = `<b>Recommendations: </b>`;
    msg += `<li>For setting up VNet integration, please see [Integrate your app with an Azure virtual network](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet).</li>`;

    var aspSites = (aspSitesObj.hasOwnProperty("value")) ? aspSitesObj["value"] : aspSitesObj;

    if (aspSites != null) {
        //for (var site in aspSites) {
        for (var i = 0; i < aspSites.length; i++) {
            if (aspSites[i] == null) {
                continue;
            }
            var siteResourceUri = aspSites[i]["id"];
            var siteName = aspSites[i]["name"];
            var siteVnetInfo = await getWebAppVnetInfo(siteResourceUri, diagProvider);
            var subnetName = "-";

            if (siteVnetInfo != null) {
                if (siteVnetInfo["properties"] != null && siteVnetInfo["properties"]["subnetResourceId"] != null) {
                    var subnetResourceId = siteVnetInfo["properties"]["subnetResourceId"];
                    if (subnetResourceId.includes("/subnets/")) {
                        subnetName = subnetResourceId.split("/subnets/")[1];
                        var subnetData = await getSubnet(diagProvider, subnetResourceId);

                        if (subnetData["properties"] != null) {
                            var sal = subnetData["properties"]["serviceAssociationLinks"];
                            var linkedAsp = sal && sal[0] && sal[0]["properties"] && sal[0]["properties"]["link"];
                            if (linkedAsp == null) {
                                continue;
                            }
                            if (linkedAsp.toLowerCase() === serverFarmId.toLowerCase()) {
                                msg += `<li>This App is hosted on App Service Plan <b>${serverFarmName}</b> that is already connected to subnet <b>${subnetName}</b>. You can integrate your app to the same subnet.`;
                            }
                            else {
                                msg += `<li>This App is hosted on App Service Plan <b>${serverFarmName}</b> that is connected to subnet <b>${subnetName}</b>, but owner of this subnet is <b>${linkedAsp.split("/serverfarms/")[1]}</b>. Please disconnect this subnet <b>${subnetName}</b> from Apps in <b>${linkedAsp.split("/serverfarms/")[1]}</b> or else create a new subnet and connect Apps in <b>${serverFarmName}</b> to it.`;
                            }
                        }
                        else {
                            msg += `<li>This App is hosted on App Service Plan <b>${serverFarmName}</b> that is already connected to subnet <b>${subnetName}</b>. But Service Association Link is not initialized on this subnet. Please disconnect all the apps that are connected to subnet <b>${subnetName}</b> and connect again to generate Service Association Link.`;
                        }
                    }
                }
            }

            var slotsObj = await diagProvider.getArmResourceAsync(siteResourceUri + "/slots");
            var slots = (slotsObj.hasOwnProperty("value")) ? slotsObj["value"] : slotsObj;

        }
    }


    views.push(new InfoStepView({
        infoType: 1,
        title: "Issue found: App is not configured for VNet Integration",
        markdown: msg
    }));

    return views;
}

function checkSubnetResourceIdFormat(subnetResourceId) {
    var views = [];
    var msg;
    var isContinue = true;
    if (!subnetResourceId.includes("/subnets/")) {
        //SubnetResourceId not in correct format
        msg = "<table>";
        msg += "<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>";
        msg += "<tr><td><b>Cause</b></td><td>SubnetResourceId is not in right format.</td></tr>";
        msg += "<tr><td><b>Recommended Action</b></td><td>Please review the ARM template and make sure SubnetResourceId should be in this format: <b>/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}<br/>/providers/Microsoft.Network/virtualNetworks/{vnetName}/subnets/{subnetName}</b>.</td></tr>";
        msg += "</table>";

        views.push(new CheckStepView({
            title: "SubnetResourceId format",
            level: 2
        }));

        views.push(new InfoStepView({
            infoType: 1,
            title: "SubnetResourceId format",
            markdown: msg
        }));

        isContinue = false;
    }

    return { views, isContinue };
}

function showSwiftNotSupportedStatus(swiftSupported) {

    var views = [];
    var msg;
    var isContinue = true;

    if (swiftSupported == null || swiftSupported === false) {
        msg = "<table>";
        msg += "<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>";
        msg += "<tr><td><b>Cause</b></td><td>isSwift property is set to False.</td></tr>";
        msg += "<tr><td><b>Recommended Action</b></td><td>Please review the ARM template and set swiftSupported property to True.</td></tr>";
        msg += "</table>";

        views.push(new CheckStepView({
            title: "IsSwift property is not True",
            level: 2
        }));

        views.push(new InfoStepView({
            infoType: 1,
            title: "Issue found: IsSwift property is not True",
            markdown: msg
        }));

        isContinue = false;
    }

    return { views, isContinue };
}

function checkSALInitialized(diagProvider, subnetProperties, subnetName) {
    var views = [];
    var isContinue = true;
    var msg;
    if (subnetProperties["serviceAssociationLinks"] == null) {
        msg = `<table>`;
        msg += `<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>`;
        msg += `<tr><td><b>Cause</b></td><td>Service Association Link is missing on the subnet <b>${subnetName}</b> </td></tr>`;
        msg += `<tr><td><b>Recommended Action</b></td><td>Please disconnect all the apps that are connected to subnet <b>${subnetName}</b> and connect again to generate service association link.</td></tr>`;
        msg += `</table>`;

        views.push(new CheckStepView({
            title: "Service Association Link not initialized",
            level: 2
        }));

        views.push(new InfoStepView({
            infoType: 1,
            title: "Issue found: Service Association Link not initialized",
            markdown: msg
        }));

        isContinue = false;
    }

    return { views, isContinue };
}

function checkSubnetDelegationStatus(subnetProperties, subnetName) {

    var msg;
    var views = [];
    var isContinue = true;
    var subnetDelegation = subnetProperties["delegations"];
    if (subnetDelegation && subnetDelegation[0] && subnetDelegation[0]["properties"] && subnetDelegation[0]["properties"]["serviceName"] == null) {
        msg = `<table>`;
        msg += "<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>";
        msg += `<tr><td><b>Cause</b></td><td>Subnet <b>${subnetName}</b> is not delegated to <b>Microsoft.Web/serverFarms</b> service.</td></tr>`;
        msg += `<tr><td><b>Recommended Action</b></td><td>Please enable subnet delegation to <b>Microsoft.Web/serverFarms</b> service.</td></tr>`;
        msg += `</table>`;

        views.push(new CheckStepView({
            title: "Subnet delegation not configured for Microsoft.Web/serverFarms",
            level: 2
        }));

        views.push(new InfoStepView({
            infoType: 1,
            title: "Issue found: Subnet delegation not configured for Microsoft.Web/serverFarms",
            markdown: msg
        }));

        isContinue = false;
    }
    else {
        if (subnetDelegation[0]["properties"]["serviceName"].toLowerCase() != ("Microsoft.Web/serverFarms").toLowerCase()) {
            msg = `<table>`;
            msg += `<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>`;
            msg += `<tr><td><b>Cause</b></td><td>Subnet <b>${subnetName}</b> is not delegated to <b>Microsoft.Web/serverFarms</b> service.</td></tr>`;
            msg += `<tr><td><b>Recommended Action</b></td><td>Please enable subnet delegation to <b>Microsoft.Web/serverFarms</b> service.</td></tr>`;
            msg += `</table>`;

            views.push(new CheckStepView({
                title: "Subnet delegation not configured for Microsoft.Web/serverFarms",
                level: 2
            }));

            views.push(new InfoStepView({
                infoType: 1,
                title: "Issue found: Subnet delegation not configured for Microsoft.Web/serverFarms",
                markdown: msg
            }));

            isContinue = false;
        }
        else {
            views.push(new CheckStepView({
                title: "Subnet delegation configured for Microsoft.Web/serverFarms",
                level: 0
            }));
        }
    }

    return { views, isContinue };

}

function checkSALOwner(diagProvider, subnetData, subnetName, serverFarmId, serverFarmName) {
    var views = [];
    var msg;
    var isContinue = true;
    var sal = subnetData && subnetData["properties"] && subnetData["properties"]["serviceAssociationLinks"];
    var linkedAsp = sal && sal[0] && sal[0]["properties"] && sal[0]["properties"]["link"];

    if (linkedAsp != null && linkedAsp.toLowerCase() != serverFarmId.toLowerCase()) {
        msg = `<table>`;
        msg += `<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>`;
        msg += `<tr><td><b>Cause</b></td><td>Service Association Link on subnet <b>${subnetName}</b> is owned by App Service Plan <b>${linkedAsp.split("/serverfarms/")[1]}</b> but the App is hosted on App Service Plan <b>${serverFarmName}</b>.</td></tr>`;
        msg += `<tr><td><b>Recommended Action</b></td><td><li>Either disconnect all the Apps in App Service Plan <b>${linkedAsp.split("/serverfarms/")[1]}</b> that are connected to subnet <b>${subnetName}</b> and reconnect this App again to the subnet.<li>Or, disconnect this App from subnet <b>${subnetName}</b> and connect to another subnet.</td></tr>`;
        msg += `</table>`;

        views.push(new CheckStepView({
            title: "Service Association Link owner is invalid",
            level: 2
        }));

        views.push(new InfoStepView({
            infoType: 1,
            title: "Issue found: Service Association Link owner is invalid",
            markdown: msg
        }));

        isContinue = false;
    }

    return { views, isContinue };

}

async function checkASPConnectedToMultipleSubnets(diagProvider, aspSitesObj, thisSite, serverFarmName, serverFarmId) {

    var views = [];
    var msg;
    var isContinue = true;
    var aspSubnetArray = [];
    var aspSites = (aspSitesObj.hasOwnProperty("value")) ? aspSitesObj["value"] : aspSitesObj;

    if (aspSites != null) {
        for (var i = 0; i < aspSites.length; i++) {
            if (aspSites[i] && aspSites[i]["id"] == null) {
                continue;
            }
            var siteResourceUri = aspSites[i]["id"];
            var siteVnetInfo = await getArmData(siteResourceUri + "/config/virtualNetwork", diagProvider);

            if (siteVnetInfo["properties"] != null && siteVnetInfo["properties"]["subnetResourceId"] != null) {
                var subnetResourceId = siteVnetInfo["properties"]["subnetResourceId"];

                if (!(subnetResourceId in aspSubnetArray)) {
                    aspSubnetArray.push(subnetResourceId);
                }
            }
        }
    }

    if (aspSubnetArray.length > 0) {
        var uniqueAspSubnets = aspSubnetArray.filter((e, i) => aspSubnetArray.indexOf(e) === i)

        msg = `App: <b>${thisSite}</b> is hosted on App Service Plan: <b>${serverFarmName}</b>. `;
        msg += `This App Service Plan is connected to <b>${uniqueAspSubnets.length}</b> subnet(s).<br/>`;

        if (uniqueAspSubnets.length > 1) {
            subnetValidationTable = "<table><tr><th>Subnet</th><th>Subnet delegated App Service Plan</th><th>Is valid delegation?</th></tr>";

            for (var i = 0; i < uniqueAspSubnets.length; i++) {
                var subnetResourceId = uniqueAspSubnets[i];
                var vnetResourceId, subnetName;
                if (subnetResourceId != null) {
                    subnetRelativeURl = "~" + subnetResourceId;

                    if (subnetResourceId.includes("/subnets/")) {
                        vnetResourceId = subnetResourceId.split("/subnets/")[0];
                        subnetName = subnetResourceId.split("/subnets/")[1];

                        //Get Subnet Data
                        var subnetData = await getSubnet(diagProvider, subnetResourceId);
                        var sal, linkedAsp;

                        if (subnetData && subnetData["properties"] && subnetData["properties"]["serviceAssociationLinks"] != null) {
                            sal = subnetData["properties"]["serviceAssociationLinks"];
                            linkedAsp = sal && sal[0] && sal[0]["properties"] && sal[0]["properties"]["link"] || '';
                        }

                        subnetValidationTable = subnetValidationTable.concat("<tr>");
                        subnetValidationTable = subnetValidationTable.concat(`<td>${subnetName}</td>`);
                        subnetValidationTable = subnetValidationTable.concat(`<td>${linkedAsp.split("/serverfarms/")[1]}</td>`);
                        subnetValidationTable = subnetValidationTable.concat(`<td><b><span style="color:${(linkedAsp.toLowerCase() === serverFarmId.toLowerCase()) ? "green" : "red"};">${linkedAsp.toLowerCase() == serverFarmId.toLowerCase()}</span></b></td>`);
                        subnetValidationTable = subnetValidationTable.concat("</tr>");
                    }
                }
            }
            subnetValidationTable += `</table>`;
            msg += `\n` + subnetValidationTable;

            msg += `<b>Recommendations: </b>`;
            msg += `<li>One App Service Plan must be connected to one subnet only.</li>`;
            msg += `<li>Please disconnect all the Apps in App Service Plan ${serverFarmName} and connect again to the intended subnet.</li>`;
            msg += `<li>If there are few Apps in this App Service Plan, that need to connect to different subnets, then move them to separate App Service Plans.</li>`;
            msg += `<br/>`;

            views.push(new CheckStepView({
                title: "App Service Plan connected to multiple subnets",
                level: 2
            }));

            views.push(new InfoStepView({
                infoType: 1,
                title: "Issue found: App Service Plan connected to multiple subnets",
                markdown: msg
            }));

            isContinue = false;
        }
    }

    return { views, isContinue };
}

async function checkPrivateIPAsync(diagProvider, instancesObj, isKuduAccessiblePromise) {

    var instances = (instancesObj.hasOwnProperty("value")) ? instancesObj["value"] : instancesObj;
    var privateIpPromiseArray = [];
    var instanceCount = 0;
    var instanceAllocated = 0;
    var views = [];
    var isContinue = true;
    var msg = `<b>Recommendations: </b>`;
    msg += `<li>Check if the subnet size is as per recommendations to allocate IPs to all instances..`;
    msg += `<li>If VNet integration was performed in the last 5 minutes, then wait for 10 minutes and run this diagnostic again.`;
    msg += `<li>Disconnect all apps in the app service plan and perform the VNet integration again.`;

    if (!(await isKuduAccessiblePromise)) {
        views.push(new CheckStepView({
            title: `Private IP allocation check is skipped because Kudu is unreachable`,
            level: 3
        }));
        isContinue = "Incomplete";
        return { views, isContinue };
    }

    for (var i = 0; i < instances.length; i++) {
        if (instances[i] && instances[i]["name"] == null) {
            continue;
        }
        var instanceName = instances[i]["name"];
        instanceCount++;
        var privateIpPromise = diagProvider.getEnvironmentVariablesAsync(["WEBSITE_PRIVATE_IP"], instanceName);
        privateIpPromiseArray.push(privateIpPromise);
    }

    await Promise.all(privateIpPromiseArray);

    for (var i = 0; i < privateIpPromiseArray.length; i++) {
        var privateIp = await privateIpPromiseArray[i];
        if (privateIp == null) {

        }
        else {

            instanceAllocated++;
        }
    }

    if (instanceCount === instanceAllocated) {

        views.push(new CheckStepView({
            title: `Private IP allocated for all(${instanceAllocated}) instances`,
            level: 0
        }));

    }
    else if (instanceAllocated == 0) {
        views.push(new CheckStepView({
            title: `Private IP not allocated for any instances (${instanceAllocated} out of ${instanceCount} allocated)`,
            level: 2
        }));

        views.push(new InfoStepView({
            infoType: 1,
            title: "Issue found: Private IP not allocated for any instances",
            markdown: msg
        }));

        isContinue = false;
    }
    else if (instanceCount > instanceAllocated) {
        views.push(new CheckStepView({
            title: `Private IP not allocated for few instances (${instanceAllocated} out of ${instanceCount} allocated)`,
            level: 2
        }));

        views.push(new InfoStepView({
            infoType: 1,
            title: "Issue found: Private IP not allocated for few instances",
            markdown: msg
        }));

        isContinue = false;
    }

    return { views, isContinue };
}

export async function checkSubnetSizeAsync(diagProvider, subnetDataPromise, serverFarmId, permMgr) {
    var views = [], checkResult = { level: 0, title: "" };
    var msg;
    var aspData = await diagProvider.getArmResourceAsync(serverFarmId);
    var subnetData = await subnetDataPromise;
    if (subnetData == null) {
        return null;
    }
    //Show subnet size recommendations but don't return 
    var subnetName = subnetData["name"];
    var subnetAddressPrefix = subnetData["properties"] && subnetData["properties"]["addressPrefix"] || '';
    var splitted = subnetAddressPrefix.split("/");
    var subnetSize = splitted.length > 0 ? splitted[1] : -1;
    var aspSku = aspData["sku"] && aspData["sku"]["name"] || '';
    checkResult.title = `Subnet size /${subnetSize} `

    if (subnetSize > 26 & aspSku[0] === "P") {
        msg = `<li>Subnet <b>${subnetName}</b> is not using the recommended address prefix of /26. Please increase size of the subnet.<br/>`;
        msg += `<br/><table><tr><th>Subnet Size</th><th>App Service Plan SKU</th><th>Recommended Subnet Size</th><th>Available Addresses</th></tr>`;
        msg += `<tr><td>/${subnetSize}</td><td>${aspSku}</td><td><b>/26</b></td><td>64-5 = <b>59</b> Addresses</td></tr>`;
        msg += `<tr><td colspan='5'><i>Note: Azure reserves 5 IP addresses within each subnet.</i></td></tr></table>`;
        msg += `<u>Steps to increase the subnet size:</u>`;
        msg += `<li>In this App Service Plan, disconnect all the Web Apps that are currently using Regional VNET integration. This would cause Apps to lose connectivity to VNet resource, so please plan this change accordingly.</li>`;
        msg += `<li>Increase the subnet size as per the recommendations.</li>`;
        msg += `<li>Reconnect the webapps to the same subnet.</li>`;
        msg += `<br/>`;

        views.push(new InfoStepView({
            infoType: 1,
            title: "Subnet Size Recommendations",
            markdown: msg
        }));
        checkResult.level = 1;
        checkResult.title += "is too small";
    }
    else if (subnetSize > 27) {
        msg = `<li>Subnet <b>${subnetName}</b> is not using the recommended address prefix of /27. Please increase size of the subnet.<br/>`;
        msg += `<br/><table><tr><th>Subnet Size</th><th>App Service Plan SKU</th><th>Recommended Subnet Size</th><th>Available Addresses</th></tr>`;
        msg += `<tr><td>/${subnetSize}</td><td>${aspSku}</td><td><b>/27</b></td><td>32-5 = <b>27</b> Addresses</td></tr>`;
        msg += `<tr><td colspan='5'><i>Note: Azure reserves 5 IP addresses within each subnet.</i></td></tr></table>`;
        msg += `<u>Steps to increase the subnet size:</u>`;
        msg += `<li>In this App Service Plan, disconnect all the Web Apps that are currently using Regional VNET integration. This would cause Apps to lose connectivity to VNet resource, so please plan this change accordingly.</li>`;
        msg += `<li>Increase the subnet size as per the recommendations.</li>`;
        msg += `<li>Reconnect the webapps to the same subnet.</li>`;
        msg += `<br/>`;

        views.push(new InfoStepView({
            infoType: 1,
            title: "Subnet Size Recommendations",
            markdown: msg
        }));
        checkResult.level = 1;
        checkResult.title += "is too small";
    } else {
        checkResult.title += "is healthy";
        checkResult.level = 0;
    }
    return { views, checkResult };
}

export async function checkDnsSettingAsync(siteInfo, diagProvider) {
    var views = [], subChecks = [];
    var dnsServers = [];
    var vnetDns = [];
    var level = 0;

    var appSettings = await diagProvider.getAppSettings();
    var dnsAppSettings = [appSettings["WEBSITE_DNS_SERVER"], appSettings["WEBSITE_DNS_ALT_SERVER"]].filter(i => i != null);
    var alwaysFallBackToPublicDns = (appSettings["WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS"] === "1");


    var dnsSettings = null;
    var dnsSettingSource = null;
    if (dnsAppSettings.length > 0) {
        subChecks.push({
            title: `Detected DNS ${dnsAppSettings.join(";")} configured in App Settings.`,
            level: 0
        });
        dnsSettings = dnsAppSettings;
        dnsSettingSource = "App Settings";
    } else {
        var siteVnetInfo = await getWebAppVnetInfo(siteInfo["id"], diagProvider);
        if (siteVnetInfo.status == 200) {
            var vnetInfo = siteVnetInfo["properties"];
            var subnetResourceId = vnetInfo["subnetResourceId"];

            if (subnetResourceId != null) {
                if (subnetResourceId.includes("/subnets/")) {
                    var vnetResourceId = subnetResourceId.split("/subnets/")[0];
                    var vnetMetaData = await diagProvider.getArmResourceAsync(vnetResourceId, "2018-07-01");
                    if (vnetMetaData != null && vnetMetaData.status == 200) {
                        if (vnetMetaData["properties"] && vnetMetaData["properties"]["dhcpOptions"] && vnetMetaData["properties"]["dhcpOptions"]["dnsServers"] != null) {
                            vnetDns = vnetMetaData["properties"]["dhcpOptions"]["dnsServers"];
                        }
                    } else {
                        if (vnetMetaData.status == 401) {
                            subChecks.push({ title: "DNS check is skipped due to having no access to subnet", level: 3 });
                            return { views, dnsServer, subChecks };
                        } else {
                            throw new Error("checkDnsSetting failed due to unknown status of vnetMetaData");
                        }
                    }
                }
            }
        } else {
            throw new Error("checkDnsSetting failed due to unknown status of siteVnetInfo");
        }

        if (vnetDns.length > 0) {
            if (vnetDns.length > 2) {
                vnetDns.sort();
                dnsSettings = vnetDns.slice(0, 2);
                subChecks.push({
                    title: `Detected ${vnetDns.length} VNet DNS settings, only 2 of them ${dnsSettings.join(" and ")} will be applied`,
                    level: 1
                });
                level = 1;
                var markdown = `You have ${vnetDns.length} custom DNS servers set in VNet, but only first two ${dnsSettings.join(" and ")} will be used in Windows AppService`;

                views.push(new InfoStepView({
                    infoType: 1,
                    title: "About DNS settings limitation",
                    markdown: markdown
                }));
            } else {
                dnsSettings = vnetDns;
                subChecks.push({
                    title: `Detected DNS ${vnetDns.join(";")} configured in VNet settings`,
                    level: 0
                });
            }
            dnsSettingSource = "VNet";
        }
    }

    if (dnsSettings != null) {
        if (!alwaysFallBackToPublicDns) {
            subChecks.push({
                title: "WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS is not set or set to 0, Azure DNS server won't be applied",
                level: 3
            });
        } else {
            subChecks.push({
                title: "WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS is set to 1, Azure DNS server will be applied as backup",
                level: 3
            });
        }
        // verify if custom dns is reachable
        var p1 = diagProvider.tcpPingAsync(dnsSettings[0], 53);
        var p2 = dnsSettings.length >= 2 ? diagProvider.tcpPingAsync(dnsSettings[1], 53) : Promise.resolve(null);
        await Promise.all([p1, p2]);
        var r1 = await p1;
        var r2 = await p2;
        if (r1.status == 0) {
            dnsServers.push(dnsSettings[0]);
        } else {
            level = 1;
            subChecks.push({
                title: `DNS server ${dnsSettings[0]} is not reachable`,
                level: 1
            });
        }

        if (r2) {
            if (r2.status == 0) {
                dnsServers.push(dnsSettings[1]);
            } else {
                level = 1;
                subChecks.push({
                    title: `DNS server ${dnsSettings[1]} is not reachable`,
                    level: 1
                });
            }
        }

        if (dnsServers.length == 0) {
            if (!alwaysFallBackToPublicDns) {
                subChecks.push({
                    title: `None of your custom DNS server is reachable`,
                    level: 2
                });
                views.push(new InfoStepView({
                    infoType: 1,
                    title: "Issue found: custom DNS is not reachable",
                    markdown: `You have custom DNS server ${dnsSettings.slice(0, 2).join(" and ")} configured in ${dnsSettingSource} but they are not reachable from this app, please double check if the settings are correct and DNS server is working properly. `
                }));
            } else {
                subChecks.push({
                    title: `None of your custom DNS server is reachable, Azure DNS will be applied`,
                    level: 1
                });
            }
        }
        else {
            subChecks.push({
                title: `Verified custom DNS server ${dnsServers.join(" and ")} ${dnsServers.length > 1 ? "are" : "is"} reachable. ` +
                    `${dnsServers.length > 1 ? "They" : "It"} will be used to resolve hostnames.`,
                level: 0
            });
        }

        if (alwaysFallBackToPublicDns) {
            dnsServers.push("");
        }
    } else {
        dnsServers = [""];
        subChecks.push({
            title: `No custom DNS is set, default Azure DNS will be applied`,
            level: 0
        });
    }
    return { views, dnsServers, subChecks, level };
}

export function extractHostPortFromConnectionString(connectionString) {
    var hostName = undefined;
    var port = undefined;

    var connectionStringTokens = connectionString.split(";");
    var connectionStringKVMap = connectionStringTokens.reduce(
        (dict, element) =>  {
            var kvpair = element.split("=");
            if (kvpair.length == 2) {
                (dict[kvpair[0]] = kvpair[1])
            }
            return dict;
        },
        {}
    );
    
    if (connectionStringKVMap["AccountName"] != undefined)
    {
        // Storage account: DefaultEndpointsProtocol=https;AccountName=<account_name>;AccountKey=<key>;EndpointSuffix=core.windows.net;
        var storageAccountName = connectionStringKVMap["AccountName"];
        hostName = connectionStringKVMap["EndpointSuffix"] != undefined ? 
            storageAccountName + ".blob." + connectionStringKVMap["EndpointSuffix"] : 
            storageAccountName + ".blob.core.windows.net";
        port = connectionStringKVMap["DefaultEndpointsProtocol"] == "http" ? 80 : 443;
    } else if (connectionStringKVMap["Endpoint"] != undefined) {
        // Event hubs: Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>;EntityPath=<event_hub_name>
        // Service bus: Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>
        hostName = connectionStringKVMap["Endpoint"].split("sb://")[1].split("/")[0];
        port = 443;
    } else if (connectionStringKVMap["AccountEndpoint"] != undefined)
    {
        // Cosmos DB: AccountEndpoint=https://<account_name>.documents.azure.com:443/;AccountKey=<key>;"
        hostName = connectionStringKVMap["AccountEndpoint"].split("https://")[1].split(":")[0];
        port = connectionStringKVMap["AccountEndpoint"].split("https://")[1].split(":")[1].split("/")[0];
    } else if (connectionStringKVMap["IngestionEndpoint"] != undefined) {
        // Application Insights: InstrumentationKey=0b7c83b0-add4-4025-939f-4e67ccb1ad19;IngestionEndpoint=https://westus2-1.in.applicationinsights.azure.com/
        hostName = connectionStringKVMap["IngestionEndpoint"].split("https://")[1].split("/")[0];
        port = 443;
    }

    return { "HostName": hostName, "Port": port }
}

export function extractHostPortFromKeyVaultReference(keyVaultReference) {
    // Format: @Microsoft.KeyVault(SecretUri=https://<Host>/<some_path>) 
    // OR
    // @Microsoft.KeyVault(VaultName=vaultName;SecretName=secretName;SecretVersion=secretVersion)
    var secretUriPrefix = "SecretUri=https://";
    var vaultNamePrefix = "VaultName=";
    var keyVaultDomainName = "vault.azure.net";  // TODO: This needs to be dynamically determined based on the cloud this app is in
    var hostName = undefined;
    var port = 443;
    if (keyVaultReference.indexOf(secretUriPrefix) != -1) {
        hostName = keyVaultReference.split(secretUriPrefix)[1].split("/")[0];
    } else if (keyVaultReference.indexOf(vaultNamePrefix) != -1) {
        hostName = keyVaultReference.split(vaultNamePrefix)[1].split(";")[0] + "." + keyVaultDomainName;
    }

    return { "HostName": hostName, "Port": port }
}

export function addSubnetSelectionDropDownView(siteInfo, diagProvider, flowMgr, title, processSubnet){
    var dropdownView = new DropdownStepView({
        dropdowns: [],
        width: "60%",
        bordered: true,
        description: title,
        async callback(dropdownIdx, selectedIdx) {
            if (dropdownIdx === 0) {
                dropdownView.dropdowns.length = 1;
                var subscription = subscriptions[selectedIdx];
                var vnetDropdown = vnetDropdown = {
                    description: "Virtual Network",
                    options: [],
                    placeholder: "Loading..."
                };
                dropdownView.dropdowns.push(vnetDropdown);
                vnets = await diagProvider.getArmResourceAsync(`/subscriptions/${subscription.subscriptionId}/providers/Microsoft.Network/virtualNetworks`, "2018-07-01");
                dropdownView.dropdowns.length = 1;
                vnets = vnets.value.filter(v => v && v.name != null).sort((s1, s2) => s1.name.toLowerCase() > s2.name.toLowerCase() ? 1 : -1);

                if (vnets.length > 0) {
                    vnetDropdown = {
                        description: "Virtual Network",
                        options: vnets.map(s => s.name),
                        placeholder: "Please select..."
                    };
                } else {
                    vnetDropdown = {
                        description: "Virtual Network",
                        options: [],
                        placeholder: "No VNet found in this subscription"
                    }
                }
                dropdownView.dropdowns.push(vnetDropdown);
            } else if (dropdownIdx === 1) {
                dropdownView.dropdowns.length = 2;
                var vnet = vnets[selectedIdx];
                subnets = vnet.properties == null ? [] : vnet.properties.subnets.filter(s => s && s.name != null);
                subnets = subnets.sort((s1, s2) => s1.name.toLowerCase() > s2.name.toLowerCase() ? 1 : -1);
                var subnetDropdown = null;
                if (subnets.length > 0) {
                    subnetDropdown = {
                        description: "Subnet",
                        options: subnets.map(s => s.name),
                        placeholder: "Please select..."
                    };
                } else {
                    subnetDropdown = {
                        description: "Subnet",
                        options: [],
                        placeholder: "No subnet found in this VNet"
                    }
                }
                dropdownView.dropdowns.push(subnetDropdown);
            } else {
                flowMgr.reset(state);
                var subnet = subnets[selectedIdx];
                var promise = processSubnet(subnet);
                //flowMgr.addViews(promise, "Checking subnet...");
            }
        }
    });
    var subscriptions = null, vnets = null, subnets = null;
    var subscriptionDropdown = {
        description: "Subscription",
        options: [],
        placeholder: "Loading..."
    };
    dropdownView.dropdowns.push(subscriptionDropdown);
    var state = flowMgr.addView(dropdownView);

    diagProvider.getArmResourceAsync("subscriptions")
        .then(s => {
            subscriptions = s.value.filter(s => s && s.displayName != null).sort((s1, s2) => s1.displayName.toLowerCase() > s2.displayName.toLowerCase() ? 1 : -1);
            subscriptionDropdown.options = subscriptions.map((s, i) => {
                if(s.subscriptionId == siteInfo.subscriptionId){
                    subscriptionDropdown.defaultChecked = i;
                }
                return s.displayName;
            });
            subscriptionDropdown.placeholder = "Please select...";
            dropdownView.dropdowns.length = 0;
            dropdownView.dropdowns.push(subscriptionDropdown);
        });
}