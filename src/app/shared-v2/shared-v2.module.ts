import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebSitesService } from './services/web-sites.service';
import { WebHostingEnvironmentsService } from './services/web-hosting-environments.service';
import { CategoryService } from './services/category.service';
import { FeatureService } from './services/feature.service';
import { ContentService } from './services/content.service';
import { SupportTopicService } from './services/support-topic.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: []
})
export class SharedV2Module {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedV2Module,
      providers: [
        WebSitesService,
        WebHostingEnvironmentsService,
        CategoryService,
        FeatureService,
        ContentService,
        SupportTopicService
      ]
    }
  }
}
