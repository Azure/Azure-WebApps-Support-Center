import { Injectable } from '@angular/core';
import { ArmService } from './arm.service';
import { UriElementsService } from './urielements.service';
import { Observable } from 'rxjs';
import { map} from 'rxjs/operators';
import { ResponseMessageCollectionEnvelope, ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { StorageAccount, StorageKeys, NewStorageAccount } from '../models/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private _armClient: ArmService, private _uriElementsService: UriElementsService) { }
  private apiVersion: string = "2019-06-01";

  getStorageAccounts(subscriptionId: string): Observable<StorageAccount[]> {
    let url = this._uriElementsService.getStorageAccountsUrl(subscriptionId);
    return this._armClient.getResource<any>(url, this.apiVersion).pipe(
      map((response: ResponseMessageCollectionEnvelope<any>) =>
        response.value.map((item: ResponseMessageEnvelope<any>) => {
          let account = new StorageAccount();
          account.id = item.id;
          account.kind = item.kind;
          account.location = item.location;
          account.name = item.name;
          account.type = item.type;
          return account;
        })));
  }

  getStorageAccountKey(storageAccountId: string): Observable<StorageKeys> {
    let url = this._uriElementsService.getStorageAccountKeyUrl(storageAccountId);
    return this._armClient.postResourceWithoutEnvelope<StorageKeys, any>(url, null, this.apiVersion).pipe(
      map((response: StorageKeys) => {
        return response;
      }));
  }

  createStorageAccount(subscriptionId: string, resourceGroupName: string, accountName: string, location: string): Observable<any> {
    let url = this._uriElementsService.createStorageAccountsUrl(subscriptionId, resourceGroupName, accountName.toLowerCase());
    let requestBody = new NewStorageAccount();
    requestBody.location = location;
    return this._armClient.putResourceWithoutEnvelope<any, NewStorageAccount>(url, requestBody, this.apiVersion)
      .pipe(map(response => {
        return response;
      }));
  }


}
