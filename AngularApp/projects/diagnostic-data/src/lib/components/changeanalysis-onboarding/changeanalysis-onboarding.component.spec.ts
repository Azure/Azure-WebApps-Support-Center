import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeanalysisOnboardingComponent } from './changeanalysis-onboarding.component';

describe('ChangeanalysisOnboardingComponent', () => {
  let component: ChangeanalysisOnboardingComponent;
  let fixture: ComponentFixture<ChangeanalysisOnboardingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeanalysisOnboardingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeanalysisOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
