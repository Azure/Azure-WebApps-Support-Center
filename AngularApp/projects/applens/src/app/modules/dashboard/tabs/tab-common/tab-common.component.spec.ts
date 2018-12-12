import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabCommonComponent } from './tab-common.component';

describe('TabCommonComponent', () => {
  let component: TabCommonComponent;
  let fixture: ComponentFixture<TabCommonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabCommonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
