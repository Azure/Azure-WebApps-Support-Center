import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutohealingCustomActionComponent } from './autohealing-custom-action.component';

describe('AutohealingCustomActionComponent', () => {
  let component: AutohealingCustomActionComponent;
  let fixture: ComponentFixture<AutohealingCustomActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingCustomActionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingCustomActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
