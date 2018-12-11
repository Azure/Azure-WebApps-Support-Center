import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorViewComponent } from './detector-view.component';

describe('DetectorViewComponent', () => {
  let component: DetectorViewComponent;
  let fixture: ComponentFixture<DetectorViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
