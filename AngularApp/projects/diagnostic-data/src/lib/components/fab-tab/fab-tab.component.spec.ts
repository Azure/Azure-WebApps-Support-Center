import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FabTabComponent } from './fab-tab.component';

describe('FabTabComponent', () => {
  let component: FabTabComponent;
  let fixture: ComponentFixture<FabTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FabTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FabTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
