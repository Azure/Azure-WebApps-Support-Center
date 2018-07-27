import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutohealingStartupTimeComponent } from './autohealing-startup-time.component';

describe('AutohealingStartupTimeComponent', () => {
  let component: AutohealingStartupTimeComponent;
  let fixture: ComponentFixture<AutohealingStartupTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingStartupTimeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingStartupTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
