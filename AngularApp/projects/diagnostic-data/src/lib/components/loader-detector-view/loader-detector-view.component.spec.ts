import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LoaderDetectorViewComponent } from './loader-detector-view.component';

describe('LoaderDetectorViewComponent', () => {
  let component: LoaderDetectorViewComponent;
  let fixture: ComponentFixture<LoaderDetectorViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LoaderDetectorViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderDetectorViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
