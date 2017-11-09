import { Component, Injector, OnInit, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

import { Message } from '../../models/message';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { BotLoggingService, AppAnalysisService } from '../../../shared/services';
import { MessageSender } from '../../models/message';
import { IDetectorResponse } from '../../../shared/models/detectorresponse';
import { ISolution } from '../../../shared/models/solution';

@Component({
    templateUrl: 'solutions-message.component.html'
})
export class SolutionsMessageComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    message: string = '';
    messageByUser: boolean = false;

    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    detectorResponse: IDetectorResponse;
    solutions: ISolution[] = [];

    constructor(private injector: Injector, private _route: ActivatedRoute,  private _appAnalysisService: AppAnalysisService) {
    }

    ngOnInit(): void {
        this.subscriptionId = this._route.snapshot.params['subscriptionid'];
        this.resourceGroup = this._route.snapshot.params['resourcegroup'];
        this.siteName = this._route.snapshot.params['sitename'];
        this.slotName = this._route.snapshot.params['slot'] ? this._route.snapshot.params['slot'] : '';

        this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, 'availability', 'sitecpuanalysis').subscribe(response => {
            this.detectorResponse = response;
            if(response.abnormalTimePeriods.length > 0){
                response.abnormalTimePeriods[response.abnormalTimePeriods.length - 1].solutions.forEach(solution => this.solutions.push(solution));
            }
            
        });
    }

    ngAfterViewInit(): void {
        this.onViewUpdate.emit();

        this.onComplete.emit({
            status: true
        });
    }
}

export class SolutionsMessage extends Message {
    constructor(messageDelayInMs: number = 500) {
        //TODO: add solution data
        super(SolutionsMessageComponent, {}, messageDelayInMs);
    }
}