import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabDetectorChangelistComponent } from './tab-detector-changelist.component';

describe('TabDetectorChangelistComponent', () => {
  let component: TabDetectorChangelistComponent;
  let fixture: ComponentFixture<TabDetectorChangelistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabDetectorChangelistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabDetectorChangelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
