import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProactiveAutohealingComponent } from './proactive-autohealing.component';

describe('ProactiveAutohealingComponent', () => {
  let component: ProactiveAutohealingComponent;
  let fixture: ComponentFixture<ProactiveAutohealingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProactiveAutohealingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProactiveAutohealingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
