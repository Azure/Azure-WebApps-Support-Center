import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalysisViewComponent } from './analysis-view.component';

describe('AnalysisViewComponent', () => {
  let component: AnalysisViewComponent;
  let fixture: ComponentFixture<AnalysisViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
