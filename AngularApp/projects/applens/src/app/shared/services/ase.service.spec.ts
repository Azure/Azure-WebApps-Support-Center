import { TestBed, inject } from '@angular/core/testing';

import { AseService } from './ase.service';

describe('AseService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AseService]
    });
  });

  it('should be created', inject([AseService], (service: AseService) => {
    expect(service).toBeTruthy();
  }));
});
