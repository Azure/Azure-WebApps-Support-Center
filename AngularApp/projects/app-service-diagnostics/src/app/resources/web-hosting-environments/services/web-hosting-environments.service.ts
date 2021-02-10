import { Injectable } from '@angular/core';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import {of, Observable} from "rxjs";

@Injectable()
export class WebHostingEnvironmentsService extends ResourceService {
    public get searchSuffix(): string  {
        return 'App Service Environment';
    }

    public get azureServiceName(): string {
        return "ASE";
    }

    public getPesId(): Observable<string> {
        return of("16533");
    }

    public getAseVersion(): Observable<string> {
        return of(this.resource.kind);
    }
}
