import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorContainerComponent } from './detector-container.component';

describe('DetectorContainerComponent', () => {
  let component: DetectorContainerComponent;
  let fixture: ComponentFixture<DetectorContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
