import { Component, OnInit } from '@angular/core';
import { INavigationItem } from '../../models/inavigationitem';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CustomReuseStrategy } from '../../../app-route-reusestrategy.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {

  public navigationItems: INavigationItem[];
  public contentMaxHeight: number;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _routeReuseStrategy: CustomReuseStrategy) {
    this.navigationItems = [];
    this.contentMaxHeight = window.innerHeight - 55;
  }

  ngOnInit() {
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {

      const navigationTitleStr: string = 'navigationTitle';
      let currentRoute = this._activatedRoute.root;
      while (currentRoute.children[0] !== undefined) {
        currentRoute = currentRoute.children[0];
      }

      if (currentRoute.snapshot.data.hasOwnProperty(navigationTitleStr)) {

        let navigationTitle = currentRoute.snapshot.data[navigationTitleStr];

        if (navigationTitle.indexOf(':') >= 0) {
          const parameterName = navigationTitle.replace(':', '');
          if (currentRoute.snapshot.params.hasOwnProperty(parameterName)) {
            navigationTitle = currentRoute.snapshot.params[parameterName];
          }
        }

        const url = this._router.url.split('?')[0];
        let existingTab = this.navigationItems.find(item => item.url.split('?')[0] === url);

        if (!existingTab) {
          existingTab = {
            title: navigationTitle,
            url: url,
            params: currentRoute.snapshot.params,
            isActive: false
          };

          this.navigationItems.push(existingTab);
        }

        this.selectTab(existingTab);
      }
    });
  }

  selectTab(tab: INavigationItem) {

    if (tab.isActive) {
      // Tab is already active.
      return;
    }

    this.navigationItems.forEach(element => {
      element.isActive = false;
    });

    tab.isActive = true;
    //this._logger.LogTabOpened(tab.title);
  }

  closeTab(index: number): void {

    // We dont want to close the first tab.
    if (index > 0) {
      const tab = this.navigationItems[index];
      this._routeReuseStrategy.removeCachedRoute(tab.url);
      this.navigationItems.splice(index, 1);
      // this._logger.LogTabClosed(tab.title);
      if (tab.isActive) {
        this._router.navigateByUrl(this.navigationItems[index - 1].url);
      }
    }
  }

}
