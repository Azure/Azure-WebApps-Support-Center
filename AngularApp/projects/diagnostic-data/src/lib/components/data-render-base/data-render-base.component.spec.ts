import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DataRenderBaseComponent } from './data-render-base.component';

describe('DataRenderBaseComponent', () => {
  let component: DataRenderBaseComponent;
  let fixture: ComponentFixture<DataRenderBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DataRenderBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataRenderBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
