import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabMonitoringComponent } from './tab-monitoring.component';

describe('TabMonitoringComponent', () => {
  let component: TabMonitoringComponent;
  let fixture: ComponentFixture<TabMonitoringComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
