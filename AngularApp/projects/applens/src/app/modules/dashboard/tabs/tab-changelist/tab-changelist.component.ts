import { Component, OnInit } from '@angular/core';
import { DiffEditorModel } from 'ngx-monaco-editor';
import { GithubApiService } from '../../../../shared/services/github-api.service';
import { Commit } from 'projects/applens/src/app/shared/models/commit';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'tab-detector-changelist',
  templateUrl: './tab-changelist.component.html',
  styleUrls: ['./tab-changelist.component.scss']
})
export class TabChangelistComponent implements OnInit {
  selectedCommit: Commit;
  code: string;
  loadingChange: number = 0;
  noCommitsHistory: boolean = false;
  id: string;
  commitsList: Commit[] = [];
  previousSha: string;
  previousCode: string;
  currentSha: string;
  currentCode: string;
  constructor(private _route: ActivatedRoute, private githubService: GithubApiService) { }
  setCodeDiffView(commit: Commit) {
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
      this.githubService.getCommitContent(this.id, commit.previousSha).subscribe(code => {
        if (code) {
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
    this.githubService.getCommitContent(this.id, commit.sha).subscribe(code => {
      if (code) {
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
    this.id = Object.values(this._route.parent.snapshot.params)[0];
    this.githubService.getChangelist(this.id).subscribe(commits => {
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