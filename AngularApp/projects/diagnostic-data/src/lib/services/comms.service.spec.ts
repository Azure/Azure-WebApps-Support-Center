import { TestBed, inject } from '@angular/core/testing';

import { CommsService } from './comms.service';

describe('CommsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommsService]
    });
  });

  it('should be created', inject([CommsService], (service: CommsService) => {
    expect(service).toBeTruthy();
  }));
});
