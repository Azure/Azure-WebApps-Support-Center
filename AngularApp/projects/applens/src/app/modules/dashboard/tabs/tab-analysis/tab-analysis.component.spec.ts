import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabAnalysisComponent } from './tab-analysis.component';

describe('TabAnalysisComponent', () => {
  let component: TabAnalysisComponent;
  let fixture: ComponentFixture<TabAnalysisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabAnalysisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
