import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSeriesInstanceGraphComponent } from './time-series-instance-graph.component';

describe('TimeSeriesInstanceGraphComponent', () => {
  let component: TimeSeriesInstanceGraphComponent;
  let fixture: ComponentFixture<TimeSeriesInstanceGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimeSeriesInstanceGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSeriesInstanceGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
