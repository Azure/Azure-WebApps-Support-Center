import { GenericArmResourcesModule } from './generic-arm-resources.module';

describe('GenericArmResourcesModule', () => {
  let genericArmResourcesModule: GenericArmResourcesModule;

  beforeEach(() => {
    genericArmResourcesModule = new GenericArmResourcesModule();
  });

  it('should create an instance', () => {
    expect(genericArmResourcesModule).toBeTruthy();
  });
});
