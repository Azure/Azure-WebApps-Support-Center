import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { GithubApiService } from '../../../shared/services/github-api.service';
import { DetectorResponse } from 'diagnostic-data';
import { QueryResponse } from 'diagnostic-data';
import { ResourceService } from '../../../shared/services/resource.service';
import { Package } from '../../../shared/models/package';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { NgxSmartModalService } from 'ngx-smart-modal';
import * as momentNs from 'moment';
import { DetectorControlService } from 'diagnostic-data';
import { Observable } from 'rxjs';
import { AdalService } from 'adal-angular4';

const moment = momentNs;

export enum DevelopMode {
  Create,
  Edit,
  EditMonitoring,
  EditAnalytics
}

@Component({
  selector: 'onboarding-flow',
  templateUrl: './onboarding-flow.component.html',
  styleUrls: ['./onboarding-flow.component.scss']
})
export class OnboardingFlowComponent implements OnInit, OnDestroy {

  @Input() mode: DevelopMode = DevelopMode.Create;
  @Input() detectorId: string = '';
  @Input() dataSource: string = '';
  @Input() timeRange: string = '';
  @Input() startTime: momentNs.Moment = moment.utc().subtract(1, 'days');
  @Input() endTime: momentNs.Moment =  moment.utc();

  DevelopMode = DevelopMode;

  hideModal: boolean = false;
  fileName: string;
  editorOptions: any;
  code: string;
  resourceId: string;
  queryResponse: QueryResponse<DetectorResponse>;
  errorState: any;
  buildOutput: string[];
  runButtonDisabled: boolean;
  publishButtonDisabled: boolean;
  localDevButtonDisabled: boolean;
  localDevText: string;
  localDevUrl: string;
  localDevIcon: string;
  devOptionsIcon: string;
  runButtonText: string;
  runButtonIcon: string;
  publishButtonText: string;

  modalPublishingButtonText: string;
  modalPublishingButtonDisabled: boolean;

  alertClass: string;
  alertMessage: string;
  showAlert: boolean;

  private publishingPackage: Package;
  private userName: string;

  private emailRecipients: string ='';

  constructor(private cdRef: ChangeDetectorRef, private githubService: GithubApiService, private diagnosticApiService: ApplensDiagnosticService, private resourceService: ResourceService,
    private _detectorControlService: DetectorControlService, private _adalService: AdalService, public ngxSmartModalService: NgxSmartModalService) {

    this.editorOptions = {
      theme: 'vs',
      language: 'csharp',
      fontSize: 14,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      },
      folding: true
    };

    this.buildOutput = [];
    this.localDevButtonDisabled = false;
    this.runButtonDisabled = false;
    this.publishButtonDisabled = true;
    this.localDevText = "Download Local Detector Package";
    this.localDevUrl ="";
    this.localDevIcon = "fa fa-download";
    this.devOptionsIcon = "fa fa-download";
    this.runButtonText = "Run";
    this.runButtonIcon = "fa fa-play";
    this.publishButtonText = "Publish";
    this.modalPublishingButtonText = "Publish";
    this.modalPublishingButtonDisabled = false;
    this.showAlert = false;

    this.userName = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    this.emailRecipients = this.userName.replace('@microsoft.com','');
  }

  ngOnInit() {
    this.resourceId = this.resourceService.getCurrentResourceId();
    this.hideModal = localStorage.getItem("localdevmodal.hidden") === "true";
    let detectorFile: Observable<string>;
    if (this.mode === DevelopMode.Create) {
      // CREATE FLOW
      detectorFile = this.githubService.getDetectorTemplate(this.resourceService.templateFileName);
      this.fileName = "new.csx";
      this.startTime = this._detectorControlService.startTime;
      this.endTime = this._detectorControlService.endTime;
    }
    else if (this.mode === DevelopMode.Edit) {
      // EDIT FLOW
      this.fileName = `${this.detectorId}.csx`;
      detectorFile = this.githubService.getDetectorFile(this.detectorId);
      this.startTime = this._detectorControlService.startTime;
      this.endTime = this._detectorControlService.endTime;
    }
    else if (this.mode === DevelopMode.EditMonitoring) {
      // SYSTEM MONITORING FLOW
      this.fileName = '__monitoring.csx';
      detectorFile = this.githubService.getDetectorFile("__monitoring");
    }
    else if (this.mode === DevelopMode.EditAnalytics) {
      // SYSTEM ANALYTICS FLOW
      this.fileName = '__analytics.csx';
      detectorFile = this.githubService.getDetectorFile("__analytics");
    }

    detectorFile.subscribe(code => {
      this.code = code;
      if (!this.hideModal)
      {
        this.ngxSmartModalService.getModal('devModeModal').open();
      }
    })
  }
  
  ngOnDestroy() {
    // TODO: Figure out saving capabilities
    //this.saveProgress();
  }

  saveProgress() {
    localStorage.setItem(`${this.detectorId}_code`, this.code);
  }

  retrieveProgress() {
    let savedCode: string = localStorage.getItem(`${this.detectorId}_code`)
    if (savedCode) {
      this.code = savedCode;
    }
  }

  deleteProgress() {
    localStorage.removeItem(`${this.detectorId}_code`);
  }

  ngAfterViewInit() {
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  getDevOptions() {
    this.ngxSmartModalService.getModal('devModeModal').open();
  }

  dismissDevModal() {
    // Set the default popped up behaviour of local development modal as a key value pair in localStorage
    localStorage.setItem("localdevmodal.hidden", this.hideModal === true ? "true" : "false");
    this.ngxSmartModalService.getModal('devModeModal').close();
  }

  downloadLocalDevTools() {
    this.localDevButtonDisabled = true;
    this.localDevText = "Preparing Local Tools";
    this.localDevIcon = "fa fa-circle-o-notch fa-spin";
    
    var body = {
      script: this.code
    };

    localStorage.setItem("localdevmodal.hidden", this.hideModal === true ? "true" : "false");

    this.diagnosticApiService.prepareLocalDevelopment(body, this.detectorId, this._detectorControlService.startTimeString, 
      this._detectorControlService.endTimeString, this.dataSource, this.timeRange)
    .subscribe((response: string) => {
      this.localDevButtonDisabled = false;
      this.localDevUrl = response;
      this.localDevText = "Download Local Development Package";
      this.localDevIcon = "fa fa-download";
     // window.open(response);

      var element = document.createElement('a');
      element.setAttribute('href', response);
      element.setAttribute('download', "Local Development Package");
  
      element.style.display = 'none';
      document.body.appendChild(element);
  
      element.click();
  
      document.body.removeChild(element);
    }
    , ((error: any) => {
      this.localDevButtonDisabled = false;
      this.publishingPackage = null;
      this.localDevText = "Something went wrong";
      this.localDevIcon = "fa fa-download";
    }));
  }
  
  runCompilation() {
    this.buildOutput = [];
    this.buildOutput.push("------ Build started ------");
    let currentCode = this.code;

    var body = {
      script: this.code
    };

    this.runButtonDisabled = true;
    this.publishButtonDisabled = true;
    this.localDevButtonDisabled = true;
    this.runButtonText = "Running";
    this.runButtonIcon = "fa fa-circle-o-notch fa-spin";

    let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;

    this.diagnosticApiService.getCompilerResponse(body, isSystemInvoker, this.detectorId, this._detectorControlService.startTimeString, 
        this._detectorControlService.endTimeString, this.dataSource, this.timeRange)
      .subscribe((response: QueryResponse<DetectorResponse>) => {

        this.queryResponse = response;
        this.runButtonDisabled = false;
        this.runButtonText = "Run";
        this.runButtonIcon = "fa fa-play";
        this.queryResponse.compilationOutput.compilationOutput.forEach(element => {
          this.buildOutput.push(element);
        });

        if (this.queryResponse.compilationOutput.compilationSucceeded === true) {
          this.publishButtonDisabled = false;
          this.preparePublishingPackage(this.queryResponse, currentCode);
          this.buildOutput.push("========== Build: 1 succeeded, 0 failed ==========");
        }
        else {
          this.publishButtonDisabled = true;
          this.publishingPackage = null;
          this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
        }

        if (this.queryResponse.runtimeSucceeded != null && this.queryResponse.runtimeSucceeded === false) {
          this.publishButtonDisabled = true;
        }
        this.localDevButtonDisabled = false;

      }, ((error: any) => {
        this.runButtonDisabled = false;
        this.publishingPackage = null;
        this.localDevButtonDisabled = false;
        this.runButtonText = "Run";
        this.runButtonIcon = "fa fa-play";
        this.buildOutput.push("Something went wrong during detector invocation.");
        this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
      }));
  }

  confirmPublish() {
    if (!this.publishButtonDisabled) {
      this.ngxSmartModalService.getModal('publishModal').open();
    }
  }

  publish() {

    if (!this.publishingPackage || this.publishingPackage.codeString === '' || this.publishingPackage.id === '' || this.publishingPackage.dllBytes === '') {
      return;
    }

    this.publishButtonDisabled = true;
    this.runButtonDisabled = true;
    this.modalPublishingButtonDisabled = true;
    this.modalPublishingButtonText = "Publishing";

    this.diagnosticApiService.publishDetector(this.emailRecipients, this.publishingPackage).subscribe(data => {
      this.deleteProgress();
      this.runButtonDisabled = false;
      this.localDevButtonDisabled = false;
      this.publishButtonText = "Publish";
      this.modalPublishingButtonDisabled = false;
      this.modalPublishingButtonText = "Publish";
      this.ngxSmartModalService.getModal('publishModal').close();
      this.showAlertBox('alert-success', 'Detector published successfully. Changes will be live shortly.');
    }, err => {
      this.runButtonDisabled = false;
      this.localDevButtonDisabled = false;
      this.publishButtonText = "Publish";
      this.modalPublishingButtonDisabled = false;
      this.modalPublishingButtonText = "Publish";
      this.ngxSmartModalService.getModal('publishModal').close();
      this.showAlertBox('alert-dander', 'Publishing failed. Please try again after some time.');
    });
  }

  private preparePublishingPackage(queryResponse: QueryResponse<DetectorResponse>, code: string) {

    if (queryResponse.invocationOutput.metadata.author !== null && queryResponse.invocationOutput.metadata.author !== "" && this.emailRecipients.indexOf(queryResponse.invocationOutput.metadata.author) < 0)
    {
        this.emailRecipients +=  ';' + queryResponse.invocationOutput.metadata.author;
    }
    
    this.publishingPackage = {
      codeString: code,
      id: queryResponse.invocationOutput.metadata.id,
      dllBytes: queryResponse.compilationOutput.assemblyBytes,
      pdbBytes: queryResponse.compilationOutput.pdbBytes,
      committedByAlias: this.userName
    };
  }

  private showAlertBox(alertClass: string, message: string) {
    this.alertClass = alertClass;
    this.alertMessage = message;
    this.showAlert = true;
  }

  private hideAlertBox() {
    this.showAlert = false;
    this.alertClass = '';
    this.alertMessage = '';
  }
}
