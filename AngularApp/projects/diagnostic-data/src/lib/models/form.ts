import { DetectorResponse } from '../models/detector';
export class Form {
    formId: number;
    formTitle: string;
    formInputs: FormInput[] = [];
    formButtons: FormButton[] = [];
    errorMessage: string = '';
    formResponse: DetectorResponse;
    loadingFormResponse: boolean = false;
}

export class FormInput {
    internalId: string;
    inputId: number;
    inputType: InputType;
    inputLabel: string;
    inputValue: any;
    isRequired: boolean = false;
    displayValidation: boolean = false;

    constructor(internalId: string, id: number, inputType: InputType, label: string, isRequired: boolean) {
        this.internalId = internalId;
        this.inputId = id;
        this.inputType = inputType;
        this.inputLabel = label;
        this.isRequired = isRequired;

    }
}

export class FormButton extends FormInput {
    buttonStyle: ButtonStyles;
    constructor(internalId: string, id: number, inputType: InputType, label: string, isRequired: boolean, buttonStyle?: ButtonStyles) {
        super(internalId, id, inputType, label, isRequired);
        this.buttonStyle = buttonStyle != undefined ? buttonStyle : ButtonStyles.Primary;
    }
}

export class RadioButtonList extends FormInput {
    items: ListItem[] = [];
    constructor(internalId: string, id: number, inputType: InputType, label: string, items: ListItem[]) {
        super(internalId, id, inputType, label, false);
        this.items = items;
        items.forEach(x => {
            if (x.isSelected) {
                this.inputValue = x.value;
            }
        })
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

export interface ListItem {
    text: string;
    value: string;
    isSelected: boolean;
}