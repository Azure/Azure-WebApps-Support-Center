import {ResourcePermissionCheckManager, checkVnetIntegrationHealth, checkDnsSettingAsync, checkSubnetSizeAsync} from './flowMisc.js';
import {CommonRecommendations} from './commonRecommendations.js'
export var connectionFailureFlow = {
    title: "Connection issues",
    async func(siteInfo, diagProvider, flowMgr) {
        var commonRec = new CommonRecommendations();
        var isKuduAccessible = true;

        var kuduAvailabilityCheckPromise = (async () => {
            isKuduAccessible = await diagProvider.checkKuduReachable(30);
            var views = [];
            if (isKuduAccessible === false) {
                views.push(new CheckStepView({
                    title: "Kudu is not reachable, diagnostic will be incomplete",
                    level: 1
                }));

                views.push(commonRec.KuduNotAccessible.Get(`https://${diagProvider.scmHostName}`));
            }
            return views;
        })();
        flowMgr.addViews(kuduAvailabilityCheckPromise, "Checking Kudu availability...");
        var permMgr = new ResourcePermissionCheckManager();
        flowMgr.addView(permMgr.checkView);

        var kuduReachablePromise = kuduAvailabilityCheckPromise.then(r => isKuduAccessible);

        var promise = checkVnetIntegrationHealth(siteInfo, diagProvider, kuduReachablePromise, permMgr);
        flowMgr.addViews(promise.then(d => d.views), "Checking VNet integration status...");

        var data = { subnetDataPromise: promise.then(d => d && d.subnetData), serverFarmId: siteInfo["serverFarmId"], kuduReachablePromise, isContinuedPromise: promise.then(d => d.isContinue) };
        checkNetworkConfigAndConnectivity(siteInfo, diagProvider, flowMgr, data, permMgr);
    }
}

async function runConnectivityCheck(hostname, port, dnsServers, diagProvider, lengthLimit) {
    var subChecks = [];
    var fellbackToPublicDns = false;
    var nameResolvePromise = (async function checkNameResolve() {
        var ip = null;
        var subChecks = [];
        if (diagProvider.isIp(hostname)) {
            ip = hostname;
        } else {
            for (var i = 0; i < dnsServers.length; ++i) {
                var result = await diagProvider.nameResolveAsync(hostname, dnsServers[i]).catch(e => {
                    logDebugMessage(e);
                    return {};
                });
                var dns = (dnsServers[i] == "" ? "Azure DNS server" : `DNS server ${dnsServers[i]}`);
                if (result.ip != null) {
                    if (dnsServers[i] == "") {
                        fellbackToPublicDns = true;
                    }
                    ip = result.ip;
                    subChecks.push({ title: `Successfully resolved hostname '${hostname}' with ${dns}`, level: 0 });
                    break;
                } else {
                    subChecks.push({ title: `Failed to resolve hostname '${hostname}' with ${dns}`, level: 1 });
                }
            }
        }
        return { ip, subChecks };
    })();
    var tcpPingPromise = diagProvider.tcpPingAsync(hostname, port).catch(e => {
        logDebugMessage(e);
        return {};
    });

    await Promise.all([nameResolvePromise, tcpPingPromise]);

    var nameResolveResult = await nameResolvePromise;
    var ip = nameResolveResult.ip;
    subChecks = nameResolveResult.subChecks;

    var tcpPingResult = await tcpPingPromise;
    var status = tcpPingResult.status;

    var markdown = null;
    var views = [];
    var resolvedIp = "";
    if (ip != hostname) {
        hostname = hostname.length > lengthLimit ? hostname.substr(0, lengthLimit) + "..." : hostname;
        if (ip == null) {
            markdown = `DNS server cannot resolve the hostname **${hostname}**, possible reasons can be:\r\n` +
                `-  hostname **${hostname}** does not exist, please double check if the hostname is correct\r\n\r\n` +
                (dnsServers.filter(s => s != "").length == 0 ? "" : `-  Your custom DNS server was used for resolving hostname, but there is no DNS entry on the server for **${hostname}**, please check your DNS server.\r\n\r\n`) +
                "-  If your target endpoint is an Azure service with Private Endpoint enabled, please check its Private Endpoint DNS Zone settings.\r\n\r\n"
            views.push(new CheckStepView({
                title: `failed to resolve the IP of ${hostname}`,
                subChecks: subChecks,
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
    var msg = `Connecting to ${hostname}:${port} from your App instance`;
    if (status == 0) {
        markdown = "Connectivity test succeeded at TCP level. " +
            "This means Transportation Layer connection was successfully established between this app and the target endpoint. \r\n\r\n" +
            "If your app is still having runtime connection failures with this endpoint, the possible reasons can be: \r\n\r\n" +
            "-  Service is not available, please check the status of your endpoint server.\r\n\r\n" +
            "-  Endpoint firewall blocks Web App or Function App's IP address, please check the IP restriction or application level firewall.\r\n\r\n" +
            "-  The traffic was blocked by Network Security Group or Firewall, please check your NSG or/and Firewall configuration if there is any.\r\n\r\n" +
            "-  The traffic was routed to a wrong destination, please check your User Defined Route Table if there is any.\r\n\r\n" +
            "-  The endpoint is an Azure Resource in a VNet in a different region. "
        resolvedIp;
        subChecks.push({ title: `TCP ping to ${hostname} was succeeded`, level: 0 });
        views.push(new CheckStepView({
            title: msg + " - OK (TCP level)",
            subChecks: subChecks,
            level: 0
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: markdown
        }));
    } else if (status == 1) {
        markdown = "Connectivity test failed at TCP level. " +
            "This means the endpoint was not reachable in Transportation Layer. Possible reasons can be: \r\n\r\n" +
            "-  The endpoint does not exist, please double check the hostname:port or ip:port was correctly set. \r\n\r\n" +
            "-  The endpoint is not reachable from the VNet, please double check if the endpoint server is correctly configured. \r\n\r\n" +
            "-  There is a TCP level firewall or a Network Security Group Rule blocking the traffic from this app. Please check your firewall or NSG rules if there are any. \r\n\r\n" +
            "-  WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS setting is not supported by this connectivity check yet, if custom DNS server fails to resolve the hostname, the check will fail.\r\n\r\n" +
            resolvedIp;

        subChecks.push({ title: `TCP ping to ${hostname} failed, timeout because target is unreachable`, level: 2 });
        views.push(new CheckStepView({
            title: msg + " - failed, timeout because target is unreachable",
            subChecks: subChecks,
            level: 2
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: markdown
        }));

    } else {
        subChecks.push({ title: `TCP ping to ${hostname} failed, errorcode:${status}`, level: 2 });
        views.push(new CheckStepView({
            title: msg + ` - failed, errorcode:${status}`,
            subChecks: subChecks,
            level: 2
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: "Unknown problem, please send a feedback to let us know."
        }));

    }
    return views;
}

function checkNetworkConfigAndConnectivity(siteInfo, diagProvider, flowMgr, data, permMgr) {
    var subnetDataPromise = data.subnetDataPromise;
    var isContinuedPromise = data.isContinuedPromise;
    var serverFarmId = data.serverFarmId;
    var kuduReachablePromise = data.kuduReachablePromise;
    var kuduReachable = null;
    var dnsServers = [];

    var configCheckViewsPromise = (async function generateConfigCheckViews() {
        var views = [], subChecks = [];
        var level = 0, skipReason = null;
        var titlePostfix = "";
        var configCheckView = new CheckStepView({
            title: "Network Configuration is healthy",
            level: 0
        });
        views.push(configCheckView);
        var subnetSizeCheckPromise = checkSubnetSizeAsync(diagProvider, subnetDataPromise, serverFarmId, permMgr);
        var dnsCheckResultPromise = checkDnsSettingAsync(siteInfo, diagProvider);
        var appSettings = await diagProvider.getAppSettings();
        var vnetRouteAll = (appSettings["WEBSITE_VNET_ROUTE_ALL"] === "1");

        if (vnetRouteAll) {
            subChecks.push({ title: "WEBSITE_VNET_ROUTE_ALL is set to 1, all traffic will be routed to VNet", level: 3 });
        } else {
            subChecks.push({ title: "WEBSITE_VNET_ROUTE_ALL is not set or set to 0, only private network traffic(RFC1918) will be routed to VNet", level: 3 });
        }

        var subnetSizeResult = await subnetSizeCheckPromise;
        if (subnetSizeResult != null) {
            if (subnetSizeResult.checkResult.level == 1) {
                level = 1;
            }
            views = views.concat(subnetSizeResult.views);
            subChecks.push(subnetSizeResult.checkResult);
        }

        kuduReachable = await kuduReachablePromise;
        if (kuduReachable) {
            var dnsCheckResult = await dnsCheckResultPromise;
            dnsServers = dnsCheckResult.dnsServers;
            views = views.concat(dnsCheckResult.views);
            subChecks = subChecks.concat(dnsCheckResult.subChecks);
            if (dnsServers.length === 0) {
                level = 2;
            } else if (dnsCheckResult.level == 1) {
                level = Math.max(level, 1);
            }
        } else {
            subChecks.push({ title: "DNS check was skipped due to having no access to Kudu", level: 3 });
            if (subnetSizeResult != null) {
                titlePostfix = " (incomplete result)";
            } else {
                // no check is done
                skipReason = "Kudu is inaccessible";
                level = 3;
            }
        }

        if (level == 1) {
            configCheckView.title = "Network Configuration is suboptimal";
            configCheckView.level = 1;
        } else if (level == 2) {
            configCheckView.title = "Network Configuration is unhealthy";
            configCheckView.level = 2;
        } else if (level == 3) {
            configCheckView.title = `Network Configuration checks are skipped due to ${skipReason}`;
            configCheckView.level = 3;
        }
        configCheckView.title += titlePostfix;
        configCheckView.subChecks = subChecks;
        return views;
    })();

    flowMgr.addViews(isContinuedPromise.then(c => c ? configCheckViewsPromise : null), "Checking Network Configuration...");

    var state = null;
    var connectivityCheckViewPromise = (async function generateConnectivityCheckViews() {
        var isContinued = await isContinuedPromise;
        await configCheckViewsPromise;
        if (!kuduReachable) {
            return [new CheckStepView({ title: "Connectivity check (tcpping and nameresolver) is not available due to Kudu is inaccessible.", level: 3 })];
        }

        if (dnsServers.length === 0 || !isContinued) {
            return [];
        }

        return [new InputStepView({
            title: "Specify an endpoint you want to test connectivity to",
            placeholder: "hostname:port or ip:port",
            buttonText: "Continue",
            entry: "Endpoint",
            text: "",
            tooltip: "e.g. microsoft.com:443 or 8.8.8.8:53\r\ncommon service ports: http - 80; https - 443; sql server - 1433; dns - 53",
            error: null,
            collapsed: false,
            async callback(userInput) {
                userInput = userInput.trim();
                flowMgr.reset(state);
                flowMgr.logEvent("ConnectivityTestTriggered", {});
                const userInputLimitInUI = 50; // only applies to the UI, will show ... if more than 50 chars
                const userInputLimit = 300;
                var splitted = userInput.split(":");
                var hostname, port;

                if (userInput.length > userInputLimit) {
                    this.error = "invalid endpoint";
                    return;
                }

                if (userInput.startsWith("http")) {
                    port = userInput.startsWith("https") ? 443 : 80;
                    var m = userInput.match(/\/\/(.*?)(\/.*|$)/);
                    hostname = (m == null ? null : m[1]);
                    if (hostname == null) {
                        this.error = "invalid endpoint";
                        return;
                    } else {
                        this.text = `${hostname}:${port}`;
                        userInput = this.text;
                        userInput = userInput.length > userInputLimitInUI ? userInput.substr(0, userInputLimitInUI) + "..." : userInput;
                    }
                } else {
                    if (splitted.length != 2 || isNaN(port = parseInt(splitted[1]))) {
                        this.error = "invalid endpoint";
                        return;
                    } else {
                        this.error = null;
                        hostname = splitted[0];
                        userInput = userInput.length > userInputLimitInUI ? userInput.substr(0, userInputLimitInUI) + "..." : userInput;
                    }
                }
                flowMgr.addViews(runConnectivityCheck(hostname, port, dnsServers, diagProvider, userInputLimitInUI), `Connecting to ${userInput}...`);
                this.collapsed = true;
            }
        })];
    })();
    state = flowMgr.addViews(connectivityCheckViewPromise);
}