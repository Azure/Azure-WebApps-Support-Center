import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DaasScaleupComponent } from './daas-scaleup.component';

describe('DaasScaleupComponent', () => {
  let component: DaasScaleupComponent;
  let fixture: ComponentFixture<DaasScaleupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DaasScaleupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DaasScaleupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
