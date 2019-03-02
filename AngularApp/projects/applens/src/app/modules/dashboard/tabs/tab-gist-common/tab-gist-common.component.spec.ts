import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabGistCommonComponent } from './tab-gist-common.component';

describe('TabGistCommonComponent', () => {
  let component: TabGistCommonComponent;
  let fixture: ComponentFixture<TabGistCommonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabGistCommonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabGistCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
