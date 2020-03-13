import { Component, OnInit, Injector } from '@angular/core';
import { MessageProcessor } from '../../../supportbot/message-processor.service';
import { ActivatedRoute, Router, NavigationExtras, NavigationEnd, Scroll } from '@angular/router';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { INavProps, INavLink, INav, autobind, INavStyles } from 'office-ui-fabric-react';
import { GenericApiService } from '../../../shared/services/generic-api.service';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Tile } from '../../../shared/components/tile-list/tile-list.component';
import { Feature } from '../../../shared-v2/models/features';
import { AuthService } from '../../../startup/services/auth.service';
import { DiagnosticService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { PortalActionService } from '../../../shared/services/portal-action.service';

@Component({
  selector: 'category-chat-v4',
  templateUrl: './category-chat-v4.component.html',
  styleUrls: ['./category-chat-v4.component.scss']
})
export class CategoryChatV4Component implements OnInit {

  showChoiceGroup: boolean = true;
  currentRoutePath: string[];
  allProblemCategories: Category[] = [];
  features: Feature[];
  tiles: Tile[];

  startingKey: string;

  category: Category;
  categoryName: string;
  resourceId = "";
  baseUrl = "";
  resourceName = "";

  groups: any;
  counter: number = 0;

  initialSelectedKey: INavProps["initialSelectedKey"] = "overview";
  selectedKey: INavProps["initialSelectedKey"];

  styles: any;

  selectedCategoryIndex = "1";
  setCategoryIndex(event: any) {
    const categoryIndex = event.option.key;
    this.selectedCategoryIndex = categoryIndex;
  }
  constructor(protected _diagnosticApiService: DiagnosticService, private _route: Router, private _injector: Injector, private _activatedRoute: ActivatedRoute, private categoryService: CategoryService,
    private _chatState: CategoryChatStateService, private _genericApiService: GenericApiService
    , private _featureService: FeatureService, protected _authService: AuthService, private _portalActionService: PortalActionService) {
  }

  ngOnInit() {
    this.categoryService.categories.subscribe(categories => {
      this.category = categories.find(category => category.id === this._activatedRoute.snapshot.params.category);
      this._chatState.category = this.category;
      this.categoryName = this.category.name;

      this.resourceName = this._activatedRoute.snapshot.params.resourcename;
      this._portalActionService.updateDiagnoseCategoryBladeTitle(`${this.resourceName} - ` + this.categoryName);
    });
  }

  private getCurrentRoutePath() {
    this.currentRoutePath = this._activatedRoute.firstChild.snapshot.url.map(urlSegment => urlSegment.path);
  }

  navigateTo(path: string) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };
    this._route.navigate(path.split('/'), navigationExtras);
    console.log("this._route", this._route);
  }

}
