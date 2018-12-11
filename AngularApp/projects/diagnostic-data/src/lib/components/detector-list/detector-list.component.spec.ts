import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorListComponent } from './detector-list.component';

describe('DetectorListComponent', () => {
  let component: DetectorListComponent;
  let fixture: ComponentFixture<DetectorListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
