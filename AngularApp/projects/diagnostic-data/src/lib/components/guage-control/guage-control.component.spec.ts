import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuageControlComponent } from './guage-control.component';

describe('GuageControlComponent', () => {
  let component: GuageControlComponent;
  let fixture: ComponentFixture<GuageControlComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuageControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuageControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
