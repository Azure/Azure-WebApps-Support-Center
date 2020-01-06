import { Injectable } from '@angular/core';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { OperatingSystem, Site, HostingEnvironmentKind } from '../../../shared/models/site';
import { AppType } from '../../../shared/models/portal';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { ArmService } from '../../../shared/services/arm.service';
import { Sku } from '../../../shared/models/server-farm';
import { IDiagnosticProperties } from '../../../shared/models/diagnosticproperties';
import { Observable, BehaviorSubject } from 'rxjs';
import { flatMap } from 'rxjs/operators';
import { PortalReferrerMap } from '../../../shared/models/portal-referrer-map';
import { DetectorType } from 'diagnostic-data';

@Injectable()
export class WebSitesService extends ResourceService {

    private _resourceGroup: string;
    private _siteName: string;
    private _slotName: string;

    public appStack: string = '';
    public platform: OperatingSystem = OperatingSystem.any;
    public appType: AppType = AppType.WebApp;
    public sku: Sku = Sku.All;
    public hostingEnvironmentKind: HostingEnvironmentKind = HostingEnvironmentKind.All;

    constructor(protected _armService: ArmService, private _appAnalysisService: AppAnalysisService) {
        super(_armService);
    }

    public getIbizaBladeToDetectorMapings():Observable<PortalReferrerMap[]> {
        return this.warmUpCallFinished.pipe(flatMap( ()=>{
            let bladeToDetectorMap:PortalReferrerMap[]; 
            
            bladeToDetectorMap = [{
                ReferrerExtensionName: 'Websites',
                ReferrerBladeName: 'CertificatesBlade',
                ReferrerTabName: 'Bindings',
                DetectorType: DetectorType.Detector,
                DetectorId: 'configuringsslandcustomdomains'
            },
            {
                ReferrerExtensionName: 'Websites',
                ReferrerBladeName: 'CustomDomainsAndSSL',
                ReferrerTabName: '',
                DetectorType: DetectorType.Detector,
                DetectorId: 'configuringsslandcustomdomains'
            }];
            

            if(this.appType == AppType.WebApp) {
                bladeToDetectorMap.push({
                    ReferrerExtensionName: 'Websites',
                    ReferrerBladeName: 'BackupSummaryBlade',
                    ReferrerTabName: '',
                    DetectorType: DetectorType.Detector,
                    DetectorId: 'backupFailures'
                });
            }
            return Observable.of(bladeToDetectorMap);            
        }  ));
    }

    public getPesId(): Observable<string> {
        return this.warmUpCallFinished.pipe(flatMap(() => {
            if (this.appType == AppType.WebApp && this.platform == OperatingSystem.windows){
                return Observable.of("14748");
            }
            else if (this.appType == AppType.WebApp && this.platform == OperatingSystem.linux){
                return Observable.of("16170");
            }
            else if (this.appType == AppType.FunctionApp){
                return Observable.of("16072");
            }
            else{
                return Observable.of(null);
            }
        }));
    }

    public get searchSuffix(): string {
        return this.appType === AppType.WebApp ? this.platform === OperatingSystem.windows ? 'Azure Web App' : 'Azure Web App(Linux)' : 'Azure Function';
    }

    public get azureServiceName(): string {
        return this.appType === AppType.WebApp ? this.platform === OperatingSystem.windows ? 'Web App (Windows)' : 'Web App (Linux)' : 'Function App';
    }

    public get isApplicableForLiveChat(): boolean {
        return this.resource
            && (this.sku & Sku.Paid) > 0
            && (this.appType & AppType.WebApp) > 0
            && (this.platform & (OperatingSystem.windows | OperatingSystem.linux)) > 0;
    }

    public getSitePremierAddOns(resourceUri: string): Observable<any> {
        return this._armService.getArmResource(`${resourceUri}/premieraddons`, '2018-02-01');
    }

    protected makeWarmUpCalls() {
        super.makeWarmUpCalls();
        this._populateSiteInfo();
        this.warmUpCallFinished.next(true);
    }

    private _populateSiteInfo(): void {
        const pieces = this.resource.id.toLowerCase().split('/');
        this._subscription = pieces[pieces.indexOf('subscriptions') + 1];
        this._resourceGroup = pieces[pieces.indexOf('resourcegroups') + 1];
        this._siteName = pieces[pieces.indexOf('sites') + 1];
        this._slotName = pieces.indexOf('slots') >= 0 ? pieces[pieces.indexOf('slots') + 1] : '';

        const site: Site = <Site>this.resource.properties;

        this._appAnalysisService.getDiagnosticProperties(this._subscription, this._resourceGroup, this._siteName, this._slotName).subscribe((data: IDiagnosticProperties) => {
            this.appStack = data && data.appStack && data.appStack != '' ? data.appStack : '';
        });

        this.appType = site.kind.toLowerCase().indexOf('functionapp') >= 0 ? AppType.FunctionApp : AppType.WebApp;
        this.platform = site.kind.toLowerCase().indexOf('linux') >= 0 ? OperatingSystem.linux : OperatingSystem.windows;
        this.sku = Sku[site.sku];
        this.hostingEnvironmentKind = this.getHostingEnvirontmentKind(site);
    }

    private getHostingEnvirontmentKind(site: Site) {
        let scmHostName = site.enabledHostNames.find(h => h.indexOf('.scm.') > 0);
        return site.hostingEnvironmentId == null ? HostingEnvironmentKind.None : (scmHostName.toLowerCase().endsWith(".azurewebsites.net") ? HostingEnvironmentKind.Public : HostingEnvironmentKind.ILB);
    }
}
