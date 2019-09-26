import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventViewerComponent } from './event-viewer.component';

describe('EventViewerComponent', () => {
  let component: EventViewerComponent;
  let fixture: ComponentFixture<EventViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EventViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
