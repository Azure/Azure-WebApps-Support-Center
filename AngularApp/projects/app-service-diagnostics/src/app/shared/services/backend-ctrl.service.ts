
import { mergeMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from '../../shared/services/cache.service';
import { AuthService } from '../../startup/services/auth.service';
import { StartupInfo } from '../../shared/models/portal';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class BackendCtrlService {

  constructor(private _http: HttpClient, private _cacheService: CacheService, private _authService: AuthService) { }

  public get apiEndpoint(): string {
    return environment.backendHost;
  }

  public get<T>(path: string, headers: HttpHeaders = null, invalidateCache: boolean = false): Observable<T> {

    return this._authService.getStartupInfo().pipe(
      mergeMap((startupInfo: StartupInfo) => {
        var url: string = `${this.apiEndpoint}${path}`;

        let request = this._http.get(url, {
          headers: this._getHeaders(startupInfo, headers)
        });

        return this._cacheService.get(path, request, invalidateCache);
      }));
  }

  private _getHeaders(startupInfo: StartupInfo, additionalHeaders: HttpHeaders): HttpHeaders {
    var headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${startupInfo.token}`
    });

    if (additionalHeaders) {
      additionalHeaders.keys().forEach(key => {
        if (!headers.has(key)) {
          headers = headers.set(key, additionalHeaders.get(key))
        }
      });
    }
    return headers;
  }
}
