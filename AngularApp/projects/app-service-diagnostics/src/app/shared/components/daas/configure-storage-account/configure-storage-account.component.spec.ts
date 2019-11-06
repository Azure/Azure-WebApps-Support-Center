import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureStorageAccountComponent } from './configure-storage-account.component';

describe('ConfigureStorageAccountComponent', () => {
  let component: ConfigureStorageAccountComponent;
  let fixture: ComponentFixture<ConfigureStorageAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureStorageAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureStorageAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
