import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { SearchResults } from 'projects/app-service-diagnostics/src/app/shared-v2/models/search-results';
import { Query } from 'projects/app-service-diagnostics/src/app/shared-v2/models/query';


@Injectable()
export class FetchDocumentsService {

  public Search(query: Query):  Observable<SearchResults> {
    return null;
  }
}
