import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicDataComponent } from './dynamic-data.component';

describe('DynamicDataComponent', () => {
  let component: DynamicDataComponent;
  let fixture: ComponentFixture<DynamicDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DynamicDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
