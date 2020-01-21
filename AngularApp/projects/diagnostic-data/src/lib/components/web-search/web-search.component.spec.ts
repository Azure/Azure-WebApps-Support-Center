import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WebSearchComponent } from './web-search.component';

describe('WebSearchComponent', () => {
  let component: WebSearchComponent;
  let fixture: ComponentFixture<WebSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WebSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WebSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
