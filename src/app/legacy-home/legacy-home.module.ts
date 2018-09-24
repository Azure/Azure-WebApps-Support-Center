import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomepageComponent } from '../supportbot/homepage/homepage.component';
import { SupportBotModule } from '../supportbot/supportbot.module';
import { AppInsightsSettingsComponent } from '../availability/app-insights/app-insights-settings.component';

const _siteResourceUrl: string = 'legacy/subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:sitename';
const _slotResourceUrl: string = 'legacy/subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:sitename/slots/:slot';
const _hostingEnvironmentResourceUrl: string = 'legacy/subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/hostingenvironments/:name';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(
      [
        {
          path: _siteResourceUrl + '/diagnostics',
          component: HomepageComponent,
          data: {
            navigationTitle: 'Legacy Home',
            cacheComponent: true
          }
        },
        {
          path: _slotResourceUrl + '/diagnostics',
          component: HomepageComponent,
          data: {
            navigationTitle: 'Legacy Home',
            cacheComponent: true
          }
        },
        {
          path: _hostingEnvironmentResourceUrl + '/diagnostics',
          component: HomepageComponent,
          data: {
            navigationTitle: 'Legacy Home',
            cacheComponent: true
          }
        },
        {
          path: _siteResourceUrl + '/diagnostics/settings/appinsights',
          component: AppInsightsSettingsComponent,
          data: {
            navigationTitle: 'Application Insights Settings'
          }
        },
        {
          path: _slotResourceUrl + '/diagnostics/settings/appinsights Settings',
          component: AppInsightsSettingsComponent,
          data: {
            navigationTitle: 'Application Insights'
          }
        }]
    ),
    SupportBotModule
  ],
  declarations: []
})
export class LegacyHomeModule { }
