import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuageGraphicComponent } from './guage-graphic.component';

describe('GuageGraphicComponent', () => {
  let component: GuageGraphicComponent;
  let fixture: ComponentFixture<GuageGraphicComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuageGraphicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuageGraphicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
