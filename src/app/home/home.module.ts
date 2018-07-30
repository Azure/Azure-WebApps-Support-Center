import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { HomeComponent } from './components/home/home.component';
import { CategoryChatComponent } from './components/category-chat/category-chat.component';
import { CategoryTileComponent } from './components/category-tile/category-tile.component';
import { CategoryTabResolver, CategoryChatResolver } from './resolvers/category-tab.resolver';
import { SupportBotModule } from '../supportbot/supportbot.module';
import { GenericCategoryFlow } from './message-flows/generic-category.flow';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { FormsModule } from '../../../node_modules/@angular/forms';
import { GenericDetectorComponent } from '../shared/components/generic-detector/generic-detector.component';
import { TabTitleResolver } from '../shared/resolvers/tab-name.resolver';

export const HomeRoutes = RouterModule.forChild([
  {
    path: '',
    component: HomeComponent,
    data: {
      navigationTitle: 'Home',
      cacheComponent: true
    },
  },
  {
    path: 'categories/:category',
    component: CategoryChatComponent,
    data: {
      cacheComponent: true
    },
    resolve: {
      navigationTitle: CategoryTabResolver,
      messageList: CategoryChatResolver
    }
  },
  {
    path: 'detectors/:detectorName',
    component: GenericDetectorComponent,
    data: {
      cacheComponent: true
    },
    resolve: {
      navigationTitle: TabTitleResolver
    }
  }
]);

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SharedV2Module,
    HomeRoutes,
    SupportBotModule,
    FormsModule
  ],
  declarations: [HomeComponent, CategoryChatComponent, CategoryTileComponent, SearchResultsComponent],
  providers: [CategoryTabResolver, CategoryChatResolver, GenericCategoryFlow]
})
export class HomeModule { }
