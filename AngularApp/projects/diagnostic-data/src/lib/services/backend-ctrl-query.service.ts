import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendCtrlQueryService {

  constructor() { }

  public get<T>(path: string, headers: HttpHeaders = null, invalidateCache: boolean = false): Observable<T> {
    return null;
  }
}
