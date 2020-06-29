import { Component, OnInit } from '@angular/core';
import { SearchService } from '../services/search.service';
import { Location } from '@angular/common';

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  constructor(public _searchService: SearchService, private _location: Location) {
  }

  navigateBack() {
    this._location.back();
  }

  ngOnInit() {
  }
}