import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutohealingDaasActionComponent } from './autohealing-daas-action.component';

describe('AutohealingDaasActionComponent', () => {
  let component: AutohealingDaasActionComponent;
  let fixture: ComponentFixture<AutohealingDaasActionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutohealingDaasActionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutohealingDaasActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
