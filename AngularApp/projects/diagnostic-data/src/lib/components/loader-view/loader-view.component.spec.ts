import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderViewComponent } from './loader-view.component';

describe('LoaderViewComponent', () => {
  let component: LoaderViewComponent;
  let fixture: ComponentFixture<LoaderViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoaderViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
