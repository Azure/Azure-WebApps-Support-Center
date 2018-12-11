import { Component } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { SlowRequestsBasedTrigger } from '../../shared/models/autohealing';
import { FormatHelper } from '../../shared/utilities/formattingHelper';

@Component({
  selector: 'autohealing-slowrequests-rule',
  templateUrl: './autohealing-slowrequests-rule.component.html',
  styleUrls: ['../autohealing.component.scss']
})
export class AutohealingSlowrequestsRuleComponent extends AutohealingRuleComponent {

  constructor(){
    super();
  }
  
  addNewRule() {
    this.rule = new SlowRequestsBasedTrigger();
    this.ruleCopy = new SlowRequestsBasedTrigger();
    this.editMode = true;
  }

  isValid(): boolean {
    if (this.ruleCopy && this.ruleCopy.timeInterval && this.ruleCopy.timeInterval !== '' && this.ruleCopy.timeTaken && this.ruleCopy.timeTaken != '') {
      return (this.ruleCopy.count > 0 && FormatHelper.timespanToSeconds(this.ruleCopy.timeInterval) > 0 && FormatHelper.timespanToSeconds(this.ruleCopy.timeTaken) > 0);
    }
    else {
      return false;
    }
  }
}