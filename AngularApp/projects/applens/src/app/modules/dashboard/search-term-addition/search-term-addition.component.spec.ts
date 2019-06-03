import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchTermAdditionComponent } from './search-term-addition.component';

describe('SearchTermAdditionComponent', () => {
  let component: SearchTermAdditionComponent;
  let fixture: ComponentFixture<SearchTermAdditionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchTermAdditionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchTermAdditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
