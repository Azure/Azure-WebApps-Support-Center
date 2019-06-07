import { DiffEditorModel } from 'ngx-monaco-editor';
export interface Changes {
    level: string;
    levelIcon: string;
    time: string;
    displayName: string;
    description: string;
    oldValue: string;
    newValue: string;
    initiatedBy: string;
    originalModel: DiffEditorModel;
    modifiedModel: DiffEditorModel;
    initiatedByList: any;
  }
