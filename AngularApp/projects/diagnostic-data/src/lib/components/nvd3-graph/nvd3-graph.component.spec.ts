import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Nvd3GraphComponent } from './nvd3-graph.component';

describe('Nvd3GraphComponent', () => {
  let component: Nvd3GraphComponent;
  let fixture: ComponentFixture<Nvd3GraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Nvd3GraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Nvd3GraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
