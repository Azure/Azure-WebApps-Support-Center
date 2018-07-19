import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { HomeComponent } from './components/home/home.component';
import { CategoryChatComponent } from './components/category-chat/category-chat.component';
import { CategoryTileComponent } from './components/category-tile/category-tile.component';
import { CategoryTabResolver } from './resolvers/category-tab.resolver';

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
      navigationTitle: CategoryTabResolver
    }
  }
]);

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SharedV2Module,
    HomeRoutes
  ],
  declarations: [HomeComponent, CategoryChatComponent, CategoryTileComponent],
  providers: [CategoryTabResolver]
})
export class HomeModule { }
