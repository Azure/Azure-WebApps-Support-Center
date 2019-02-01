import { Component } from '@angular/core';
import { SiteFilteredItem } from '../../models/site-filter';
import { Tile } from '../../../../shared/components/tile-list/tile-list.component';
import { SiteFeatureService } from '../../services/site-feature.service';
import { WebSitesService } from '../../services/web-sites.service';
import { SiteService } from '../../../../shared/services/site.service';
import { SiteDaasInfo } from '../../../../shared/models/solution-metadata';
import { AppType } from '../../../../shared/models/portal';
import { OperatingSystem } from '../../../../shared/models/site';
import { Sku } from '../../../../shared/models/server-farm';


@Component({
  selector: 'diagnostic-tools',
  templateUrl: './diagnostic-tools.component.html',
  styleUrls: ['./diagnostic-tools.component.scss']
})
export class DiagnosticToolsComponent {

  toolCategories: SiteFilteredItem<any>[] = [];

  stackFound: boolean = false;
  stack: string;

  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;

  possibleStacks: string[] = [
    'ASP.NET',
    'ASP.NET Core',
    'Java',
    'PHP',
    'All'
  ];

  constructor(private _sitesFeatureService: SiteFeatureService, public webSiteService: WebSitesService, private _siteService: SiteService) {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
    });

    this.scmPath = this.webSiteService.resource.properties.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);

    this.toolCategories.push(<SiteFilteredItem<any>>{
      appType: AppType.WebApp | AppType.FunctionApp,
      platform: OperatingSystem.windows,
      sku: Sku.NotDynamic,
      stack: '',
      item: {
        title: 'Diagnostic Tools',
        tools: this._sitesFeatureService.diagnosticTools.map(tool => {
          return <SiteFilteredItem<Tile>>{
            appType: tool.appType,
            platform: tool.platform,
            sku: tool.sku,
            stack: tool.stack,
            item: {
              title: tool.item.name,
              action: tool.item.clickAction
            }
          };
        })
      }
    });

    this.toolCategories.push(<SiteFilteredItem<any>>{
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      sku: Sku.NotDynamic,
      stack: '',
      item: {
        title: 'Support Tools',
        tools: this._sitesFeatureService.supportTools.map(tool => {
          return <SiteFilteredItem<Tile>>{
            appType: tool.appType,
            platform: tool.platform,
            sku: tool.sku,
            stack: tool.stack,
            item: {
              title: tool.item.name,
              action: tool.item.clickAction
            }
          };
        })
      }
    });

    this.toolCategories.push(<SiteFilteredItem<any>>{
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      sku: Sku.NotDynamic,
      stack: '',
      item: {
        title: 'Proactive Tools',
        tools: this._sitesFeatureService.proactiveTools.map(tool => {
          return <SiteFilteredItem<Tile>>{
            appType: tool.appType,
            platform: tool.platform,
            sku: tool.sku,
            stack: tool.stack,
            item: {
              title: tool.item.name,
              action: tool.item.clickAction
            }
          };
        })
      }
    });

    this.toolCategories.push(<SiteFilteredItem<any>>{
      appType: AppType.WebApp,
      platform: OperatingSystem.windows,
      sku: Sku.NotDynamic,
      stack: '',
      item: {
        title: 'Premium Tools',
        tools: this._sitesFeatureService.premiumTools.map(tool => {
          return <SiteFilteredItem<Tile>>{
            appType: tool.appType,
            platform: tool.platform,
            sku: tool.sku,
            stack: tool.stack,
            item: {
              title: tool.item.name,
              action: tool.item.clickAction
            }
          };
        })
      }
    });

    if (this.webSiteService.appStack && this.webSiteService.appStack != '') {
      this.selectStack(this.webSiteService.appStack);
    }
  }

  selectStack(stack: string) {
    this.stack = this.possibleStacks.find(st => st.toLowerCase() === stack.toLowerCase());

    if (!stack) {
      this.stackFound = false;
      this.stack = 'All';
    } else {
      this.stackFound = true;
    }
  }
}
