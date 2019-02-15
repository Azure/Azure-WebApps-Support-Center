import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import {DiagnosticData, Rendering, DataTableResponseObject, DetectorResponse} from '../../models/detector';
import {Form, FormInput, InputType} from '../../models/form';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import {QueryResponse} from '../../models/compiler-response';
import { DetectorControlService } from '../../services/detector-control.service';
@Component({
  selector: 'form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent extends DataRenderBaseComponent {

  constructor(private _diagnosticService: DiagnosticService, protected telemetryService: TelemetryService,
    public detectorControlService: DetectorControlService) {
    super(telemetryService);
  }
  
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
               formInputs[ip]["inputId"],
               formInputs[ip]["inputType"],
               formInputs[ip]["label"]
              ));
           } else {
             this.detectorForms[i].formInputs.push(new FormInput
              (formInputs[ip]["combinedId"],
               formInputs[ip]["inputId"],
               formInputs[ip]["inputType"],
               formInputs[ip]["label"]));
           }       
         }
       }
      }
    }

    executeForm(formId: any, buttonId: any) {
      
      let formToExecute = this.detectorForms.find(form => form.formId == formId);
      // Setting loading indicator and removing the existing form response from the ui
      formToExecute.loadingFormResponse = true;
      formToExecute.formResponse = undefined;
      if(formToExecute != undefined) {
        let queryParams = `&fId=${formId}&btnId=${buttonId}`;
        formToExecute.formInputs.forEach(ip => {
          queryParams += `&inpId=${ip.inputId}&val=${ip.inputValue}`;
        });
        if(this.developmentMode) {
          // compile the code and show response
          var body = {
            script: this.executionScript
          };
          this._diagnosticService.getCompilerResponse(body, false, '', this.detectorControlService.startTimeString, 
            this.detectorControlService.endTimeString, '', '', queryParams)
          .subscribe((response: QueryResponse<DetectorResponse>) => {
            formToExecute.loadingFormResponse = false;
            if(response != undefined) {
              formToExecute.formResponse = response.invocationOutput;
              formToExecute.errorMessage = '';
            }
          }, ((error: any) => {
            formToExecute.loadingFormResponse = false;
            formToExecute.errorMessage = 'Something went wrong during form execution';
          }));
        } else {
          // get detector
          this._diagnosticService.getDetector("id", this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
          this.detectorControlService.shouldRefresh,  this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) => {
            formToExecute.formResponse = response;
            formToExecute.errorMessage = '';
            formToExecute.loadingFormResponse = false;
          }, (error: any) => {
            formToExecute.loadingFormResponse = false;
           formToExecute.errorMessage = 'Something went wrong during form execution';
          });
        }
      }
    }
}
