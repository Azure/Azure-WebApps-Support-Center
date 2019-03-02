import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabChangelistComponent } from './tab-changelist.component';

describe('TabDetectorChangelistComponent', () => {
  let component: TabChangelistComponent;
  let fixture: ComponentFixture<TabChangelistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabChangelistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabChangelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
