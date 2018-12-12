import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabDevelopComponent } from './tab-develop.component';

describe('TabDevelopComponent', () => {
  let component: TabDevelopComponent;
  let fixture: ComponentFixture<TabDevelopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabDevelopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabDevelopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
