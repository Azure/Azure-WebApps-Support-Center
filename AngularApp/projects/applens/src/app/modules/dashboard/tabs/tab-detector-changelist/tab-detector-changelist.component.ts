import { Component, OnInit } from '@angular/core';
import { DiffEditorModel } from 'ngx-monaco-editor';
import { ActivatedRoute, Router } from '@angular/router';
import { GithubApiService } from '../../../../shared/services/github-api.service';
import { Dictionary } from '../../../../shared/models/extensions';
import { DetectorCommit } from '../../../../../app/shared/models/detector-commit';
import { Observable } from 'rxjs';
 @Component({
  selector: 'tab-detector-changelist',
  templateUrl: './tab-detector-changelist.component.html',
  styleUrls: ['./tab-detector-changelist.component.scss']
})
 export class TabDetectorChangelistComponent implements OnInit {
  selectedCommit: DetectorCommit;
  code: string;
  loadingChange: number = 0;
  noCommitsHistory: boolean = false;
  detectorId: string;
  commitsList: DetectorCommit[] = [];
  previousSha: string;
  previousCode: string;
  currentSha: string;
  currentCode: string;
   constructor(private _route: ActivatedRoute, private githubService: GithubApiService) { }
   setCodeDiffView(commit: DetectorCommit) {
    // Because monaco editor instance is not able to show the code content change dynamically, we have to wait for the API calls of getting file content
    //  of the previous commit and current commit to complete, before we can load the view.
     // This flag is used to determine whether we have got the result of both the two commits from github api already.
    // We will only show the monaco editor view when loadingChange >= 2
    this.loadingChange = 0;
     this.selectedCommit = commit;
    if (commit.previousSha === "") {
      this.loadingChange++;
      this.originalModel =
        {
          code: "",
          language: 'csharp'
        };
    }
    else {
      this.githubService.getCommitContent(this.detectorId, commit.previousSha).subscribe(code => {
      if (code)
      {
        this.loadingChange++;
        this.previousSha = commit.previousSha;
        this.previousCode = code;
         this.originalModel =
          {
            code: code,
            language: 'csharp'
          };
      }
      });
    }
     this.githubService.getCommitContent(this.detectorId, commit.sha).subscribe(code => {
      if (code)
      {
        this.loadingChange++;
        this.currentSha = commit.sha;
        this.currentCode = code;
  
        this.modifiedModel =
        {
          code: code,
          language: 'csharp'
        };
      }
    });
  }
   ngOnInit() {
    this.detectorId = this._route.parent.snapshot.params['detector'];
     this.githubService.getDetectorChangelist(this.detectorId).subscribe(commits => {
      if (commits && commits.length > 0) {
        this.commitsList = commits;
        let defaultCommit = commits[commits.length - 1];
        this.setCodeDiffView(defaultCommit);
      }
      else {
        this.noCommitsHistory = true;
      }
    });
  }
   options = {
    theme: 'vs-dark',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    folding: true
  };
   originalModel: DiffEditorModel;
  modifiedModel: DiffEditorModel;
}