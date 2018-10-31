import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { Headers } from '@angular/http';
import { Communication } from 'applens-diagnostics/src/app/diagnostic-data/models/communication';
import { BackendCtrlService } from './backend-ctrl.service';
import { AuthService } from '../../startup/services/auth.service';
import { StartupInfo } from '../../shared/models/portal';
import { LoggingService } from '../../shared/services/logging/logging.service';

@Injectable()
export class GenericCommsService {

  constructor(private _backendCtrlService: BackendCtrlService, private _authService: AuthService, private _logger: LoggingService) { }

  public getServiceHealthCommunications(): Observable<Communication[]> {

    return this._authService.getStartupInfo().flatMap((startupInfo: StartupInfo) => {
      var additionalHeaders = new Headers();
      additionalHeaders.append('x-ms-resource', startupInfo.resourceId);
      
      return this._backendCtrlService.get<Communication[]>(`api/comms`, additionalHeaders).do((commList: Communication[]) => {
        let commAlert = commList.find((comm: Communication) => comm.isAlert === true);
        if (commAlert) {
          this._logger.LogAzureCommShown(commAlert.incidentId, commAlert.title, 'ServiceHealth', commAlert.isExpanded, commAlert.status === 0, commAlert.publishedTime);
        }
      });
    });
  }

  public openMoreDetails() {
  }
}
