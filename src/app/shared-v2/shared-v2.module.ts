import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
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
        SupportTopicService
      ]
    }
  }
}
