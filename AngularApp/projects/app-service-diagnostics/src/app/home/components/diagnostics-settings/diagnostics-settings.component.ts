import { Component, OnInit } from '@angular/core';
import { ArmService} from './../../../shared/services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { FeatureRegistration, ProviderRegistration} from '../../../shared/models/feature-registration';
import { Subscription, interval } from 'rxjs';
import { ArmResource } from '../../../shared-v2/models/arm';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { P } from '@angular/core/src/render3';
@Component({
  selector: 'diagnostics-settings',
  templateUrl: './diagnostics-settings.component.html',
  styleUrls: ['./diagnostics-settings.component.scss']
})
export class DiagnosticsSettingsComponent implements OnInit {
  subscriptionId: string;
  featureRegistrationState: FeatureRegistration;
  providerRegistrationState: ProviderRegistration;
  codeScanState: boolean = false;
  isFeatureRegistered: boolean = false;
  isProviderRegistered: boolean = false;
  alwaysOnState: boolean = false;
  subscription: Subscription;
  featureRegUrl: string = '';
  providerRegUrl: string = '';
  resourceId: string = '';
  changeAnalyisisEnabled: boolean;
  alwaysOnEnabled: boolean = false;
  updatingProvider: boolean = false;
  updatingTag: boolean = false;
  codeScanEnabled: boolean = false;
  currentResource: ArmResource;
  siteConfig: any;
  constructor(private armService: ArmService, private authService: AuthService,
     private activatedRoute: ActivatedRoute, private resourceService: ResourceService) { }

  ngOnInit() {
    this.subscriptionId = this.activatedRoute.snapshot.params['subscriptionid'];
    this.authService.getStartupInfo().subscribe(data => {
        this.resourceId = data.resourceId;
    });
    this.featureRegUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.Features/providers/Microsoft.ChangeAnalysis/features/PreviewAccess`;
    this.providerRegUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis`;
    this.checkIfFeatureRegister();
    this.currentResource = this.resourceService.resource;
  }

   checkIfFeatureRegister(): void {
    this.armService.getResource<any>(this.featureRegUrl, '2015-12-01', true).subscribe(response => {
        this.featureRegistrationState = <FeatureRegistration>response;
        if(this.featureRegistrationState.properties.state == 'NotRegistered') {
            // show in progres text and disable enabling
            this.isFeatureRegistered = false;
            // start polling until registered
            this.subscription = interval(20000).subscribe(res => {
                this.pollForFeatureRegStatus();
            });
        } else {
            // Once feature is registered, check if Provider is registered
            this.isFeatureRegistered = true;
            this.checkIfProviderRegistered();
            this.checkIfCodeScanEnabled();
            this.getSiteConfig();
        }
    }, (error: any) => {
        this.isFeatureRegistered = false;
    });
   }

   checkIfProviderRegistered(): void {
       this.armService.getResource<any>(this.providerRegUrl, '2018-05-01', true).subscribe(response => {
           this.providerRegistrationState = <ProviderRegistration>response;
           if (this.providerRegistrationState.registrationState == 'Registered') {
               this.changeAnalyisisEnabled = true;
               this.isProviderRegistered = true;
           }
       }, (error: any) => {
           this.changeAnalyisisEnabled = false;
           this.isProviderRegistered = true;
       })
   }

   checkIfCodeScanEnabled(): void {
       let tags = this.currentResource.tags;
       if(tags && tags['hidden-related:diagnostics/changeAnalysisScanEnabled']) {
           this.codeScanState = tags['hidden-related:diagnostics/changeAnalysisScanEnabled'] == 'true' ? true : false;
       } else {
           this.codeScanState = false;
           this.codeScanEnabled = false;
       }
   }

   getSiteConfig(): void {
       let url = this.resourceId + '/config/web';
       this.armService.getResource(url, '2016-08-01', true).subscribe(data =>{
           this.siteConfig = data;
           this.alwaysOnState = this.siteConfig.properties['alwaysOn'];
       });
   }


   pollForFeatureRegStatus(): void {
    this.armService.getResource<any>(this.featureRegUrl, '2015-12-01', true).subscribe(response => {
        this.featureRegistrationState = <FeatureRegistration>response;
        // Stop polling once its registered
        if(this.featureRegistrationState.properties.state == 'Registered') {
            this.isFeatureRegistered = true;
            if(this.subscription) {
                this.subscription.unsubscribe();
            }
        }
    }, (error: any) => {
        if(this.subscription) {
            this.subscription.unsubscribe();
        }
    });
   }


   setChangeAnalysisEnabled(val: any): void {
        if(val == '1') {
            this.changeAnalyisisEnabled = true;
        } else {
            this.changeAnalyisisEnabled = false;
        }
   }


   setCodeScanEnabled(val: any): void {
       if (val == '1') {
           this.codeScanEnabled = true;
       } else {
           this.codeScanEnabled = false;
       }
   }

   setAlwaysOnEnabled(val: any): void {
        if (val == '1') {
            this.alwaysOnEnabled = true;
        } else {
            this.alwaysOnEnabled = false;
        }
   }

   updateScanTag(isEnabled: boolean): void {
       this.updatingTag = true;
        let tagValue = isEnabled ? 'true' : 'false';
        if(this.currentResource.tags) {
            this.currentResource.tags['hidden-related:diagnostics/changeAnalysisScanEnabled'] = tagValue;
        } else {
            this.currentResource.tags = {
                "hidden-related:diagnostics/changeAnalysisScanEnabled": tagValue
            };
        }
        let body = this.currentResource;
       this.armService.patchResource(this.currentResource.id, body).subscribe((response:any) => {
        if( response && response.tags ) {
            let tags = response.tags;
            let scanTagName = `hidden-related:diagnostics/changeAnalysisScanEnabled`;
            if(tags[scanTagName] == 'true') {
                this.codeScanState = true;
            } else {
                this.codeScanState = false;
            }
        }
        this.updatingTag = false;
    }, (error: any) => {
        this.updatingTag = false;
        this.codeScanState = false;
    });
   }

   updateAlwaysOn(isEnabled: boolean = true):void {
       let url = this.resourceId + '/config/web';
       this.siteConfig.properties['alwaysOn'] = isEnabled;
       this.armService.putResource(url, this.siteConfig, '2016-08-01').subscribe(data =>{
        this.siteConfig = data;
        this.alwaysOnState = this.siteConfig.properties['alwaysOn'];
        });
   }

   updateProviderRegister(isRegister: boolean): void {
       this.updatingProvider = true;
        let url = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis/`;
        url += isRegister ? `register` : `unregister`;
        this.armService.postResource(url, {}, '2018-05-01', true).subscribe((response: any) => {
            this.providerRegistrationState = <ProviderRegistration>response;
            if (this.providerRegistrationState.registrationState == 'Registered') {
                this.changeAnalyisisEnabled = true;
                this.isProviderRegistered = true;
            }
            this.updatingProvider = false;
        }, (error: any) => {
            this.isProviderRegistered = false;
            this.changeAnalyisisEnabled = false;
            this.updatingProvider = false;
        });
   }

   saveSettings(): void {
       // Register the Resource Provider
       this.updateProviderRegister(this.changeAnalyisisEnabled);
        // Update hidden tag
       this.updateScanTag(this.codeScanEnabled);
       // Update always on
       this.updateAlwaysOn(this.alwaysOnEnabled);
   }

   ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
