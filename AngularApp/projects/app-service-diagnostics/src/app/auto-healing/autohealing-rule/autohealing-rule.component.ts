import { Input, Output, EventEmitter, OnInit } from '@angular/core';

export abstract class AutohealingRuleComponent implements OnInit {

  ruleCopy: any;
  displayDeleteRuleMessage: boolean = false;

  @Input() rule: any;
  @Output() ruleChange = new EventEmitter<any>();
  editMode: boolean = false;

  ngOnInit(): void {
    if (this.rule) {
      this.ruleCopy = { ...this.rule };
    }
  }

  editRule() {
    this.editMode = true;
  }

  deleteRule() {
    this.displayDeleteRuleMessage = true;
    this.rule = null;
    this.ruleCopy = null;
    this.ruleChange.emit(this.rule);
    setTimeout(() => {
      this.displayDeleteRuleMessage = false;
    }, 5000);
  }

  saveRule() {
    // cloning the object
    this.rule = { ...this.ruleCopy };
    this.editMode = false;
    this.ruleChange.emit(this.rule);
  }

}
