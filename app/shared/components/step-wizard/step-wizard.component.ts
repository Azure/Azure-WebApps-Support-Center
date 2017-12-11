import { Component, Input, OnInit } from '@angular/core';
import { StepWizardSingleStep } from '../../models/step-wizard-single-step';




@Component({
    selector: 'step-wizard',
    templateUrl: 'step-wizard.component.html',
    styleUrls: ['step-wizard.component.css']
})

export class StepWizardComponent {

    @Input() public CurrentStep: number;
    @Input() public WizardSteps: StepWizardSingleStep[];


    ngOnInit(): void {

         
    }

}