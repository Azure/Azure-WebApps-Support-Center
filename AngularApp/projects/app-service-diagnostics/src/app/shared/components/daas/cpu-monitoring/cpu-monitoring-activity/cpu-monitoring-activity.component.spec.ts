import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CpuMonitoringActivityComponent } from './cpu-monitoring-activity.component';

describe('CpuMonitoringActivityComponent', () => {
  let component: CpuMonitoringActivityComponent;
  let fixture: ComponentFixture<CpuMonitoringActivityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CpuMonitoringActivityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CpuMonitoringActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
