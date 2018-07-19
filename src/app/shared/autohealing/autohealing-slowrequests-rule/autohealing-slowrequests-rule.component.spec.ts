import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutohealingSlowrequestsRuleComponent } from './autohealing-slowrequests-rule.component';

describe('AutohealingSlowrequestsRuleComponent', () => {
  let component: AutohealingSlowrequestsRuleComponent;
  let fixture: ComponentFixture<AutohealingSlowrequestsRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingSlowrequestsRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingSlowrequestsRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
