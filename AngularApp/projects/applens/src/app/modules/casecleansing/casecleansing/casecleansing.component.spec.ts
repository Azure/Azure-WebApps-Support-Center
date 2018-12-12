import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CasecleansingComponent } from './casecleansing.component';

describe('CasecleansingComponent', () => {
  let component: CasecleansingComponent;
  let fixture: ComponentFixture<CasecleansingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CasecleansingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CasecleansingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
