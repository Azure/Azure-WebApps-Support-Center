import { Injectable } from '@angular/core';

@Injectable()
export class SearchService {
    public searchTerm: string = "";
    public resourceHomeOpen: boolean = false;
}
