import { Component, OnInit } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { RequestsBasedTrigger } from '../../../models/autohealing';
import { FormattingService } from '../../../services/formatting.service';


@Component({
  selector: 'autohealing-requests-rule',
  templateUrl: './autohealing-requests-rule.component.html',
  styleUrls: ['../autohealing.component.css']
})
export class AutohealingRequestsRuleComponent extends AutohealingRuleComponent implements OnInit {

  constructor(private _formattingService:FormattingService){
    super();
  }
  
  addNewRule() {
    this.rule = new RequestsBasedTrigger();
    this.ruleCopy = new RequestsBasedTrigger();
    this.editMode = true;
  }

  isValid(): boolean {
    if (this.ruleCopy && this.ruleCopy.timeInterval && this.ruleCopy.timeInterval !== '') {
      return (this._formattingService.timespanToSeconds(this.ruleCopy.timeInterval) > 0 && this.ruleCopy.count > 0);
    }
    else {
      return false;
    }
  }
}