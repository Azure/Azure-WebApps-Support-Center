import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutohealingStatuscodesRuleComponent } from './autohealing-statuscodes-rule.component';

describe('AutohealingStatuscodesRuleComponent', () => {
  let component: AutohealingStatuscodesRuleComponent;
  let fixture: ComponentFixture<AutohealingStatuscodesRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingStatuscodesRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingStatuscodesRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
