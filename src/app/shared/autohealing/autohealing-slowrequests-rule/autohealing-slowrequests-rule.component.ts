import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SlowRequestsBasedTrigger } from '../../models/autohealing';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { AutohealingService } from '../../services/autohealing.service';

@Component({
  selector: 'autohealing-slowrequests-rule',
  templateUrl: './autohealing-slowrequests-rule.component.html',
  styleUrls: ['../autohealing.component.css']
})
export class AutohealingSlowrequestsRuleComponent extends AutohealingRuleComponent {

  constructor(private _autoHealingService:AutohealingService){
    super();
  }
  
  addNewRule() {
    this.Rule = new SlowRequestsBasedTrigger();
    this.RuleCopy = new SlowRequestsBasedTrigger();
    this.editMode = true;
  }

  isValid(): boolean {
    if (this.RuleCopy && this.RuleCopy.timeInterval && this.RuleCopy.timeInterval !== '' && this.RuleCopy.timeTaken && this.RuleCopy.timeTaken != '') {
      return (this.RuleCopy.count > 0 && this._autoHealingService.timeToSeconds(this.RuleCopy.timeInterval) > 0 && this._autoHealingService.timeToSeconds(this.RuleCopy.timeTaken) > 0);
    }
    else {
      return false;
    }
  }
}