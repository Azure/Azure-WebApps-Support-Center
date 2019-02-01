import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CpuMonitoringToolComponent } from './cpu-monitoring-tool.component';

describe('CpuMonitoringToolComponent', () => {
  let component: CpuMonitoringToolComponent;
  let fixture: ComponentFixture<CpuMonitoringToolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CpuMonitoringToolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CpuMonitoringToolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
