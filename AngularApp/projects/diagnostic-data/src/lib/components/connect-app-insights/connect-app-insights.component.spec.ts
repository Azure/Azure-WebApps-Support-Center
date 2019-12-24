import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectAppInsightsComponent } from './connect-app-insights.component';

describe('ConnectAppInsightsComponent', () => {
  let component: ConnectAppInsightsComponent;
  let fixture: ComponentFixture<ConnectAppInsightsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectAppInsightsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectAppInsightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
