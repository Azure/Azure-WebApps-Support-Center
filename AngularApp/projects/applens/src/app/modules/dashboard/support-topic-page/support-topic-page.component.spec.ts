import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportTopicPageComponent } from './support-topic-page.component';

describe('SupportTopicPageComponent', () => {
  let component: SupportTopicPageComponent;
  let fixture: ComponentFixture<SupportTopicPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SupportTopicPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportTopicPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
