import {GetArmData, GetWebAppVnetInfo, GetSubnet, ResourcePermissionCheckManager} from './flowMisc.js';

export var connectionFailureFlow = {
    title: "I'm unable to connect to a resource, such as SQL or Redis or on-prem, in my Virtual Network",
    async func(siteInfo, diagProvider, flowMgr) {
        var isKuduAccessible = true;

        var kuduAvailabilityCheckPromise = (async () => {
            isKuduAccessible = await diagProvider.checkKuduReachable(10);
            var views = [];
            if (isKuduAccessible == false) {
                views.push(new CheckStepView({
                    title: "kudu is not reachable, diagnostic will be incomplete",
                    level: 1
                }));

                views.push(new InfoStepView({
                    infoType: 1,
                    title: "Recommendations",
                    markdown: "[Kudu](https://techcommunity.microsoft.com/t5/educator-developer-blog/using-kudu-and-deploying-apps-into-azure/ba-p/378585) is not accessible. Possible reason can be:\r\n\r\n" +
                        "1. Your app has IP restriction or Private Endpoint turned on. Please check your configuration and consider running this check in an environment that is allowed to access your app" +
                        " or temporarily allow the traffic by adding your client IP into IP restriction allow list or turning of the Private Endpoint for running the network checks\r\n\r\n" +
                        "2. You don't have permission to access kudu site, please check your permission\r\n\r\n" +
                        "The diagnostic will be incomplete without kudu access."
                }));
            }
            return views;
        })();
        flowMgr.addViews(kuduAvailabilityCheckPromise, "Checking kudu availability...");
        var permMgr = new ResourcePermissionCheckManager();
        flowMgr.addView(permMgr.checkView);

        var kuduReachablePromise = kuduAvailabilityCheckPromise.then(r => isKuduAccessible);

        var promise = checkVnetIntegrationHealth(siteInfo, diagProvider, kuduReachablePromise, permMgr);
        flowMgr.addViews(promise.then(d => d.views), "Checking VNet integration status...");

        var data = { subnetDataPromise: promise.then(d => d.subnetData), serverFarmId: siteInfo["serverFarmId"], kuduReachablePromise, isContinuedPromise: promise.then(d => d.isContinue) };
        checkNetworkConfigAndConnectivity(siteInfo, diagProvider, flowMgr, data, permMgr);
    }
}

async function runConnectivityCheck(hostname, port, dnsServer, diagProvider) {
    var result = await diagProvider.checkConnectionAsync(hostname, port, undefined, dnsServer);
    var status = result.status;
    var ip = result.ip;
    var markdown = null;
    var views = [];
    var resolvedIp = "";
    if (ip != hostname) {
        if (ip == null) {
            markdown = `DNS server cannot resolve the hostname ${hostname}, possible reasons can be:\r\n` +
                `1. hostname ${hostname} does not exist, please double check if the hostname is correct\r\n\r\n` +
                (dnsServer == "168.63.129.16" ? "" : `1. Your custom DNS server ${dnsServer} was used for resolving hostname, but there is no DNS entry on the server for ${hostname}, please check your DNS server.\r\n\r\n`) +
                "1. If your target endpoint is an Azure service with Private Endpoint enabled, please check its Private Endpoint DNS Zone settings.\r\n\r\n"
            views.push(new CheckStepView({
                title: `failed to resolve the IP of ${hostname}`,
                level: 2
            }));
            views.push(new InfoStepView({
                infoType: 1,
                title: "Explanation of the result and recommended next steps",
                markdown: markdown
            }));
            return views;
        }
        resolvedIp = `hostname **${hostname}** was resolved to IP: ` + ip;
    }
    if (status == 0) {
        markdown = "Connectivity test succeeded at tcp level. " +
            "This means Transportation Layer connection was successfully established between this app and the target endpoint. \r\n\r\n" +
            "If your app is still having runtime connection failures with this endpoint, the possible reasons can be: \r\n\r\n" +
            "1. Service is not available, please check the status of your endpoint server.\r\n\r\n" +
            "2. Endpoint firewall blocks Web App or Function App's IP address, please check the IP restriction or application level firewall.\r\n\r\n" +
            "3. The traffic was blocked by Network Security Group or Firewall, please check your NSG or/and Firewall configuration if there is any.\r\n\r\n" +
            "4. The traffic was routed to a wrong destination, please check your User Defined Route Table if there is any.\r\n\r\n" +
            "5. The endpoint is an Azure Resource in a VNet in a different region. "
        resolvedIp;
        views.push(new CheckStepView({
            title: `Connecting to ${hostname}:${port} - OK (tcp level)`,
            level: 0
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: markdown
        }));
    } else if (status == 1) {
        markdown = "Connectivity test failed at tcp level. " +
            "This means the endpoint was not reachable in Transportation Layer. Possible reasons can be: \r\n\r\n" +
            "1. The endpoint does not exist, please double check the hostname:port or ip:port was correctly set. \r\n\r\n" +
            "2. The endpoint is not reachable from the VNet, please double check if the endpoint server is correctly configured. \r\n\r\n" +
            "3. There is a TCP level firewall or a Network Security Group Rule blocking the traffic from this app. Please check your firewall or NSG rules if there are any. \r\n\r\n" +
            resolvedIp;
        views.push(new CheckStepView({
            title: `Connecting to ${hostname}:${port} - failed, timeout because target unreachable`,
            level: 2
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: markdown
        }));

    } else {
        views.push(new CheckStepView({
            title: `Connecting to ${hostname}:${port} - failed, errorcode:${status}`,
            level: 2
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: "Unknown problem, please send a feedback to let us know and consider creating a support ticket for this."
        }));

    }
    return views;
}

async function checkVnetIntegrationHealth(siteInfo, diagProvider, isKuduAccessiblePromise, permMgr) {

    var views = [], subnetData, isContinue;

    var promise = checkVnetIntegrationAsync(siteInfo, diagProvider, isKuduAccessiblePromise, permMgr);
    isContinue = await promise.then(d => d.isContinue);
    if (isContinue) {
        // Complete or Incomplete
        var view = new CheckStepView({
            title: "VNet integration is healthy",
            level: 0,
            subChecks: await promise.then(d => d.checks.filter(c => c.type == 1))
        });

        if (isContinue == "Incomplete") {
            view.title += " (incomplete result)";
        }

        views = views.concat(view);
    }
    else {
        var subchecks = await promise.then(d => d.checks.filter(c => c.type == 1));
        if (subchecks[0].title == "App is not configured for VNet Integration") {
            views = views.concat(new CheckStepView({
                title: "App is not configured for VNet Integration",
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
    var siteVnetInfo = await GetWebAppVnetInfo(siteArmId, diagProvider);

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
                    var vnetData = await diagProvider.getArmResourceAsync(vnetResourceId, "2020-11-01");
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
            if (viewSubnetResourceIdFormatIncorrect.isContinue == false) {
                var isContinue = false;
                return { checks, isContinue, subnetData };
            }

            var subnetName = subnetResourceId.split("/")[10];
            var swiftSupported = vnetInfo["swiftSupported"];

            //Show swiftSupported property status
            var viewSwiftSupported = showSwiftNotSupportedStatus(swiftSupported);
            checks = checks.concat(viewSwiftSupported.views);
            if (viewSwiftSupported.isContinue == false) {
                var isContinue = false;
                return { checks, isContinue, subnetData };
            }

            if (swiftSupported == true && subnetResourceId.includes("/subnets/")) {

                //Get Virtual Network
                vnetResourceId = subnetResourceId.split("/subnets/")[0];
                var vnetData = await diagProvider.getArmResourceAsync(vnetResourceId, "2020-11-01");
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
                    var viewResourceNotFound = showResourceNotFoundStatus(resourceNotFound);
                    checks = checks.concat(viewResourceNotFound);
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                var vnetProperties = vnetData["properties"]
                var subnets = vnetProperties["subnets"];

                //Search for the subnet
                subnets.forEach(subnet => {
                    if (subnet["name"].toLowerCase() == subnetName.toLowerCase()) {
                        subnetData = subnet;
                    }
                });

                //Check if SAL is initialized or not                        
                var subnetProperties = subnetData["properties"];
                var viewSalInitialized = checkSALInitialized(diagProvider, subnetProperties, subnetName);
                checks = checks.concat(viewSalInitialized.views);
                if (viewSalInitialized.isContinue == false) {
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                //Check subnet delegation                        
                var viewSubnetDelegation = checkSubnetDelegationStatus(subnetProperties, subnetName);
                checks = checks.concat(viewSubnetDelegation.views);
                if (viewSubnetDelegation.isContinue == false) {
                    var isContinue = false;
                    return { checks, isContinue, subnetData };
                }

                //Check if SAL is owned by the current ASP
                var viewSalOwner = checkSALOwner(diagProvider, subnetData, subnetName, serverFarmId, serverFarmName);
                checks = checks.concat(viewSalOwner.views);
                if (viewSalOwner.isContinue == false) {
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
                if (viewAspMultipleSubnet.isContinue == false) {
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
    }
}

async function GetVirtualNetwork(vnetArmId, armService) {
    var vnetData = await armService.getArmResourceAsync(vnetArmId, "2020-11-01");
    return vnetData;
}

function checkNetworkConfigAndConnectivity(siteInfo, diagProvider, flowMgr, data, permMgr) {
    var subnetDataPromise = data.subnetDataPromise;
    var isContinuedPromise = data.isContinuedPromise;
    var serverFarmId = data.serverFarmId;
    var kuduReachablePromise = data.kuduReachablePromise;
    var kuduReachable = null;
    var dnsServer = null;
    var configCheckViewsPromise = (async () => {
        var views = [], subChecks = [];
        var configCheckView = new CheckStepView({
            title: "Network Configuration is healthy",
            level: 0
        });
        views.push(configCheckView);
        var subnetSizeCheckPromise = checkSubnetSizeAsync(diagProvider, subnetDataPromise, serverFarmId, permMgr);
        var dnsCheckResultPromise = checkDnsSetting(siteInfo, diagProvider);

        var subnetSizeResult = await subnetSizeCheckPromise;
        if (subnetSizeResult != null) {
            if (subnetSizeResult.checkResult.level == 1) {
                configCheckView.title = "Network Configuration is suboptimal";
                configCheckView.level = 1;
            }
            views = views.concat(subnetSizeResult.views);
            subChecks.push(subnetSizeResult.checkResult);
        }

        kuduReachable = await kuduReachablePromise;
        if (kuduReachable) {
            var dnsCheckResult = await dnsCheckResultPromise;
            dnsServer = dnsCheckResult.dnsServer;
            views = views.concat(dnsCheckResult.views);
            subChecks = subChecks.concat(dnsCheckResult.subChecks);
            if (dnsServer == null) {
                configCheckView.title = "Network Configuration is unhealthy";
                configCheckView.level = 2;
            }
        } else {
            subChecks.push({ title: "DNS check was skipped due to having no access to kudu", level: 3 });
            configCheckView.title += " (incomplete result)";
        }
        configCheckView.subChecks = subChecks;
        return views;
    })();

    flowMgr.addViews(isContinuedPromise.then(c => c ? configCheckViewsPromise : null), "Checking Network Configuration...");

    var state = null;
    var connectivityCheckViewPromise = (async () => {
        var isContinued = await isContinuedPromise;
        await configCheckViewsPromise;
        if (!kuduReachable) {
            return [new CheckStepView({ title: "Connectivity check (tcpping and nameresolver) is not available due to kudu is inaccessible.", level: 3 })];
        }

        if (dnsServer == null || !isContinued) {
            return [];
        }

        return [new InputStepView({
            title: "Specify a server endpoint you want to test connectivity to",
            placeholder: "hostname:port or ip:port",
            buttonText: "Continue",
            entry: "Endpoint",
            text: "",
            tooltip: "e.g. microsoft.com:443 or 8.8.8.8:53\r\ncommon service ports: http - 80; https - 443; sql server - 1433; dns - 53",
            error: null,
            async callback(userInput) {
                flowMgr.reset(state);

                var splitted = userInput.split(":");
                var hostname, port;

                if (userInput.startsWith("http")) {
                    port = userInput.startsWith("https") ? 443 : 80;
                    var m = userInput.match(/\/\/(.*?)(\/.*|$)/);
                    hostname = (m == null ? null : m[1]);
                    if (hostname == null) {
                        this.error = "invalid endpoint";
                    } else {
                        this.text = `${hostname}:${port}`;
                        flowMgr.addViews(runConnectivityCheck(hostname, port, dnsServer, diagProvider), `Testing ${userInput}...`);
                    }
                } else {
                    if (splitted.length != 2 || isNaN(port = parseInt(splitted[1]))) {
                        this.error = "invalid endpoint";
                    } else {
                        this.error = null;
                        hostname = splitted[0];
                        flowMgr.addViews(runConnectivityCheck(hostname, port, dnsServer, diagProvider), `Testing ${userInput}...`);
                    }
                }
            }
        })];
    })();
    state = flowMgr.addViews(connectivityCheckViewPromise);
}

async function checkSubnetSizeAsync(diagProvider, subnetDataPromise, serverFarmId, permMgr) {
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
    var aspSku = aspData["sku"]["name"] || '';
    checkResult.title = `subnet size /${subnetSize} `

    if (subnetSize > 26 & aspSku[0] == "P") {
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

function showGatewayVnetStatus(thisSite, siteGWVnetInfo) {

    var views = [], subChecks = [];
    var msg = "<table>";
    msg += "<tr><td><b>Check Status</b></td><td>Pass</td></tr>";
    msg += `<tr><td><b>Description</b></td><td>App <b>${thisSite}</b> is configured to use Gateway VNET integration and connected to Virtual network <b>${siteGWVnetInfo[0]["name"]}</b>.</td></tr>`;
    msg += "</table>";
    subChecks.push({ level: 0, title: "Gateway VNet Integration detected" });

    views.push(new CheckStepView({
        level: 0,
        title: "Gateway VNet Integration detected",
        subChecks
    }));

    return views;
}

function showSwiftNotSupportedStatus(swiftSupported) {

    var views = [];
    var msg;
    var isContinue = true;

    if (swiftSupported == null || swiftSupported == false) {
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
            var siteVnetInfo = await GetWebAppVnetInfo(siteResourceUri, diagProvider);
            var subnetName = "-";

            if (siteVnetInfo != null) {
                if (siteVnetInfo["properties"] != null && siteVnetInfo["properties"]["subnetResourceId"] != null) {
                    var subnetResourceId = siteVnetInfo["properties"]["subnetResourceId"];
                    if (subnetResourceId.includes("/subnets/")) {
                        subnetName = subnetResourceId.split("/subnets/")[1];
                        var subnetData = await GetSubnet(diagProvider, subnetResourceId);

                        if (subnetData["properties"] != null) {
                            var sal = subnetData["properties"]["serviceAssociationLinks"];
                            var linkedAsp = sal && sal[0] && sal[0]["properties"] && sal[0]["properties"]["link"];
                            if (linkedAsp == null) {
                                continue;
                            }
                            if (linkedAsp.toLowerCase() == serverFarmId.toLowerCase()) {
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
            var siteVnetInfo = await GetArmData(siteResourceUri + "/config/virtualNetwork", diagProvider);

            if (siteVnetInfo["properties"] != null && siteVnetInfo["properties"]["subnetResourceId"] != null) {
                var subnetResourceId = siteVnetInfo["properties"]["subnetResourceId"];

                if (!(subnetResourceId in aspSubnetArray)) {
                    aspSubnetArray.push(subnetResourceId);
                }
            }
        }
    }

    if (aspSubnetArray.length > 0) {
        var uniqueAspSubnets = aspSubnetArray.filter((e, i) => aspSubnetArray.indexOf(e) == i)

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
                        var subnetData = await GetSubnet(diagProvider, subnetResourceId);
                        var sal, linkedAsp;

                        if (subnetData && subnetData["properties"] && subnetData["properties"]["serviceAssociationLinks"] != null) {
                            sal = subnetData["properties"]["serviceAssociationLinks"];
                            linkedAsp = sal && sal[0] && sal[0]["properties"] && sal[0]["properties"]["link"] || '';
                        }

                        subnetValidationTable = subnetValidationTable.concat("<tr>");
                        subnetValidationTable = subnetValidationTable.concat(`<td>${subnetName}</td>`);
                        subnetValidationTable = subnetValidationTable.concat(`<td>${linkedAsp.split("/serverfarms/")[1]}</td>`);
                        subnetValidationTable = subnetValidationTable.concat(`<td><b><span style="color:${(linkedAsp.toLowerCase() == serverFarmId.toLowerCase()) ? "green" : "red"};">${linkedAsp.toLowerCase() == serverFarmId.toLowerCase()}</span></b></td>`);
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
            title: `Private IP allocation check is skipped because kudu is unreachable`,
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

    if (instanceCount == instanceAllocated) {

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

async function checkDnsSetting(siteInfo, diagProvider) {
    var views = [], subChecks = [];
    var dnsServer = null;
    var vnetDns = [];

    var appSettings = await diagProvider.getAppSettings();
    var dnsAppSettings = [appSettings["WEBSITE_DNS_SERVER"], appSettings["WEBSITE_DNS_ALT_SERVER"]].filter(i => i != null);

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
        var siteVnetInfo = await GetWebAppVnetInfo(siteInfo["id"], diagProvider);
        if (siteVnetInfo.status == 200) {
            var vnetInfo = siteVnetInfo["properties"];
            var subnetResourceId = vnetInfo["subnetResourceId"];

            if (subnetResourceId != null) {
                if (subnetResourceId.includes("/subnets/")) {
                    var vnetResourceId = subnetResourceId.split("/subnets/")[0];
                    var vnetMetaData = await diagProvider.getArmResourceAsync(vnetResourceId, "2020-11-01");
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
                    title: `Detected ${vnetDns.length} VNet DNS settings`,
                    level: 1
                });
                markdown = `You have ${vnetDns.length} custom DNS set in VNet, but only first two ${dnsSettings.join(";")} will be used in Windows AppService`;

                views.push(new InfoStepView({
                    infoType: 0,
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
        // verify if custom dns is reachable
        var p1 = diagProvider.tcpPingAsync(dnsSettings[0], 53);
        var p2 = dnsSettings.length >= 2 ? diagProvider.tcpPingAsync(dnsSettings[1], 53) : Promise.resolve(null);
        await Promise.all([p1, p2]);
        var r1 = await p1;
        var r2 = await p2;
        if (r1.status == 0) {
            dnsServer = dnsSettings[0];
        } else if (r2 && r2.status == 0) {
            dnsServer = dnsSettings[1];
        }

        if (dnsServer == null) {
            subChecks.push({
                title: `Custom DNS server ${dnsSettings.slice(0, 2).join(" or ")} is not reachable!`,
                level: 2
            });
            views.push(new InfoStepView({
                infoType: 1,
                title: "Issue found: custom DNS is not reachable",
                markdown: `You have custom DNS server ${dnsSettings.slice(0, 2).join(";")} configured in ${dnsSettingSource} but they are not reachable from this app, please double check if the DNS server is working properly. `
            }));
        }
        else {
            subChecks.push({
                title: `Verified custom DNS ${dnsServer} is reachable. It will be used to resolve hostnames.`,
                level: 0
            });
        }
    } else {
        dnsServer = "168.63.129.16";
        subChecks.push({
            title: `No custom DNS is set, default DNS 168.63.129.16 will be applied`,
            level: 0
        });
    }
    return { views, dnsServer, subChecks };
}

