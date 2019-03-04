import { Component, OnInit, Input, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { GithubApiService } from '../../../shared/services/github-api.service';
import { DetectorResponse } from 'diagnostic-data';
import { QueryResponse } from 'diagnostic-data';
import { CompilationProperties } from 'diagnostic-data';
import { ResourceService } from '../../../shared/services/resource.service';
import { Package } from '../../../shared/models/package';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { NgxSmartModalService } from 'ngx-smart-modal';
import * as momentNs from 'moment';
import { DetectorControlService } from 'diagnostic-data';
import { Observable, of, forkJoin, BehaviorSubject } from 'rxjs';
import { AdalService } from 'adal-angular4';
import { flatMap, map } from 'rxjs/operators';

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
  @Input() id: string = '';
  @Input() dataSource: string = '';
  @Input() timeRange: string = '';
  @Input() startTime: momentNs.Moment = moment.utc().subtract(1, 'days');
  @Input() endTime: momentNs.Moment = moment.utc();
  @Input() gistMode: boolean = false;

  DevelopMode = DevelopMode;

  hideModal: boolean = false;
  fileName: string;
  editorOptions: any;
  code: string;
  reference: object = {};
  configuration: object = {};
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
  gists: string[] = [];
  selectedGist: string = '';
  temporarySelection: object = {};

  modalPublishingButtonText: string;
  modalPublishingButtonDisabled: boolean;

  alertClass: string;
  alertMessage: string;
  showAlert: boolean;

  compilationPackage: CompilationProperties;

  initialized = false;

  private publishingPackage: Package;
  private userName: string;

  private emailRecipients: string = '';

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
    this.localDevUrl = "";
    this.localDevIcon = "fa fa-download";
    this.devOptionsIcon = "fa fa-download";
    this.runButtonText = "Run";
    this.runButtonIcon = "fa fa-play";
    this.publishButtonText = "Publish";
    this.modalPublishingButtonText = "Publish";
    this.modalPublishingButtonDisabled = false;
    this.showAlert = false;

    this.userName = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    this.emailRecipients = this.userName.replace('@microsoft.com', '');
  }

  ngOnInit() {
    if (!this.initialized) {
      this.initialize();
      this.initialized = true;
    }
  }

  ngOnChanges() {
    if (this.initialized) {
      this.initialize();
    }
  }

  ngOnDestroy() {
    // TODO: Figure out saving capabilities
    //this.saveProgress();
  }

  gistVersionChange(event: string) {
    this.temporarySelection[this.selectedGist] = event;
  }

  confirm() {
    Object.keys(this.temporarySelection).forEach(id => {
      if (this.temporarySelection[id]['version'] !== this.configuration['dependencies'][id]) {
        this.configuration['dependencies'][id] = this.temporarySelection[id]['version'];
        this.reference[id] = this.temporarySelection[id]['code'];
      }
    });

    this.ngxSmartModalService.getModal('packageModal').close();
  }

  cancel() {
    this.selectedGist = '';
    this.temporarySelection = {};
    this.ngxSmartModalService.getModal('packageModal').close();
  }

  managePackage() {
    this.gists = Object.keys(this.configuration['dependencies']);
    this.selectedGist = '';
    this.temporarySelection = {};

    this.gists.forEach(g => this.temporarySelection[g] = { version: this.configuration['dependencies'][g], code: '' });

    this.ngxSmartModalService.getModal('packageModal').open();
  }

  saveProgress() {
    localStorage.setItem(`${this.id}_code`, this.code);
  }

  retrieveProgress() {
    let savedCode: string = localStorage.getItem(`${this.id}_code`)
    if (savedCode) {
      this.code = savedCode;
    }
  }

  deleteProgress() {
    localStorage.removeItem(`${this.id}_code`);
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

    this.diagnosticApiService.prepareLocalDevelopment(body, this.id, this._detectorControlService.startTimeString,
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
      script: this.code,
      references: this.reference,
      entityType: this.gistMode ? 'gist' : 'signal'
    };

    this.runButtonDisabled = true;
    this.publishButtonDisabled = true;
    this.localDevButtonDisabled = true;
    this.runButtonText = "Running";
    this.runButtonIcon = "fa fa-circle-o-notch fa-spin";

    let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;

    this.diagnosticApiService.getCompilerResponse(body, isSystemInvoker, this.id, this._detectorControlService.startTimeString,
      this._detectorControlService.endTimeString, this.dataSource, this.timeRange, {
        scriptETag: this.compilationPackage.scriptETag,
        assemblyName: this.compilationPackage.assemblyName,
        getFullResponse: true
      })
      .subscribe((response: any) => {
        this.queryResponse = response.body;
        this.runButtonDisabled = false;
        this.runButtonText = "Run";
        this.runButtonIcon = "fa fa-play";
        this.queryResponse.compilationOutput.compilationTraces.forEach(element => {
          this.buildOutput.push(element);
        });
        // If the script etag returned by the server does not match the previous script-etag, update the values in memory
        if (response.headers.get('diag-script-etag') != undefined && this.compilationPackage.scriptETag !== response.headers.get('diag-script-etag')) {
          this.compilationPackage.scriptETag = response.headers.get('diag-script-etag');
          this.compilationPackage.assemblyName = this.queryResponse.compilationOutput.assemblyName;
          this.compilationPackage.assemblyBytes = this.queryResponse.compilationOutput.assemblyBytes;
          this.compilationPackage.pdbBytes = this.queryResponse.compilationOutput.pdbBytes;
        }
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

        if ((!this.gistMode && this.queryResponse.runtimeSucceeded != null && this.queryResponse.runtimeSucceeded === false) ||
          (this.gistMode && this.queryResponse.compilationOutput != null && this.queryResponse.compilationOutput.compilationSucceeded === false)) {
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
    if (!this.publishingPackage ||
      this.publishingPackage.codeString === '' ||
      this.publishingPackage.id === '' ||
      this.publishingPackage.dllBytes === '') {
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

  private UpdateConfiguration(queryResponse: QueryResponse<DetectorResponse>) {
    let temp = {};
    let newPackage = [];
    let ids = new Set(Object.keys(this.configuration['dependencies']));
    queryResponse.compilationOutput.references.forEach(r => {
      if (ids.has(r)) {
        temp[r] = this.configuration['dependencies'][r];
      } else {
        newPackage.push(r);
      }
    });

    this.configuration['dependencies'] = temp;
    this.configuration['id'] = queryResponse.invocationOutput.metadata.id;
    this.configuration['name'] = queryResponse.invocationOutput.metadata.name;
    this.configuration['author'] = queryResponse.invocationOutput.metadata.author;
    this.configuration['description'] = queryResponse.invocationOutput.metadata.description;
    this.configuration['category'] = queryResponse.invocationOutput.metadata.category;
    this.configuration['type'] = this.gistMode ? 'Gist' : 'Detector';
    return newPackage;
  }

  private preparePublishingPackage(queryResponse: QueryResponse<DetectorResponse>, code: string) {
    if (queryResponse.invocationOutput.metadata.author !== null && queryResponse.invocationOutput.metadata.author !== "" && this.emailRecipients.indexOf(queryResponse.invocationOutput.metadata.author) < 0) {
      this.emailRecipients += ';' + queryResponse.invocationOutput.metadata.author;
    }

    let newPackage = this.UpdateConfiguration(queryResponse);

    let update = of(null);
    if (newPackage.length > 0) {
      update = forkJoin(newPackage.map(r => this.githubService.getChangelist(r).pipe(
        map(c => this.configuration['dependencies'][r] = c[c.length - 1].sha),
        flatMap(v => this.githubService.getCommitContent(r, v).pipe(map(s => this.reference[r] = s))))))
    }

    update.subscribe(_ => {
      this.publishingPackage = {
        id: queryResponse.invocationOutput.metadata.id,
        codeString: code,
        committedByAlias: this.userName,
        dllBytes: queryResponse.compilationOutput.assemblyBytes,
        pdbBytes: queryResponse.compilationOutput.pdbBytes,
        packageConfig: JSON.stringify(this.configuration)
      };
    });
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

  private initialize() {
    this.resourceId = this.resourceService.getCurrentResourceId();
    this.hideModal = localStorage.getItem("localdevmodal.hidden") === "true";
    let detectorFile: Observable<string>;
    this.compilationPackage = new CompilationProperties();
    if (this.mode === DevelopMode.Create) {
      // CREATE FLOW
      let templateFileName = (this.gistMode ? "Gist_" : "Detector_") + this.resourceService.templateFileName;
      detectorFile = this.githubService.getTemplate(templateFileName);
      this.fileName = "new.csx";
      this.startTime = this._detectorControlService.startTime;
      this.endTime = this._detectorControlService.endTime;
    }
    else if (this.mode === DevelopMode.Edit) {
      // EDIT FLOW
      this.fileName = `${this.id}.csx`;
      detectorFile = this.githubService.getSourceFile(this.id);
      this.startTime = this._detectorControlService.startTime;
      this.endTime = this._detectorControlService.endTime;
    }
    else if (this.mode === DevelopMode.EditMonitoring) {
      // SYSTEM MONITORING FLOW
      this.fileName = '__monitoring.csx';
      detectorFile = this.githubService.getSourceFile("__monitoring");
    }
    else if (this.mode === DevelopMode.EditAnalytics) {
      // SYSTEM ANALYTICS FLOW
      this.fileName = '__analytics.csx';
      detectorFile = this.githubService.getSourceFile("__analytics");
    }

    let configuration = of(null);
    if (this.id !== '') {
      configuration = this.githubService.getConfiguration(this.id).pipe(
        map(config => {
          if (!('dependencies' in config)) {
            config['dependencies'] = {};
          }

          this.configuration = config;
          return this.configuration['dependencies'];
        }),
        flatMap(dep => {
          let keys = Object.keys(dep);
          if (keys.length === 0) return of([]);
          return forkJoin(Object.keys(dep).map(key => this.githubService.getSourceReference(key, dep[key])));
        }));
    } else {
      if (!('dependencies' in this.configuration)) {
        this.configuration['dependencies'] = {};
      }
    }

    forkJoin(detectorFile, configuration).subscribe(res => {
      this.code = res[0];
      if (res[1] !== null) {
        Object.keys(this.configuration['dependencies']).forEach((name, index) => {
          this.reference[name] = res[1][index];
        });
      }

      if (!this.hideModal && !this.gistMode) {
        this.ngxSmartModalService.getModal('devModeModal').open();
      }
    });
  }
}
