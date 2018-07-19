import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutohealingRequestsRuleComponent } from './autohealing-requests-rule.component';

describe('AutohealingRequestsRuleComponent', () => {
  let component: AutohealingRequestsRuleComponent;
  let fixture: ComponentFixture<AutohealingRequestsRuleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingRequestsRuleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingRequestsRuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
