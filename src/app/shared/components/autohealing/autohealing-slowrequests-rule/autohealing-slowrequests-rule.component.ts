import { Component } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { SlowRequestsBasedTrigger } from '../../../models/autohealing';
import { FormattingService } from '../../../services/formatting.service';

@Component({
  selector: 'autohealing-slowrequests-rule',
  templateUrl: './autohealing-slowrequests-rule.component.html',
  styleUrls: ['../autohealing.component.css']
})
export class AutohealingSlowrequestsRuleComponent extends AutohealingRuleComponent {

  constructor(private _formattingService:FormattingService){
    super();
  }
  
  addNewRule() {
    this.rule = new SlowRequestsBasedTrigger();
    this.ruleCopy = new SlowRequestsBasedTrigger();
    this.editMode = true;
  }

  isValid(): boolean {
    if (this.ruleCopy && this.ruleCopy.timeInterval && this.ruleCopy.timeInterval !== '' && this.ruleCopy.timeTaken && this.ruleCopy.timeTaken != '') {
      return (this.ruleCopy.count > 0 && this._formattingService.timespanToSeconds(this.ruleCopy.timeInterval) > 0 && this._formattingService.timespanToSeconds(this.ruleCopy.timeTaken) > 0);
    }
    else {
      return false;
    }
  }
}