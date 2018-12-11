import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorControlComponent } from './detector-control.component';

describe('DetectorControlComponent', () => {
  let component: DetectorControlComponent;
  let fixture: ComponentFixture<DetectorControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
