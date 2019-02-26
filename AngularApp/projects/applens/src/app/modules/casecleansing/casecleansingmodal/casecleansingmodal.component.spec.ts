import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CasecleansingmodalComponent } from './casecleansingmodal.component';

describe('CasecleansingmodalComponent', () => {
  let component: CasecleansingmodalComponent;
  let fixture: ComponentFixture<CasecleansingmodalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CasecleansingmodalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CasecleansingmodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
