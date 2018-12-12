import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabAnalyticsDevelopComponent } from './tab-analytics-develop.component';

describe('TabAnalyticsDevelopComponent', () => {
  let component: TabAnalyticsDevelopComponent;
  let fixture: ComponentFixture<TabAnalyticsDevelopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabAnalyticsDevelopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabAnalyticsDevelopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
