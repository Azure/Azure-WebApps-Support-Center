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
    isRequired: boolean = false;
    displayValidation: boolean = false;
    constructor(combinedid: number, id: number, inputType: InputType, label: string, isRequired: boolean) {
        this.combinedId = combinedid;
        this.inputId = id;
        this.inputType = inputType;
        this.inputLabel = label;
        this.isRequired = isRequired;
    }
}

export enum InputType {
    TextBox,
    Checkbox,
    RadioButton,
    DropDown,
    Button
}