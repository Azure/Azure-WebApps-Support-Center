import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateStorageAccountPanelComponent } from './create-storage-account-panel.component';

describe('CreateStorageAccountPanelComponent', () => {
  let component: CreateStorageAccountPanelComponent;
  let fixture: ComponentFixture<CreateStorageAccountPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateStorageAccountPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateStorageAccountPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
