import { Component, Input, Output, ViewContainerRef, ViewChild, ReflectiveInjector, ComponentFactoryResolver, EventEmitter } from '@angular/core';

import { TextMessageComponent } from '../common/text-message/text-message.component';
import { ButtonMessageComponent } from '../common/button-message/button-message.component';
import { MainMenuComponent } from '../message-flow/main-menu/main-menu.component';
import { HealthCheckComponent } from '../message-flow/health-check/health-check.component';
import { FeedbackComponent } from '../message-flow/feedback/feedback.component';
import { SolutionsMessageComponent } from '../common/solutions-message/solutions-message.component';
import { GraphMessageComponent } from '../common/graph-message/graph-message.component';
import { ProblemStatementMessageComponent } from '../common/problem-statement-message/problem-statement-message.component';
import { TalkToAgentMessageComponent } from '../message-flow/talk-to-agent/talk-to-agent-message.component';
import { Message } from '../models/message';
import { CategoryMenuComponent } from '../message-flow/category-menu/category-menu.component';
import { DetectorSummaryComponent } from '../message-flow/detector-summary/detector-summary.component';
import { DocumentSearchResultsComponent } from '../message-flow/document-search-results/document-search-results.component';
import { DocumentSearchComponent } from '../message-flow/document-search/document-search.component';

@Component({
    selector: 'dynamic-component',
    entryComponents: [TextMessageComponent, MainMenuComponent, ButtonMessageComponent, HealthCheckComponent, FeedbackComponent, 
        SolutionsMessageComponent, GraphMessageComponent, ProblemStatementMessageComponent, TalkToAgentMessageComponent, CategoryMenuComponent,
        DetectorSummaryComponent, DocumentSearchComponent, DocumentSearchResultsComponent],
    template: `
    <div #dynamicComponentContainer></div>
  `,
})
export class DynamicComponent {
    currentComponent = null;

    @ViewChild('dynamicComponentContainer', { read: ViewContainerRef }) dynamicComponentContainer: ViewContainerRef;

    @Output() onViewUpdate = new EventEmitter<any>();
    @Output() onComplete = new EventEmitter<any>();

    @Input() set componentData(message: Message) {
        if (!message) {
            return;
        }

        let inputProviders = Object.keys(message.parameters).map((inputName) => { return { provide: inputName, useValue: message.parameters[inputName] }; });
        let resolvedInputs = ReflectiveInjector.resolve(inputProviders);

        // Create injector out of the data we want to pass down and this components injector
        let injector = ReflectiveInjector.fromResolvedProviders(resolvedInputs, this.dynamicComponentContainer.parentInjector);

        let factory = this.resolver.resolveComponentFactory(message.component);

        // Create the component using the factory and the injector
        let component = factory.create(injector);

        // Insert the component into the dom container
        this.dynamicComponentContainer.insert(component.hostView);

        // Destroy the old component
        if (this.currentComponent) {
            this.currentComponent.destroy();
        }

        this.currentComponent = component;

        // Subscribe to view Update event from Messages and emit out View Update Event
        this.currentComponent.instance.onViewUpdate.subscribe((response: any) => {
            this.onViewUpdate.emit();
        });

        // Subscribe to Complete events from Messages
        // On completion, Do the following:
        //  1. Emit out the completion event
        //  2. Unsubscribe to component OnComplete and OnViewUpdate events to stop further notifications.
        this.currentComponent.instance.onComplete.subscribe((response: { status: boolean, data?: any }) => {
            if (response.status === true) {
                this.onComplete.emit(response.data);

                this.currentComponent.instance.onViewUpdate.unsubscribe();
                this.currentComponent.instance.onComplete.unsubscribe();
            }
        });
    }

    constructor(private resolver: ComponentFactoryResolver) {
    }
}
