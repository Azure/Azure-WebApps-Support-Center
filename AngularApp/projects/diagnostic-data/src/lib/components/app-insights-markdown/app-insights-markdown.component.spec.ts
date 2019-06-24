import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppInsightsMarkdownComponent } from './app-insights-markdown.component';

describe('AppInsightsMarkdownComponent', () => {
  let component: AppInsightsMarkdownComponent;
  let fixture: ComponentFixture<AppInsightsMarkdownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppInsightsMarkdownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppInsightsMarkdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
