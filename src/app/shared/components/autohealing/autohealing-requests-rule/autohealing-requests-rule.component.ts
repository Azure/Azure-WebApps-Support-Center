import { Component, OnInit } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { AutohealingService } from '../../../services/autohealing.service';
import { RequestsBasedTrigger } from '../../../models/autohealing';


@Component({
  selector: 'autohealing-requests-rule',
  templateUrl: './autohealing-requests-rule.component.html',
  styleUrls: ['../autohealing.component.css']
})
export class AutohealingRequestsRuleComponent extends AutohealingRuleComponent implements OnInit {

  constructor(private _autoHealingService:AutohealingService){
    super();
  }
  
  addNewRule() {
    this.Rule = new RequestsBasedTrigger();
    this.RuleCopy = new RequestsBasedTrigger();
    this.editMode = true;
  }

  isValid(): boolean {
    if (this.RuleCopy && this.RuleCopy.timeInterval && this.RuleCopy.timeInterval !== '') {
      return (this._autoHealingService.timespanToSeconds(this.RuleCopy.timeInterval) > 0 && this.RuleCopy.count > 0);
    }
    else {
      return false;
    }
  }
}