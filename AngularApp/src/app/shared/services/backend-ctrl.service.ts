import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from '../../shared/services/cache.service';
import { AuthService } from '../../startup/services/auth.service';
import { StartupInfo } from '../../shared/models/portal';

@Injectable()
export class BackendCtrlService {

  public readonly localApiEndpoint: string = "http://localhost:62302/";

  constructor(private _http: Http, private _cacheService: CacheService, private _authService: AuthService) { }

  public get apiEndpoint(): string {
    return environment.production ? '' : this.localApiEndpoint;
  }

  public get<T>(path: string, headers: Headers = null, invalidateCache: boolean = false): Observable<T> {

    return this._authService.getStartupInfo().flatMap((startupInfo: StartupInfo) => {
      var url: string = `${this.apiEndpoint}${path}`;

      let request = this._http.get(url, {
        headers: this._getHeaders(startupInfo, headers)
      })
        .map((response: Response) => <T>(response.json()));

      return this._cacheService.get(path, request, invalidateCache);
    });
  }

  private _getHeaders(startupInfo: StartupInfo, additionalHeaders: Headers): Headers {
    var headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Authorization', `Bearer ${startupInfo.token}`);

    if (additionalHeaders) {
      additionalHeaders.forEach((val, name, temp) => {
        if (!headers.has(name)) {
          headers.append(name, val[0]);
        }
      });
    }
    return headers;
  }
}
