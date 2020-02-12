import { Injectable } from '@angular/core';
import { Observable, of, Subject, ReplaySubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ResourceService } from './resource.service';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import { mergeMap } from 'rxjs/operators';

@Injectable()
export class ContentService {

  content: any[] = [
    // {
    //   title: 'Tutorial: Bind an existing custom SSL certificate to Azure Web Apps',
    //   description: 'Azure Web Apps provides a highly scalable, self-patching web hosting service. This tutorial shows you how to bind a custom SSL certificate that you purchased from a trusted certificate authority to Azure Web Apps. When you\'re finished, you\'ll be able to access your web app at the HTTPS endpoint of your custom DNS domain.',
    //   link: 'https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-ssl'
    // },
    // {
    //   title: 'Buy and Configure an SSL Certificate for your Azure App Service',
    //   description: 'This tutorial shows you how to secure your web app by purchasing an SSL certificate for your Azure App Service, securely storing it in Azure Key Vault, and associating it with a custom domain.',
    //   link: 'https://docs.microsoft.com/en-us/azure/app-service/web-sites-purchase-ssl-web-site'
    // }
  ];

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

  searchWeb(questionString: string, resultsCount: string = '3', useStack: boolean = true, preferredSites: string[] = []): Observable<any> {

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
    const query = encodeURIComponent(`${questionString}${useStack? stackTypeSuffix: ''} AND ${searchSuffix}${preferredSitesSuffix}`);
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
