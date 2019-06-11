import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDependenciesComponent } from './app-dependencies.component';

describe('AppDependenciesComponent', () => {
  let component: AppDependenciesComponent;
  let fixture: ComponentFixture<AppDependenciesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppDependenciesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDependenciesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
