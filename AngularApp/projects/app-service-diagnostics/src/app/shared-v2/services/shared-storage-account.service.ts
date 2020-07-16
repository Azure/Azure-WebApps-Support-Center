import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { StorageAccount } from '../../shared/models/storage';


@Injectable({
  providedIn: 'root'
})
export class SharedStorageAccountService {

  // Observable string sources
  private emitChangeSource = new Subject<StorageAccount>();
  
  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();
  
  // Service message commands
  emitChange(change: StorageAccount) {
    this.emitChangeSource.next(change);
  }
}
