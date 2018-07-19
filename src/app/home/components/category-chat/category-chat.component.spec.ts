import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryChatComponent } from './category-chat.component';

describe('CategoryChatComponent', () => {
  let component: CategoryChatComponent;
  let fixture: ComponentFixture<CategoryChatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CategoryChatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
