import { Component, OnInit } from '@angular/core';
import { NgxSmartModalService } from 'ngx-smart-modal';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { GithubApiService } from '../../../shared/services/github-api.service';

@Component({
  selector: 'configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss', '../onboarding-flow/onboarding-flow.component.scss']
})
export class ConfigurationComponent implements OnInit {
    editorOptions: any;
    code:string;
    showAlert:boolean;
    alertClass: string;
    alertMessage: string;
    codeLoaded: boolean = false;

  constructor(public ngxSmartModalService: NgxSmartModalService, private _diagnosticService: ApplensDiagnosticService, private githubService: GithubApiService) {
    this.editorOptions = {
        theme: 'vs',
        language: 'json',
        fontSize: 14,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: {
          enabled: false
        },
        folding: true
      };
      this.showAlert = false;
  }

  ngOnInit() {
      this._diagnosticService.getKustoMappings().subscribe(resp => {
        this.codeLoaded = true;
        this.code = JSON.stringify(resp, null, 2);
      }, (error: any) => {
        console.log(error);
        var kustoMappingsTemplate = this.githubService.getTemplateWithExtension("Kusto_Mapping", "json").subscribe(resp => {
          this.code = resp;
        }, (error: any) => {
          this.showAlertBox("alert-danger", "Failed to get kusto mapping template. Please try again after some time.");
        });
      });
  }

  confirmSave()  {
    this.ngxSmartModalService.getModal('saveModal').open();
  }

  saveConfig() {
      this._diagnosticService.createOrUpdateKustoMappings(this.code).subscribe(resp => {
        this.ngxSmartModalService.getModal('saveModal').close();
        this.showAlertBox("alert-success", "Kusto mappings saved successfully.");
      }, (error: any) => {
        this.ngxSmartModalService.getModal('saveModal').close();
        this.showAlertBox("alert-danger", "Saving kusto mappings failed. Please try again after some time.");
      });
  }

  private showAlertBox(alertClass: string, message: string) {
    this.alertClass = alertClass;
    this.alertMessage = message;
    this.showAlert = true;
  }

}
