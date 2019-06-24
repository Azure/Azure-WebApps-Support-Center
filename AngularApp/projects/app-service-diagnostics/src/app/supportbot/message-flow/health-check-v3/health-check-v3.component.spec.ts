import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthCheckV3Component } from './health-check-v3.component';

describe('HealthCheckV3Component', () => {
  let component: HealthCheckV3Component;
  let fixture: ComponentFixture<HealthCheckV3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HealthCheckV3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HealthCheckV3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
