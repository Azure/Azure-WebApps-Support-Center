import { Component } from "@angular/core";
import { SiteFilteredItem } from "../../models/site-filter";
import { Tile } from "../../../../shared/components/tile-list/tile-list.component";
import { SiteFeatureService } from "../../services/site-feature.service";
import { WebSitesService } from "../../services/web-sites.service";


@Component({
  selector: 'diagnostic-tools',
  templateUrl: './diagnostic-tools.component.html',
  styleUrls: ['./diagnostic-tools.component.css']
})
export class DiagnosticToolsComponent {

  diagnosticToolTiles: SiteFilteredItem<Tile>[];
  supportToolTiles: SiteFilteredItem<Tile>[];

  stackFound: boolean = false;
  stack: string;

  possibleStacks: string[] = [
    "ASP.NET",
    "ASP.NET Core",
    "Java",
    "PHP",
    "All"
  ]

  constructor(private _sitesFeatureService: SiteFeatureService, public webSiteService: WebSitesService) { 
    this.diagnosticToolTiles = this._sitesFeatureService.diagnosticTools.map(tool => {
      return <SiteFilteredItem<Tile>>{
        appType: tool.appType,
        platform: tool.platform,
        sku: tool.sku,
        stack: tool.stack,
        item: {
          title: tool.item.name,
          backgroundColor: 'rgb(89, 180, 217)',
          action: tool.item.clickAction
        }
      }
    });

    this.supportToolTiles = this._sitesFeatureService.supportTools.map(tool => {
      return <SiteFilteredItem<Tile>>{
        appType: tool.appType,
        platform: tool.platform,
        sku: tool.sku,
        stack: tool.stack,
        item: {
          title: tool.item.name,
          backgroundColor: 'rgb(127, 186, 0)',
          action: tool.item.clickAction
        }
      }
    });

    if (this.webSiteService.appStack && this.webSiteService.appStack != "") {
      this.stackFound = true;
      this.selectStack(this.webSiteService.appStack)
    }
  }

  selectStack(stack: string) {
    this.stack = this.possibleStacks.find(st => st.toLowerCase() === stack.toLowerCase());
    if(!stack) {
      this.stack = "All";
    }
  }
}
