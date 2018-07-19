import { SharedV2Module } from './shared-v2.module';

describe('SharedV2Module', () => {
  let sharedV2Module: SharedV2Module;

  beforeEach(() => {
    sharedV2Module = new SharedV2Module();
  });

  it('should create an instance', () => {
    expect(sharedV2Module).toBeTruthy();
  });
});
