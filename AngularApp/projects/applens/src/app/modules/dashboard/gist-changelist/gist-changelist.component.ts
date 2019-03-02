import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Commit } from '../../../shared/models/commit';
import { ActivatedRoute } from '@angular/router';
import { GithubApiService } from '../../../shared/services/github-api.service';
import { DiffEditorModel } from 'ngx-monaco-editor';

@Component({
  selector: 'gist-changelist',
  templateUrl: './gist-changelist.component.html',
  styleUrls: ['./gist-changelist.component.scss']
})
export class GistChangelistComponent implements OnInit {

  @Input() id: string;
  @Input() version: string;
  @Output() change: EventEmitter<object> = new EventEmitter<object>();

  code: string;
  loadingChange: number = 0;
  noCommitsHistory: boolean = false;
  commitsList: Commit[] = [];
  previousSha: string;
  previousCode: string;
  currentSha: string;
  currentCode: string;
  initialized = false;

  constructor(private _route: ActivatedRoute, private githubService: GithubApiService) { }

  setCodeDiffView(commit: Commit) {
    // Because monaco editor instance is not able to show the code content change dynamically, we have to wait for the API calls of getting file content
    //  of the previous commit and current commit to complete, before we can load the view.
    // This flag is used to determine whether we have got the result of both the two commits from github api already.
    // We will only show the monaco editor view when loadingChange >= 2
    this.loadingChange = 0;
    this.version = commit.sha;
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

        this.change.emit({version: this.version, code: this.currentCode});
      }
    });
  }

  ngOnChanges() {
    if(this.initialized){
      this.initialize();
    }
  }

  ngOnInit() {
    if(!this.initialized){
      this.initialize();
      this.initialized = true;
    }
  }

  private initialize(){
    this.githubService.getChangelist(this.id).subscribe(commits => {
      this.commitsList = commits;
      if (commits && commits.length > 0) {
        let defaultCommit = this.commitsList.filter(c => c.sha == this.version)[0];
        this.setCodeDiffView(defaultCommit);
        this.noCommitsHistory = false;
      }
      else {
        this.noCommitsHistory = true;
      }
    });
  }

  options = {
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