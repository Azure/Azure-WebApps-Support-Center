import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';
import { StatusCodesBasedTrigger } from '../../../models/autohealing';
import { FormatHelper } from '../../../utilities/formattingHelper';

@Component({
  selector: 'autohealing-statuscodes-rule',
  templateUrl: './autohealing-statuscodes-rule.component.html',
  styleUrls: ['../autohealing.component.css']
})
export class AutohealingStatuscodesRuleComponent extends AutohealingRuleComponent {

  currentRule: StatusCodesBasedTrigger;
  currentEditIndex: number = -1;
  
  constructor(){
    super();
  }

  addNewRule() {
    this.currentRule = new StatusCodesBasedTrigger();
    if (!this.rule) {
      this.rule = [];
    }
    this.editMode = true;   
    this.currentEditIndex = -1;
  }

  deleteStatusCodeRule(i: number) {
    if (i > -1) {
      this.rule.splice(i, 1)
      this.ruleChange.emit(this.rule);
    }
  }

  editStatusCodeRule(i: number) {
    if (i > -1) {
      this.currentRule = {...this.rule[i]}; 
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
      this.rule.push(this.currentRule);
    }
    else {
      this.rule[this.currentEditIndex] = this.currentRule;
    }

    this.ruleChange.emit(this.rule);
  }

  isValid():boolean{
    return (this.currentRule.count > 0 && this.currentRule.status > 100 && this.currentRule.status < 530 && (this.currentRule.timeInterval && FormatHelper.timespanToSeconds(this.currentRule.timeInterval) > 0));
  }
}