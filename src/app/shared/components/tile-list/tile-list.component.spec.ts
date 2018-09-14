import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TileListComponent } from './tile-list.component';

describe('TileListComponent', () => {
  let component: TileListComponent;
  let fixture: ComponentFixture<TileListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TileListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TileListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
