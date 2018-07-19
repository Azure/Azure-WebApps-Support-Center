import { WebHostingEnvironmentsModule } from './web-hosting-environments.module';

describe('WebHostingEnvironmentsModule', () => {
  let webHostingEnvironmentsModule: WebHostingEnvironmentsModule;

  beforeEach(() => {
    webHostingEnvironmentsModule = new WebHostingEnvironmentsModule();
  });

  it('should create an instance', () => {
    expect(webHostingEnvironmentsModule).toBeTruthy();
  });
});
