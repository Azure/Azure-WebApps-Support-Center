import { Component, OnInit } from '@angular/core';
import { DevelopMode } from '../onboarding-flow/onboarding-flow.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'gist',
  templateUrl: './gist.component.html',
  styleUrls: ['./gist.component.scss']
})
export class GistComponent implements OnInit {
  DevelopMode = DevelopMode;

  constructor(private _route: ActivatedRoute) {
  }

  ngOnInit() {
  }
}
