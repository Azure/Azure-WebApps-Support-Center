export class Form {
    formId: number;
    formTitle:string;
    formInputs: FormInput[] = [];
    formButtons: FormInput[] = [];
}

export class FormInput {
    inputId: number;
    inputType: InputType;
    inputLabel: string;
    constructor(id: number, inputType: InputType, label: string) {
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