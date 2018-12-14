import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Headers } from '@angular/http';
import { Communication } from 'diagnostic-data';
import { BackendCtrlService } from './backend-ctrl.service';
import { AuthService } from '../../startup/services/auth.service';
import { StartupInfo } from '../../shared/models/portal';
import { LoggingService } from '../../shared/services/logging/logging.service';
import { mergeMap, tap } from 'rxjs/operators';

@Injectable()
export class GenericCommsService {

  constructor(private _backendCtrlService: BackendCtrlService, private _authService: AuthService, private _logger: LoggingService) { }

  public getServiceHealthCommunications(): Observable<Communication[]> {

    return this._authService.getStartupInfo().pipe(
      mergeMap((startupInfo: StartupInfo) => {
        const additionalHeaders = new HttpHeaders({ 'x-ms-resource': startupInfo.resourceId });

        return this._backendCtrlService.get<Communication[]>(`api/comms`, additionalHeaders).pipe(tap((commList: Communication[]) => {
          const commAlert = commList.find((comm: Communication) => comm.isAlert === true);
          if (commAlert) {
            this._logger.LogAzureCommShown(commAlert.incidentId, commAlert.title, 'ServiceHealth', commAlert.isExpanded, commAlert.status === 0, commAlert.publishedTime);
          }
        }));
      })
    );
  }

  public openMoreDetails() {
  }
}
