import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpErrorResponse} from "@angular/common/http"
import { Observable, from, throwError } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Query } from '../models/query';
import { SearchResults } from '../models/search-results';

@Injectable({
  providedIn:"root"
})
export class FetchDocumentsService {
  url = "https://documents-search.azurefd.net/api/search/query";
   
  
  constructor(private http: HttpClient) { 
        
  }
  
  readonly authKey = "9AAA9962-47A5-4F27-9A7F-007DF748CF88";
  
  readonly httpOptions = {
    headers: new HttpHeaders({
      "Content-Type" : "application/json",
      "authKey" : this.authKey
    })
  };
  
  
  constructUrl(query: Query) : string{
    let  queryString = Object.keys(query).map(key => {
      if(typeof (query[key] ) === "object" ){
        return query[key].map( value => {
          if (value != "")
            return key + "=" + value
          }).join("&");
      }
      else
        return key + '=' + query[key]
    }).join("&");
    
    return queryString;
  }

  Search(query): Observable<SearchResults> {    
    let queryString = this.constructUrl(query);
    
    let url = this.url  + "?" +queryString;
    return this.http.get<SearchResults>(url, this.httpOptions)
                  
  }

}
