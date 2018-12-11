import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiagnosticDataComponent } from './diagnostic-data.component';

describe('DiagnosticDataComponent', () => {
  let component: DiagnosticDataComponent;
  let fixture: ComponentFixture<DiagnosticDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiagnosticDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
