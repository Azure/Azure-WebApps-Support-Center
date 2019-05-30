import { TestBed } from '@angular/core/testing';

import { SupportTopicApiService } from './support-topic-api.service';

describe('SupportTopicApiService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SupportTopicApiService = TestBed.get(SupportTopicApiService);
    expect(service).toBeTruthy();
  });
});
