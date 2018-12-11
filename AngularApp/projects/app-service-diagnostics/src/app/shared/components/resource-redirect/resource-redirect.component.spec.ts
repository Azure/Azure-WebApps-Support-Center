import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceRedirectComponent } from './resource-redirect.component';

describe('ResourceRedirectComponent', () => {
  let component: ResourceRedirectComponent;
  let fixture: ComponentFixture<ResourceRedirectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourceRedirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
