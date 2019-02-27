import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CpuMonitoringSessionsComponent } from './cpu-monitoring-sessions.component';

describe('CpuMonitoringSessionsComponent', () => {
  let component: CpuMonitoringSessionsComponent;
  let fixture: ComponentFixture<CpuMonitoringSessionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CpuMonitoringSessionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CpuMonitoringSessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
