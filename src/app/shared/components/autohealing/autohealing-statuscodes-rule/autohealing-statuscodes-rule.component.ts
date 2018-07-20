import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { StatusCodesBasedTrigger } from '../../../models/autohealing';
import { AutohealingService } from '../../../services/autohealing.service';


@Component({
  selector: 'autohealing-statuscodes-rule',
  templateUrl: './autohealing-statuscodes-rule.component.html',
  styleUrls: ['../autohealing.component.css']
})
export class AutohealingStatuscodesRuleComponent extends AutohealingRuleComponent {

  currentRule: StatusCodesBasedTrigger;
  currentEditIndex: number = -1;
  
  constructor(private _autoHealingService:AutohealingService){
    super();
  }

  addNewRule() {
    this.currentRule = new StatusCodesBasedTrigger();
    if (!this.Rule) {
      this.Rule = [];
    }
    this.editMode = true;   
    this.currentEditIndex = -1;
  }

  deleteStatusCodeRule(i: number) {
    if (i > -1) {
      this.Rule.splice(i, 1)
      this.RuleChange.emit(this.Rule);
    }
  }

  editStatusCodeRule(i: number) {
    if (i > -1) {
      this.currentRule = {...this.Rule[i]}; 
      this.editMode = true;
      this.currentEditIndex = i;      
    }

  }

  saveRule() {
    this.editMode = false;
    if (this.currentRule.subStatus == null){
      this.currentRule.subStatus = 0;
    }
    if (this.currentRule.win32Status == null){
      this.currentRule.win32Status = 0;
    }
    if (this.currentEditIndex < 0) {
      this.Rule.push(this.currentRule);
    }
    else {
      this.Rule[this.currentEditIndex] = this.currentRule;
    }

    this.RuleChange.emit(this.Rule);
  }

  isValid():boolean{
    return (this.currentRule.count > 0 && this.currentRule.status > 100 && this.currentRule.status < 530 && (this.currentRule.timeInterval && this._autoHealingService.timeToSeconds(this.currentRule.timeInterval) > 0));
  }
}