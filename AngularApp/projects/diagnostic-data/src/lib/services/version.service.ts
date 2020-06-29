import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  public isLegacySub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public initializedPortalVersion: BehaviorSubject<string> = new BehaviorSubject<string>("v2");
  constructor() { }
}
