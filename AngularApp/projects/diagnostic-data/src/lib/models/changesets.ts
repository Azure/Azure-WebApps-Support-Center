import { DiffEditorModel } from 'ngx-monaco-editor';
export interface Change {
    level: string;
    levelIcon: string;
    time: string;
    displayName: string;
    description: string;
    oldValue: string;
    newValue: string;
    initiatedBy: string;
    jsonPath: string;
    originalModel: DiffEditorModel;
    modifiedModel: DiffEditorModel;
    initiatedByList: string[];
  }
