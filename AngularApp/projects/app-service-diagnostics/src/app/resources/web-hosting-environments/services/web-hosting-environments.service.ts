import { Injectable } from '@angular/core';
import { ResourceService } from '../../../shared-v2/services/resource.service';

@Injectable()
export class WebHostingEnvironmentsService extends ResourceService {
    public get searchSuffix(): string  {
        return 'App Service Environment';
    }

    public get azureServiceName(): string {
        return "ASE";
    }
}
