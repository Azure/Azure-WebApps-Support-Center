import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CrashMonitoringAnalysisComponent } from './crash-monitoring-analysis.component';

describe('CrashMonitoringAnalysisComponent', () => {
  let component: CrashMonitoringAnalysisComponent;
  let fixture: ComponentFixture<CrashMonitoringAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CrashMonitoringAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrashMonitoringAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
