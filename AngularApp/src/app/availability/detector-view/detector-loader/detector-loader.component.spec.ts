import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorLoaderComponent } from './detector-loader.component';

describe('DetectorLoaderComponent', () => {
  let component: DetectorLoaderComponent;
  let fixture: ComponentFixture<DetectorLoaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetectorLoaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
