import { Component, Injector, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { Message } from '../../models/message';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { IDetectorResponse } from '../../../shared/models/detectorresponse';
import { ISolution } from '../../../shared/models/solution';
import { BehaviorSubject } from 'rxjs';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';

@Component({
    templateUrl: 'solutions-message.component.html'
})
export class SolutionsMessageComponent implements AfterViewInit, IChatMessageComponent {
    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    solutions: ISolution[];
    defaultSolutions: ISolution[] = [ <ISolution>{ id: 4 } ];

    constructor(private injector: Injector, private _route: ActivatedRoute, private _appAnalysisService: AppAnalysisService) {
    }

    ngAfterViewInit(): void {
        (<BehaviorSubject<ISolution[]>>this.injector.get('solutions')).subscribe(solutionList => {
            this.solutions = solutionList;

            this.onViewUpdate.emit();

            this.onComplete.emit({
                status: true
            });
        });
    }
}

export class SolutionsMessage extends Message {
    constructor(solutions: BehaviorSubject<ISolution[]>, messageDelayInMs: number = 500) {
        //TODO: add solution data
        super(SolutionsMessageComponent, { solutions: solutions }, messageDelayInMs);
    }
}