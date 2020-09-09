import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpErrorResponse} from "@angular/common/http"
import { Observable, from, throwError } from 'rxjs';
import {catchError, tap} from "rxjs/operators";
import { v4 as uuid } from 'uuid';
import { Query } from '../models/query';
import { SearchResults } from '../models/search-results';



@Injectable({
  providedIn:"root"
})
export class FetchDocumentsService {
  url = "https://documentssearch-api.azurewebsites.net/api/search/query";
    
  readonly authKey = "9AAA9962-47A5-4F27-9A7F-007DF748CF88";
  readonly headers = new HttpHeaders({
    "Content-Type" : "application/json",
    "authKey" : this.authKey
  });

  data = {
    "searchID" : uuid(),
    "searchTerm" : "",
    "productName" : "App Services",
    "documentType" : "Internal",
    "documentSource" : [],
    "numberOfDocuments" : 5
    }

    
  constructor(private http: HttpClient) { 
        
  }

  readonly httpOptions = {
    headers: new HttpHeaders({
      "Content-Type" : "application/json",
      "authKey" : "9AAA9962-47A5-4F27-9A7F-007DF748CF88"
    })//,
    //observe: 'response' as 'body'
  };
  
  dummyMethod(){
    return "Hello World"
  }

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
    //this.data.searchTerm = searchQuery

    //let q : Query = this.data;
    console.log("query")
    console.log(query);
    let queryString = this.constructUrl(query);
    console.log(queryString)
    let url = this.url  + "?" +queryString;
    return this.http.get<SearchResults>(url, this.httpOptions)
                  
                    /*.pipe(
                      tap(data => console.log("okay")),
                      catchError(this.handleError)
                    )*/
  }

private handleError (err : HttpErrorResponse){
  console.log(err)
  return throwError(err)
}

}
