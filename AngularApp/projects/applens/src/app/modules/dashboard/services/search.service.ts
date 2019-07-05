import { Injectable} from '@angular/core';
import {ApplensDiagnosticService} from './applens-diagnostic.service';
import { DetectorItem } from '../search-results/search-results.component';
import {AdalService} from 'adal-angular4';
import {forkJoin, of} from 'rxjs';
import { map, catchError} from 'rxjs/operators';

@Injectable()
export class SearchService {
    public searchIsEnabled: boolean = false;
    public searchTerm: string = "";
    public currentSearchTerm: string = "";
    public searchId: string = "";
    public resourceHomeOpen: boolean = false;
    public newSearch: boolean = false;
    public detectors: DetectorItem[] = [];
    
    constructor(private _applensDiagnosticService: ApplensDiagnosticService, private _adalService: AdalService){
        let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
        let userId = alias.replace('@microsoft.com', '').toLowerCase();
        let hasTestersAccess = this._applensDiagnosticService.getHasTestersAccess(userId).pipe(map((res) => res), catchError(e => of(false)));
        let isEnabledForProductId = this._applensDiagnosticService.getSearchEnabledForProductId().pipe(map((res) => res), catchError(e => of(false)));
        forkJoin([hasTestersAccess, isEnabledForProductId]).subscribe(enabledFlags => {
            this.searchIsEnabled = enabledFlags[0] && enabledFlags[1];
        });
    }

    ngOnInit(){
    }
}
