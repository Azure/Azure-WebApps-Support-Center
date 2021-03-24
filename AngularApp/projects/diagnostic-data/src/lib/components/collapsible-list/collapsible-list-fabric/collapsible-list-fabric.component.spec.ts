import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CollapsibleListFabricComponent } from './collapsible-list-fabric.component';

describe('CollapsibleListFabricComponent', () => {
  let component: CollapsibleListFabricComponent;
  let fixture: ComponentFixture<CollapsibleListFabricComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CollapsibleListFabricComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollapsibleListFabricComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
