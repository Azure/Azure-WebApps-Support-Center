import { Component, Input, AfterViewInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { DynamicSolutionPlaceHolderDirective } from '../../../directives/dynamic-solution-placeholder.directive';
import { SolutionHolder } from '../../../../shared/models/solution-holder';
import { SolutionBaseComponent } from '../solution-base/solution-base.component';
import { SiteRestartComponent } from '../../specific-solutions/site-restart-solution/site-restart-solution.component';
import { ScaleUpSolutionComponent } from '../../specific-solutions/scale-up-solution/scale-up-solution.component';
import { ProfilingComponent } from '../../specific-solutions/profiling-solution/profiling-solution.component';


@Component({
    selector: 'dynamic-solution',
    template: `
    <div dynamic-solution-placeholder></div>
    `,
    entryComponents: [SiteRestartComponent, ScaleUpSolutionComponent,ProfilingComponent]
})
export class DynamicSolutionComponent implements AfterViewInit {
    currentComponent = null;

    @Input() solutionHolder: SolutionHolder;

    @ViewChild(DynamicSolutionPlaceHolderDirective) solutionPlaceHolder: DynamicSolutionPlaceHolderDirective;

    constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

    ngAfterViewInit(): void {
        let componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.solutionHolder.component);

        let viewContainerRef = this.solutionPlaceHolder.viewContainerRef;
        viewContainerRef.clear();
    
        let componentRef = viewContainerRef.createComponent(componentFactory);
        (<SolutionBaseComponent>componentRef.instance).data = this.solutionHolder.data;
    }
}