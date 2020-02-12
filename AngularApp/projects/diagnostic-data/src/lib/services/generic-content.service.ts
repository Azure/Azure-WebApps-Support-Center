import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

@Injectable()
export class GenericContentService {

  public getContent(searchString?: string): Observable<any[]> {
    return null;
  }

  public searchWeb(questionString: string, resultsCount: string = '3', useStack: boolean = true, preferredSites: string[] = []): Observable<any> {
    return null;
  }
}
