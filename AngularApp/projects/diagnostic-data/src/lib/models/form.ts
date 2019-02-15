import {DetectorResponse} from '../models/detector';
export class Form {
    formId: number;
    formTitle:string;
    formInputs: FormInput[] = [];
    formButtons: FormInput[] = [];
    errorMessage:string = '';
    formResponse: DetectorResponse;
    loadingFormResponse: boolean = false;
}

export class FormInput {
    combinedId: number;
    inputId: number;
    inputType: InputType;
    inputLabel: string;
    inputValue: any;
    constructor(combinedid: number, id: number, inputType: InputType, label: string) {
        this.combinedId = combinedid;
        this.inputId = id;
        this.inputType = inputType;
        this.inputLabel = label;
    }
}

export enum InputType {
    TextBox,
    Checkbox,
    RadioButton,
    DropDown,
    Button
}