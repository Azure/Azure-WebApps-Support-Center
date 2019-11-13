import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthRequestFailedComponent } from './auth-request-failed.component';

describe('AuthRequestFailedComponent', () => {
  let component: AuthRequestFailedComponent;
  let fixture: ComponentFixture<AuthRequestFailedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthRequestFailedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthRequestFailedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
