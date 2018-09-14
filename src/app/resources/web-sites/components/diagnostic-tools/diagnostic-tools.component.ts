import { OnInit, Component } from "@angular/core";
import { SiteFilteredItem } from "../../models/site-filter";
import { Tile } from "../../../../shared/components/tile-list/tile-list.component";
import { SiteFeatureService } from "../../services/site-feature.service";
import { WebSitesService } from "../../../../shared-v2/services/web-sites.service";


@Component({
  selector: 'diagnostic-tools',
  templateUrl: './diagnostic-tools.component.html',
  styleUrls: ['./diagnostic-tools.component.css']
})
export class DiagnosticToolsComponent implements OnInit {

  diagnosticToolTiles: SiteFilteredItem<Tile>[];
  supportToolTiles: SiteFilteredItem<Tile>[];

  stackFound: boolean = false;
  stack: string;

  possibleStacks: string[] = [
    "ASP.NET",
    "ASP.NET Core",
    "Java",
    "PHP"
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
      this.stack = this.possibleStacks.find(st => st.toLowerCase() === this.webSiteService.appStack);
    }
  }

  ngOnInit() {
  }

}
