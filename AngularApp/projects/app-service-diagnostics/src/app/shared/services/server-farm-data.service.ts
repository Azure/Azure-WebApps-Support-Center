import { BehaviorSubject } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { AuthService } from '../../startup/services/auth.service';
import { ResourceType, StartupInfo } from '../models/portal';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { ServerFarm } from '../models/server-farm';
import { Site } from '../models/site';
import { ArmService } from './arm.service';
import { RBACService } from './rbac.service';
import { UriElementsService } from './urielements.service';

@Injectable()
export class ServerFarmDataService {
    private siteResourceId: string;

    public siteServerFarm: BehaviorSubject<ServerFarm> = new BehaviorSubject(null);
    public hasServerFarmAccess: BehaviorSubject<boolean> = new BehaviorSubject(null);
    public sitesInServerFarm: BehaviorSubject<Site[]> = new BehaviorSubject(null);

    private currentSite: Site;
    public hasReadAccessToServerFarm: boolean;

    private serverFarmBehaviorSubject: BehaviorSubject<ServerFarm> = new BehaviorSubject<ServerFarm>(null);

    constructor(private _armService: ArmService, private _uriElementsService: UriElementsService, private _authService: AuthService,
        private _rbacService: RBACService) {
        this._authService.getStartupInfo()
            .subscribe((startUpInfo: StartupInfo) => {
                if (!startUpInfo) { return; }
                this.siteResourceId = startUpInfo.resourceId;
                if (startUpInfo.resourceType === ResourceType.Site) {
                    return this._armService.getResource<Site>(this.siteResourceId).pipe(
                        mergeMap((site: ResponseMessageEnvelope<Site>) => {
                            this.currentSite = site.properties;
                            return this._rbacService.hasPermission(this.currentSite.serverFarmId, [this._rbacService.readScope]);
                        }),
                        mergeMap((hasPermission: boolean) => {
                            this.hasServerFarmAccess.next(hasPermission);
                            return this._armService.getResourceWithoutEnvelope<ServerFarm>(this.currentSite.serverFarmId);
                        }),
                        mergeMap((serverFarm: ServerFarm) => {
                            serverFarm = this.addAdditionalProperties(serverFarm);
                            this.siteServerFarm.next(serverFarm);
                            return this._armService.getResourceCollection<Site>(serverFarm.id + '/sites');
                        }))
                    .subscribe((sites: ResponseMessageEnvelope<Site>[]) => {
                        this.sitesInServerFarm.next(sites.map(env => env.properties));
                    });
                }
            });
    }

    public getSiteServerFarm() {
        return this.serverFarmBehaviorSubject;
    }

    private addAdditionalProperties(serverFarm: ServerFarm): ServerFarm {
        if (serverFarm) {
            const sizeId = serverFarm.sku.name.replace(serverFarm.sku.family, '');
            switch (sizeId) {
                case '1':
                    serverFarm.additionalProperties = {
                        cores: 1,
                        ramInGB: 1.75
                    };
                    break;
                case '2':
                    serverFarm.additionalProperties = {
                        cores: 2,
                        ramInGB: 3.5
                    };
                    break;
                case '3':
                    serverFarm.additionalProperties = {
                        cores: 4,
                        ramInGB: 7
                    };
                    break;
            }

            if (serverFarm.sku.family.toLowerCase() === 'p1') {
                serverFarm.additionalProperties.cores *= 2;
                serverFarm.additionalProperties.ramInGB *= 2;
            }
        }

        return serverFarm;
    }
}
