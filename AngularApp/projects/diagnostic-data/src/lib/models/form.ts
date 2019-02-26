import {DetectorResponse} from '../models/detector';
export class Form {
    formId: number;
    formTitle:string;
    formInputs: FormInput[] = [];
    formButtons: FormButton[] = [];
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

export class FormButton extends FormInput {
    buttonStyle: ButtonStyles;
    constructor(combinedid: number, id: number, inputType: InputType, label: string, isRequired: boolean, buttonStyle?: ButtonStyles) {
        super(combinedid, id, inputType, label, isRequired);
        this.buttonStyle = buttonStyle != undefined ? buttonStyle : ButtonStyles.Primary;       
    }
}
export enum InputType {
    TextBox,
    Checkbox,
    RadioButton,
    DropDown,
    Button
}

export enum ButtonStyles {
    Primary = 0,
    Secondary,
    Success,
    Danger,
    Warning,
    Info,
    Light,
    Dark,
    Link
}