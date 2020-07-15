import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CrashMonitoringComponent } from './crash-monitoring.component';

describe('CrashMonitoringComponent', () => {
  let component: CrashMonitoringComponent;
  let fixture: ComponentFixture<CrashMonitoringComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CrashMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CrashMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
