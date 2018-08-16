import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VersionMessageComponent } from './version-message.component';

describe('VersionMessageComponent', () => {
  let component: VersionMessageComponent;
  let fixture: ComponentFixture<VersionMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VersionMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VersionMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
