import { Component, OnInit } from '@angular/core';
import { SiteService } from '../../services/site.service';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { Category, Subcategory } from '../../models/problem-category';
import { OperatingSystem } from '../../models/site';
import { AppType, StartupInfo } from '../../models/portal';
import { AuthService } from '../../services/auth.service';
import { CategoriesService } from '../../services/categories.service';
import { IDiagnosticProperties } from '../../models/diagnosticproperties';
import { AppAnalysisService } from '../../services/appanalysis.service';

@Component({
  selector: 'daas-main',
  providers: [CategoriesService],
  templateUrl: './daas-main.component.html',
  styleUrls: ['./daas-main.component.css']
})
export class DaasMainComponent implements OnInit {

  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string = "";
  toolCategory: Category;
  AppStack: string = "";
  platform: OperatingSystem = OperatingSystem.any;
  appType: AppType;
  sku: string;
  showToolsDropdown: boolean = false;
  operatingSystem:any = OperatingSystem; 
  checkingSupportedTier:boolean = true;
  supportedTier:boolean = false;

  constructor(private _siteService: SiteService, private _logger: AvailabilityLoggingService,
    private _categoryService: CategoriesService,
    private _appAnalysisService: AppAnalysisService, private _authService: AuthService) {
  }

  onStackChanged(stack: string) {
    this.AppStack = stack;
    this.showToolsDropdown = false;
  }

  ngOnInit(): void {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });

    this._siteService.currentSite.subscribe(site => {
      if (site) {
        this.appType = site.appType;
        this.sku = site.sku;

        this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
          this.checkingSupportedTier = false;
          let resourceUriParts = this._siteService.parseResourceUri(startupInfo.resourceId);
          this._appAnalysisService.getDiagnosticProperties(resourceUriParts.subscriptionId, resourceUriParts.resourceGroup, resourceUriParts.siteName, resourceUriParts.slotName).subscribe((data: IDiagnosticProperties) => {
            this.AppStack = data && data.appStack && data.appStack != "" ? data.appStack : "ASP.Net";
            this.platform = data && data.isLinux ? OperatingSystem.linux : OperatingSystem.windows;
            this._categoryService.Categories.subscribe(categories => {
              let toolsCategories = categories.filter(x => x.Name === "Diagnostic Tools");
              if (toolsCategories.length > 0 && (this.sku === "Standard" || this.sku.indexOf("Premium") > -1 || this.sku === "Isolated")){
                this.supportedTier = true;
                this.toolCategory= toolsCategories[0];
              }
            });
          });
        });
      }
    });

    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }

  getRoute(route: string): string {
    return "../../" + route;
  }
}