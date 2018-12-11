import { ResourcesModule } from './resources.module';

describe('ResourcesModule', () => {
  let resourcesModule: ResourcesModule;

  beforeEach(() => {
    resourcesModule = new ResourcesModule();
  });

  it('should create an instance', () => {
    expect(resourcesModule).toBeTruthy();
  });
});
