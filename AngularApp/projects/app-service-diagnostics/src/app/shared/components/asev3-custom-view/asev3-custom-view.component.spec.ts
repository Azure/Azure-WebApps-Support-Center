import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Asev3CustomViewComponent } from './asev3-custom-view.component';

describe('Asev3CustomViewComponent', () => {
  let component: Asev3CustomViewComponent;
  let fixture: ComponentFixture<Asev3CustomViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Asev3CustomViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Asev3CustomViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
