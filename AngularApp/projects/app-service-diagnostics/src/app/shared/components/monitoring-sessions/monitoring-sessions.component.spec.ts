import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitoringSessionsComponent } from './monitoring-sessions.component';

describe('MonitoringSessionsComponent', () => {
  let component: MonitoringSessionsComponent;
  let fixture: ComponentFixture<MonitoringSessionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MonitoringSessionsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitoringSessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
