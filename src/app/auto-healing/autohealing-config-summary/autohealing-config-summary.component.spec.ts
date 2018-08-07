import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutohealingConfigSummaryComponent } from './autohealing-config-summary.component';

describe('AutohealingConfigSummaryComponent', () => {
  let component: AutohealingConfigSummaryComponent;
  let fixture: ComponentFixture<AutohealingConfigSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingConfigSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingConfigSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
