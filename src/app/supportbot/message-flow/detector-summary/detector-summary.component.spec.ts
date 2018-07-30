import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorSummaryComponent } from './detector-summary.component';

describe('DetectorSummaryComponent', () => {
  let component: DetectorSummaryComponent;
  let fixture: ComponentFixture<DetectorSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
