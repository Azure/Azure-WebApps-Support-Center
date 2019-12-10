import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorSearchComponent } from './detector-search.component';

describe('DetectorSearchComponent', () => {
  let component: DetectorSearchComponent;
  let fixture: ComponentFixture<DetectorSearchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
