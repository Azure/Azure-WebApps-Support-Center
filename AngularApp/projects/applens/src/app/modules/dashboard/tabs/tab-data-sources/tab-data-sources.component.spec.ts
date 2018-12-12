import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabDataSourcesComponent } from './tab-data-sources.component';

describe('DataSourcesComponent', () => {
  let component: TabDataSourcesComponent;
  let fixture: ComponentFixture<TabDataSourcesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabDataSourcesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabDataSourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
