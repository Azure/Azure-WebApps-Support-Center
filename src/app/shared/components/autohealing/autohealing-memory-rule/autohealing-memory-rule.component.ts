import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AutohealingRuleComponent } from '../autohealing-rule/autohealing-rule.component';

@Component({
  selector: 'autohealing-memory-rule',
  templateUrl: './autohealing-memory-rule.component.html',
  styleUrls: ['../autohealing.component.css']
})
export class AutohealingMemoryRuleComponent extends AutohealingRuleComponent {

  addNewRule() {
    this.editMode = true;
  }

  ngOnInit(): void {    
    if (this.Rule) {
      this.RuleCopy = this.Rule;
    }
  }

  saveRule() {
    this.Rule = this.RuleCopy;
    this.editMode = false;
    this.RuleChange.emit(this.Rule);
  }

  
  deleteRule() {
    this.Rule = 0;
    this.RuleCopy = 0;
    this.RuleChange.emit(this.Rule);
  }

  isValid(): boolean {
    if (this.RuleCopy <= 102400 || this.RuleCopy > 13 * 1024 * 1024) {
      return false;
    }
    else {
      return true;
    }
  }


}
