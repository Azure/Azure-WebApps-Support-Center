import {map,  mergeMap, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, Subject, ReplaySubject  } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ResourceService } from './resource.service';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import {globalExcludedSites} from "diagnostic-data";

@Injectable()
export class ContentService {

  content: any[] = [];

  private ocpApimKeySubject: Subject<string> = new ReplaySubject<string>(1);
  private ocpApimKey: string = '';
  private allowedStacks: string[] = ["net", "net core", "asp", "php", "python", "node", "docker", "java", "tomcat", "kube", "ruby", "dotnet", "static"];
  
  constructor(private _http: HttpClient, private _resourceService: ResourceService, private _backendApi: BackendCtrlService) { 

    this._backendApi.get<string>(`api/appsettings/ContentSearch:Ocp-Apim-Subscription-Key`).subscribe((value: string) =>{
      this.ocpApimKey = value;
      this.ocpApimKeySubject.next(value);
    });
  }

  getContent(searchString?: string): Observable<any[]> {
    const searchResults = searchString ? this.content.filter(article => {
      return article.title.indexOf(searchString) != -1
        || article.description.indexOf(searchString) != -1;
    }) : this.content;

    return of(searchResults);
  }

  searchWeb(questionString: string, resultsCount: string = '3', useStack: boolean = true, preferredSites: string[] = [], excludedSites: string[] = globalExcludedSites): Observable<any> {

    const searchSuffix = this._resourceService.searchSuffix;

    //Decide the stack type to use with query
    var stackTypeSuffix = this._resourceService["appStack"]? ` ${this._resourceService["appStack"]}`: "";
    stackTypeSuffix = stackTypeSuffix.toLowerCase();
    if (stackTypeSuffix && stackTypeSuffix.length>0 && stackTypeSuffix == "static only") {
      stackTypeSuffix = "static content";
    }
    if(!this.allowedStacks.some(stack => stackTypeSuffix.includes(stack))){
      stackTypeSuffix = "";
    }

    var preferredSitesSuffix = preferredSites.map(site => `site:${site}`).join(" OR ");
    if (preferredSitesSuffix && preferredSitesSuffix.length>0){
      preferredSitesSuffix = ` AND (${preferredSitesSuffix})`;
    }
    
    var excludedSitesSuffix = excludedSites.map(site => `NOT (site:${site})`).join(" AND ");
    if (excludedSitesSuffix && excludedSitesSuffix.length>0){
      excludedSitesSuffix = ` AND (${excludedSitesSuffix})`;
    }

    const query = encodeURIComponent(`${questionString}${useStack? stackTypeSuffix: ''} AND ${searchSuffix}${preferredSitesSuffix}${excludedSitesSuffix}`);
    const url = `https://api.cognitive.microsoft.com/bing/v7.0/search?q='${query}'&count=${resultsCount}`;

    return this.ocpApimKeySubject.pipe(mergeMap((key:string)=>{
      return this._http.get(url, {
          headers: {
            "Content-Type": "application/json",
            "Ocp-Apim-Subscription-Key": this.ocpApimKey
          }
        })
      })
    );
  }
}

export interface SearchResults {
  queryContext: { originalQuery: string };
}


