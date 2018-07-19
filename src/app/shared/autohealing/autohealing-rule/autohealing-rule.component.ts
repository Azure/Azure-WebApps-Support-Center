import { Input, Output, EventEmitter, OnInit } from '@angular/core';

export abstract class AutohealingRuleComponent implements OnInit{  

  RuleCopy:any;
  
  @Input() Rule: any;
  @Output() RuleChange = new EventEmitter<any>();
  editMode: boolean = false; 

  ngOnInit(): void {    
    if (this.Rule) {
      this.RuleCopy = {...this.Rule}; 
    }
  }
  
  editRule() {
    this.editMode = true;
  }

  deleteRule() {
    this.Rule = null;
    this.RuleCopy = null;
    this.RuleChange.emit(this.Rule);
  }

  saveRule() {
    // cloning the object
    this.Rule = {...this.RuleCopy}; 
    this.editMode = false;
    this.RuleChange.emit(this.Rule);
  }

}
