import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AseFinderComponent } from './ase-finder.component';

describe('AseFinderComponent', () => {
  let component: AseFinderComponent;
  let fixture: ComponentFixture<AseFinderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AseFinderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AseFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
