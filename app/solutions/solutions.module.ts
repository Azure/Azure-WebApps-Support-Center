import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { SolutionsWidgetComponent } from './components/common/solutions-widget/solutions-widget.component';
import { DynamicSolutionPlaceHolderDirective } from './directives/dynamic-solution-placeholder.directive';
import { SiteRestartComponent } from './components/specific-solutions/site-restart-solution/site-restart-solution.component';
import { DynamicSolutionComponent } from './components/common/dynamic-solution/dynamic-solution.component';
import { ScaleUpSolutionComponent } from './components/specific-solutions/scale-up-solution/scale-up-solution.component';
import { DefaultSolutionTemplateComponent } from './components/common/default-solution-template/default-solution-template.component';
import { ProfilingComponent } from './components/specific-solutions/profiling-solution/profiling-solution.component';
import { SolutionOperationComponent } from './components/common/solution-operation/solution-operation.component';

@NgModule({
    declarations: [
        DynamicSolutionPlaceHolderDirective, 
        DynamicSolutionComponent,
        SolutionsWidgetComponent,
        SiteRestartComponent,
        ScaleUpSolutionComponent,
        DefaultSolutionTemplateComponent,
        ProfilingComponent,
        SolutionOperationComponent
    ],
    imports: [
        SharedModule
    ],
    exports: [
        SolutionsWidgetComponent,
    ],
    providers: [
    ]
})
export class SolutionsModule {
}