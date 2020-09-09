import { DetectorResponse } from '../models/detector';
import { IDropdownOption } from 'office-ui-fabric-react';

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
    tooltip: string;
    tooltipIcon: string;

    constructor(internalId: string, id: number, inputType: InputType, label: string, isRequired: boolean, tooltip: string, tooltipIcon:string) {
        this.internalId = internalId;
        this.inputId = id;
        this.inputType = inputType;
        this.inputLabel = label;
        this.isRequired = isRequired;
        this.tooltip = tooltip;
        this.tooltipIcon = tooltipIcon;
    }
}

export class FormButton extends FormInput {
    buttonStyle: ButtonStyles;
    constructor(internalId: string, id: number, inputType: InputType, label: string, isRequired: boolean, buttonStyle?: ButtonStyles) {
        super(internalId, id, inputType, label, isRequired, "", "");
        this.buttonStyle = buttonStyle != undefined ? buttonStyle : ButtonStyles.Primary;
    }
}

export class RadioButtonList extends FormInput {
    items: ListItem[] = [];
    constructor(internalId: string, id: number, inputType: InputType, label: string, items: ListItem[], tooltip: string, tooltipIcon: string) {
        super(internalId, id, inputType, label, false, tooltip, tooltipIcon);
        this.items = items;
        items.forEach(x => {
            if (x.isSelected) {
                this.inputValue = x.value;
            }
            x.tooltipIcon = x.tooltipIcon != "" ? x.tooltipIcon : "fa-info-circle";
        })
    }
}

export class Dropdown extends FormInput {
    dropdownOptions: IDropdownOption[];
    constructor(internalId:string, id:number, inputType: InputType, label:string, options:IDropdownOption[], tooltip:string, tooltipIcon:string) {
        super(internalId, id, inputType, label, false, tooltip, tooltipIcon)
        this.dropdownOptions = options;
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
    tooltipIcon: string;
}
