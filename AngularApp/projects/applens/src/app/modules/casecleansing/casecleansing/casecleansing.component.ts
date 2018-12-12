import { Component, OnInit } from '@angular/core';
import { CaseCleansingApiService, CaseSimple } from '../../../shared/services/casecleansing-api.service'
import { NgxSmartModalService } from 'ngx-smart-modal';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'casecleansing',
  templateUrl: './casecleansing.component.html',
  styleUrls: ['./casecleansing.component.scss']
})
export class CaseCleansingComponent implements OnInit {
  public cases : CaseSimple[];
  public content : any;
  public contentJSON : string;
  public selectedCase : CaseSimple;
  public showProgress : boolean = false;
  public activeIncident : any;
  public caseCleansingForm = new FormGroup({
    select: new FormControl(''),
    other: new FormControl('')
  });

  constructor(private caseCleansingService: CaseCleansingApiService, public ngxSmartModalService: NgxSmartModalService) { 
    this.getAllCases();
    this.activeIncident = {
      title: "...",
      recommendation: "...",
      rule: "..."
    };
  }

  private async getAllCases() {
    this.cases = await this.caseCleansingService.GetAllCases().toPromise();
  }

  private async getDetails(incidentID:string) {
    this.activeIncident = {
      title: "...",
      recommendation: "...",
      rule: "..."
    }
    this.contentJSON = undefined;
    this.content = undefined;
    this.showProgress = true;
    this.caseCleansingForm.reset();
    this.caseCleansingForm.updateValueAndValidity();
    this.caseCleansingForm.controls['select'].setValue("");

    this.ngxSmartModalService.getModal('infoModal').open();

    this.content = await this.caseCleansingService.GetCaseDetails(this.selectedCase.incidentId).toPromise();
    
    this.activeIncident.title = this.content.kustoData.Incidents_Title;
    this.activeIncident.recommendation = this.content.recommendations[0].recommendedClosedAgainst;
    this.activeIncident.rule = this.content.recommendations[0].ruleName;

    this.showProgress = false;
  }

  public async toggleDebugInformation() {
    if (!this.contentJSON) {
      this.contentJSON = "Rule Name: " + this.activeIncident.rule + "\n" + JSON.stringify(this.content, null, 2);
    } else {
      this.contentJSON = undefined;
    }
  }

  public onSelect(caseIn : CaseSimple) {
      this.selectedCase = caseIn;
      this.getDetails(this.selectedCase.incidentId);
  }

  public async onSubmit() {
    let closeReason :string = this.caseCleansingForm.value.select;
    if (closeReason === "other") {
      closeReason = "Other: " + this.caseCleansingForm.value.other;
    }
    this.showProgress = true;
    let result = await this.caseCleansingService.CloseCase(this.selectedCase.incidentId, closeReason).toPromise();
    this.showProgress = false;
    if (result) {
      this.ngxSmartModalService.getModal('infoModal').close();
      this.cases.splice(this.cases.indexOf(this.selectedCase), 1);
    } else {
      alert("there was an error updating this case");
    }
  }

  public onSelectChange(args) {
    let selectValue = args.target.value; 
    let otherControl = this.caseCleansingForm.get("other") as FormControl;
    if (selectValue === 'other') {
      otherControl.setValidators([Validators.required])
    } else {
      otherControl.clearValidators();
    }
    otherControl.updateValueAndValidity();
  }


  ngOnInit() {
  }

}
