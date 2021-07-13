import { ResponseMessageEnvelope } from '../../../models/responsemessageenvelope';
import { Site, SiteInfoMetaData } from '../../../models/site';
import { ArmService } from '../../../services/arm.service';
import { SiteService } from '../../../services/site.service';

enum ConnectionCheckStatus { success, timeout, hostNotFound, blocked, refused }
export enum OutboundType { SWIFT, gateway };
export enum InboundType { privateEndpoint, serviceEndpoint }

function delay(second: number): Promise<void> {
    return new Promise(resolve =>
        setTimeout(resolve, second * 1000));
}


export class DiagProvider {
    private _siteInfo: SiteInfoMetaData & Site & { fullSiteName: string };
    private _armService: ArmService;
    private _siteService: SiteService;
    public portalDomain: string;
    public scmHostName: string;
    constructor(siteInfo: SiteInfoMetaData & Site & { fullSiteName: string }, armService: ArmService, siteService: SiteService, portalDomain: string) {
        this._siteInfo = siteInfo;
        this._armService = armService;
        this._siteService = siteService;
        var scmHostNameState = this._siteInfo.hostNameSslStates.filter(h => h.hostType == 1)[0];
        this.scmHostName = scmHostNameState == null ? null : scmHostNameState.name;
        this.portalDomain = portalDomain;
        armService.clearCache();
    }

    public async getVNetIntegrationStatusAsync() {
        var result = { isVnetIntegrated: false, outboundType: <OutboundType>null, outboundSubnets: [], inboundType: <InboundType>null, inboundSubnets: [], siteVnetInfo: null };
        var siteArmId = this._siteInfo["id"];
        var siteVnetInfo = await this.getWebAppVnetInfo();
        result.siteVnetInfo = siteVnetInfo;
        if (siteVnetInfo != null) {
            var subnetResourceId = siteVnetInfo.properties["subnetResourceId"];
            if (subnetResourceId != null) {
                result.isVnetIntegrated = true;
                result.outboundType = OutboundType.SWIFT;
            } else {
                var siteGWVnetInfo = await this.getArmResourceAsync(siteArmId + "/virtualNetworkConnections");

                if (siteGWVnetInfo.length > 0) {
                    result.isVnetIntegrated = true;
                    result.outboundType = OutboundType.gateway;
                }
            }
        }
        return result;
    }

    public getArmResourceAsync(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Promise<any> {
        var stack = new Error("replace_placeholder").stack;
        return this._armService.getArmResource<any>(resourceUri, apiVersion, invalidateCache)
            .toPromise()
            .then(t => {
                t.status = 200;
                return t;
            })
            .catch(e => {
                var err = new Error(e);
                err.stack = stack.replace("replace_placeholder", e);
                console.log(err);

                var result = { message: e, status: 0 };
                if (e.startsWith("Code:AuthorizationFailed")) {
                    result.status = 401;
                    return result;
                } else if (e.startsWith("Code:ResourceNotFound") || e.includes("not found")) {
                    result.status = 404;
                    return result;
                }
                else {
                    result.status = -1;
                    return result;
                }
            });
    }

    public postResourceAsync<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false, appendBodyToCacheKey: boolean = false): Promise<boolean | {} | ResponseMessageEnvelope<T>> {
        return this.postArmResourceAsync(resourceUri, body, apiVersion, invalidateCache, appendBodyToCacheKey);
    }

    public postArmResourceAsync<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false, appendBodyToCacheKey: boolean = false): Promise<boolean | {} | ResponseMessageEnvelope<T>> {
        var stack = new Error("replace_placeholder").stack;
        return this._armService.postResource<T, S>(resourceUri, body, apiVersion, invalidateCache, appendBodyToCacheKey)
            .toPromise()
            .catch(e => {
                var err = new Error(e);
                err.stack = stack.replace("replace_placeholder", e);
                throw err;
            });
    }

    public getKuduApiAsync<T>(uri: string, instance?: string, timeoutInSec: number = 15, scm = false): Promise<T> {
        var stack = new Error("replace_placeholder").stack;
        var params = [instance == null ? null : `instance=${instance}`, scm ? null : "api-version=2015-08-01"].filter(s => s!=null).join("&");
        var postfix = (params == "" ? "" : `?${params}`);
        var prefix = scm ? this.scmHostName : `management.azure.com/${this._siteInfo.resourceUri}/extensions`;
        return this._armService.get<T>(`https://${prefix}/api/${uri}${postfix}`)
            .toPromise()
            .catch(e => {
                var err = new Error(e);
                err.stack = stack.replace("replace_placeholder", e);
                throw err;
            });
    }

    public postKuduApiAsync<T, S>(uri: string, body?: S, instance?: string, timeoutInSec: number = 15, scm = false): Promise<boolean | {} | ResponseMessageEnvelope<T>> {
        var params = [instance == null ? null : `instance=${instance}`, scm ? null : "api-version=2015-08-01"].filter(s => s!=null).join("&");
        var postfix = (params == "" ? "" : `?${params}`);
        var prefix = scm ? this.scmHostName : `management.azure.com/${this._siteInfo.resourceUri}/extensions`;
        var stack = new Error("replace_placeholder").stack;
        var promise = this._armService.post<T, S>(`https://${prefix}/api/${uri}${postfix}`, body)
            .toPromise()
            .catch(e => {
                var err = new Error(e);
                err.stack = stack.replace("replace_placeholder", e);
                throw err;
            });
        var timeoutPromise = delay(timeoutInSec).then(() => {
            throw new Error(`postKuduApiAsync timeout after ${timeoutInSec}s`);
        });
        return Promise.race([promise, timeoutPromise]);
    }

    public async runKuduCommand(command: string, dir?: string, instance?: string, timeoutInSec?: number): Promise<any> {
        var result: any = await this.postKuduApiAsync("command", { "command": command, "dir": dir }, instance, timeoutInSec);
        return result.Output.slice(0, -2);
    }

    public getEnvironmentVariablesAsync(names: string[], instance?: string) {
        var stack = new Error("replace_placeholder").stack;
        var promise = (async () => {
            names = names.map(n => `%${n}%`);
            var echoPromise = this.runKuduCommand(`echo ${names.join(";")}`, undefined, instance).catch(e => {
                console.log("getEnvironmentVariables failed", e);
                e.message = "getEnvironmentVariablesAsync failed:" + e.message;
                throw e;
            });
            var result = await echoPromise;
            result = result.split(";").map((r, i) => r == names[i] ? null : r);
            return result;
        })();

        return promise.catch(e => {
            var err = new Error(e);
            err.stack = stack.replace("replace_placeholder", e.message || e);
            throw err;
        });
    }

    public async tcpPingAsync(hostname: string, port: number, count: number = 1, timeout: number = 10, instance?: string): Promise<{ status: ConnectionCheckStatus, statuses: ConnectionCheckStatus[] }> {
        var stack = new Error("replace_placeholder").stack;
        var promise = (async () => {
            var pingPromise = this.runKuduCommand(`tcpping -n ${count} -w ${timeout} ${hostname}:${port}`, undefined, instance).catch(e => {
                console.log("tcpping failed", e);
                return null;
            });
            var pingResult = await pingPromise;

            var statuses: ConnectionCheckStatus[] = [];
            if (pingResult != null) {
                var splited = pingResult.split("\r\n");
                for (var i in splited) {
                    var line = splited[i];
                    if (line.startsWith("Connected to ")) {
                        statuses.push(ConnectionCheckStatus.success);
                    } else if (line.includes("No such host is known")) {
                        statuses.push(ConnectionCheckStatus.hostNotFound);
                    } else if (line.includes("Connection timed out")) {
                        statuses.push(ConnectionCheckStatus.timeout);
                    } else if (line.startsWith("Connection attempt failed: An attempt was made to access a socket")) {
                        statuses.push(ConnectionCheckStatus.blocked);
                    } else if (line.startsWith("Complete")) {
                        break;
                    } else {
                        throw new Error(`checkConnectionAsync: unknown status ${pingResult}`);
                    }
                }
            }
            var status: ConnectionCheckStatus = statuses.some(s => s == ConnectionCheckStatus.success) ? ConnectionCheckStatus.success : statuses[0];
            return { status, statuses };
        })();

        return promise.catch(e => {
            var err = new Error(e);
            err.stack = stack.replace("replace_placeholder", e.message || e);
            throw err;
        });
    }

    public async nameResolveAsync(hostname: string, dns: string, instance?: string): Promise<{ ip: string, aliases: string }> {
        var ip: string = null, aliases: string = null;
        if (this.isIp(hostname)) {
            ip = hostname;
        } else {
            try {
                var result = await this.runKuduCommand(`nameresolver ${hostname} ${dns}`, undefined, instance);
                if (result != null) {
                    if (result.includes("Aliases")) {
                        var match = result.match(/Addresses:\s*([\S\s]*)Aliases:\s*([\S\s]*)$/);
                        if (match != null) {
                            ip = match[1].split("\r\n").filter(i => i.length > 0).join(";");
                            aliases = match[2].split("\r\n").filter(i => i.length > 0).join(";");
                        }
                    } else {
                        var match = result.match(/Addresses:\s*([\S\s]*)$/);
                        if (match != null) {
                            ip = match[1].split("\r\n").filter(i => i.length > 0).join(";");
                        }
                    }
                }
            } catch (e) {

            }
        }
        return { ip, aliases };
    }

    public async checkConnectionAsync(hostname: string, port: number, count?: number, timeout?: number, dns: string = "", instance?: string): Promise<{ status: ConnectionCheckStatus, ip: string, aliases: string, statuses: ConnectionCheckStatus[] }> {
        var stack = new Error("replace_placeholder").stack;
        var promise = (async () => {
            var nameResolverPromise = this.nameResolveAsync(hostname, dns, instance);

            var pingPromise = this.tcpPingAsync(hostname, port, count, timeout, instance);
            await Promise.all([nameResolverPromise.catch(e => e), pingPromise.catch(e => e)]);
            var nameResovlerResult = await nameResolverPromise;
            var pingResult = await (pingPromise.catch(e => null));
            console.log(nameResovlerResult, pingResult);


            var connectionStatus: ConnectionCheckStatus;
            if (nameResovlerResult.ip == null) {
                connectionStatus = ConnectionCheckStatus.hostNotFound;
            } else {
                connectionStatus = (pingResult && pingResult.status);
            }
            return { status: connectionStatus, ip: nameResovlerResult.ip, aliases: nameResovlerResult.aliases, statuses: pingResult && pingResult.statuses };
        })();

        return promise.catch(e => {
            var err = new Error(e);
            err.stack = stack.replace("replace_placeholder", e.message || e);
            throw err;
        });
    }

    public async checkKuduReachable(timeoutInSec: number): Promise<boolean> {
        try {
            var result = await this.runKuduCommand("echo ok", undefined, undefined, timeoutInSec);
            return result == "ok";
        } catch (error) {
            return false;
        }
    }

    public async getWebAppVnetInfo(): Promise<any> {
        //This is the regional VNet Integration endpoint
        var swiftUrl = this._siteInfo["id"] + "/config/virtualNetwork";
        var siteVnetInfo = await this.getArmResourceAsync(swiftUrl, "2018-02-01");
        return siteVnetInfo;
    }

    public isIp(s: string) {
        if (s.match(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/)) {
            // ipv4
            return true;
        } else if (s.match(/^(?:[a-fA-F0-9]{1,4}:){7}[a-fA-F0-9]{1,4}$/)) {
            // ipv6
            return true;
        }
        return false;
    }

    public async getAppSettings(): Promise<any> {
        var siteInfo = this._siteInfo;
        return (await this._siteService.getSiteAppSettings(siteInfo.subscriptionId, siteInfo.resourceGroupName, siteInfo.siteName, siteInfo.slot).toPromise()).properties
    }
}
