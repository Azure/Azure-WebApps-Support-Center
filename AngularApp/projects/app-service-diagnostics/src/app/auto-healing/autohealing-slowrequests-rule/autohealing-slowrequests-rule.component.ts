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

  constructor() {
    super();
  }

  showIntervalRecommendation: boolean = false;

  addNewRule() {
    this.rule = new SlowRequestsBasedTrigger();
    this.ruleCopy = new SlowRequestsBasedTrigger();
    this.editMode = true;
  }

  isValid(): boolean {
    this.showIntervalRecommendation = false;
    if (this.ruleCopy && this.ruleCopy.timeInterval && this.ruleCopy.timeInterval !== '' && this.ruleCopy.timeTaken && this.ruleCopy.timeTaken != '') {
      let isValid: boolean = (this.ruleCopy.count > 0 && FormatHelper.timespanToSeconds(this.ruleCopy.timeInterval) > 0 && FormatHelper.timespanToSeconds(this.ruleCopy.timeTaken) > 0);
      if (isValid) {
        this.showIntervalRecommendation = this.ruleCopy.timeInterval < this.ruleCopy.timeTaken
      }
      return isValid;
    } else {
      return false;
    }
  }
}
