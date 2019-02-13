import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import {DiagnosticData, Rendering, DataTableResponseObject} from '../../models/detector';
import {Form, FormInput, InputType} from '../../models/form';
@Component({
  selector: 'form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent extends DataRenderBaseComponent {

  
  renderingProperties: Rendering;
  detectorForms: Form[] = [];

    protected processData(data: DiagnosticData) {
      super.processData(data);
      this.renderingProperties = <Rendering>data.renderingProperties;
      this.parseData(data.table);
    }
  
     
    public isText(inputType: InputType) {
      return inputType === InputType.TextBox;
    }

    public isButton(inputType: InputType) {
      return inputType === InputType.Button;
    }

    // parses the incoming data to render a form 
    private parseData(data: DataTableResponseObject) {
      let totalForms = data.rows.length;
      if(totalForms > 0) {
       for(let i=0; i<totalForms; i++) {
         this.detectorForms[i] = new Form();
         this.detectorForms[i].formId = data.rows[i][0];
         this.detectorForms[i].formTitle = data.rows[i][1];
         let formInputs = data.rows[i][2];
         for(let ip =0; ip<formInputs.length; ip++) {
           if(formInputs[ip]["inputType"] === InputType.Button) {
              this.detectorForms[i].formButtons.push(new FormInput(
                formInputs[ip]["combinedId"],
               formInputs[ip]["inputType"],
               formInputs[ip]["label"]
              ));
           } else {
             this.detectorForms[i].formInputs.push(new FormInput
              (formInputs[ip]["combinedId"],
               formInputs[ip]["inputType"],
               formInputs[ip]["label"]));
           }       
         }
       }
      }
    }


   

}
