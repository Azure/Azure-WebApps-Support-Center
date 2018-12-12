import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { OnboardingFlowComponent, DevelopMode } from '../../onboarding-flow/onboarding-flow.component';

@Component({
  selector: 'tab-develop',
  templateUrl: './tab-develop.component.html',
  styleUrls: ['./tab-develop.component.scss']
})
export class TabDevelopComponent implements OnInit {

  DevelopMode = DevelopMode;
  detectorId: string;

  constructor(private _route: ActivatedRoute) {
  }

  ngOnInit() {
    this.detectorId = this._route.parent.snapshot.params['detector'].toLowerCase();
  }

}
