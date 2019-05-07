import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangesViewComponent } from './changes-view.component';

describe('ChangesViewComponent', () => {
  let component: ChangesViewComponent;
  let fixture: ComponentFixture<ChangesViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangesViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
