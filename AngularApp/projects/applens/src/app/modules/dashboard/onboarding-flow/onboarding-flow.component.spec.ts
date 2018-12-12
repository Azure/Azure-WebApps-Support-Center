import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingFlowComponent } from './onboarding-flow.component';

describe('OnboardingFlowComponent', () => {
  let component: OnboardingFlowComponent;
  let fixture: ComponentFixture<OnboardingFlowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnboardingFlowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnboardingFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
