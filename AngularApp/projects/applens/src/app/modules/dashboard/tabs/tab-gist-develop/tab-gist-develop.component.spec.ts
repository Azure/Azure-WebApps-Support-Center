import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabGistDevelopComponent } from './tab-gist-develop.component';

describe('TabGistDevelopComponent', () => {
  let component: TabGistDevelopComponent;
  let fixture: ComponentFixture<TabGistDevelopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabGistDevelopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabGistDevelopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
