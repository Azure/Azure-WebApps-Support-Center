import { Component, OnInit } from '@angular/core';
import { DiffEditorModel } from 'ngx-monaco-editor';
import { GithubApiService } from '../../../../shared/services/github-api.service';
import { Commit } from 'projects/applens/src/app/shared/models/commit';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';

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
  files: object = {};
  selectedFile: string;
  fileNames: string[];

  constructor(private _route: ActivatedRoute, private githubService: GithubApiService) { }
  setCodeDiffView(commit: Commit) {
    // Because monaco editor instance is not able to show the code content change dynamically, we have to wait for the API calls of getting file content
    //  of the previous commit and current commit to complete, before we can load the view.
    // This flag is used to determine whether we have got the result of both the two commits from github api already.
    // We will only show the monaco editor view when loadingChange >= 2
    this.loadingChange = 0;
    this.selectedCommit = commit;

    let last = of("");
    if (commit.previousSha !== "") {
      last = this.files[this.selectedFile]['GetContent'].apply(this.githubService, [this.id, commit.previousSha]);
    }

    let cur: Observable<string> = this.files[this.selectedFile]['GetContent'].apply(this.githubService, [this.id, commit.sha]);

    forkJoin(last, cur).subscribe(codes => {
      this.loadingChange++;
      this.previousSha = commit.previousSha;
      this.previousCode = codes[0];
      this.originalModel =
        {
          code: codes[0],
          language: this.files[this.selectedFile]['lang']
        };

      this.loadingChange++;
      this.currentSha = commit.sha;
      this.currentCode = codes[1];

      this.modifiedModel =
        {
          code: codes[1],
          language: this.files[this.selectedFile]['lang']
        };
    });
  }

  onChange() {
    this.initialize();
  }

  ngOnInit() {
    this.id = Object.values(this._route.parent.snapshot.params)[0];
    this.fileNames = [`${this.id}.csx`, 'package.json'];

    forkJoin(this.githubService.getChangelist(this.id), this.githubService.getConfigurationChangelist(this.id)).subscribe((res) => {
      this.files[`${this.id}.csx`] = {};
      this.files[`${this.id}.csx`]['changelist'] = res[0];
      this.files[`${this.id}.csx`]['lang'] = 'csharp';
      this.files[`${this.id}.csx`]['GetContent'] = this.githubService.getCommitContent;

      this.files['package.json'] = {};
      this.files['package.json']['changelist'] = res[1];
      this.files['package.json']['lang'] = 'json';
      this.files['package.json']['GetContent'] = this.githubService.getCommitConfiguration;

      this.selectedFile = `${this.id}.csx`;

      this.initialize();
    });
  }

  private initialize() {
    let commits = this.files[this.selectedFile]['changelist'];
    this.commitsList = commits;
    if (commits && commits.length > 0) {
      let defaultCommit = commits[commits.length - 1];

      if (this._route.snapshot.params['sha'] !== undefined) {
        let cs = this.commitsList.filter(c => c.sha === this._route.snapshot.params['sha']);
        if (cs.length > 0) {
          defaultCommit = cs[0];
        }
      }

      this.setCodeDiffView(defaultCommit);
    }
    else {
      this.noCommitsHistory = true;
    }
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