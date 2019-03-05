import { Observable } from 'rxjs';
import { Component, Input } from '@angular/core';
import { Dictionary } from '../../../../../applens/src/app/shared/models/extensions';
import { Rendering } from '../../models/detector';
import { DiagnosticSiteService } from '../../services/diagnostic-site.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { SolutionText, getSolutionText } from './solution-text';

export enum ActionType {
  RestartSite = "RestartSite",
  UpdateSiteAppSettings = "UpdateSiteAppSettings",
  KillW3wpOnInstance = "KillW3wpOnInstance"
}

export class Solution {
  Title: string;
  Description: string;
  ActionName: string;
  RequiresConfirmation: boolean;
  ResourceUri: string;
  IsInternal: boolean;
  InternalInstructions: string;
  DetectorLink: string;
  Action: ActionType;
  ActionArgs: Dictionary<any>;
  PremadeDescription: SolutionText;
  PremadeInstructions: SolutionText;
}

@Component({
  selector: 'solution',
  templateUrl: './solution.component.html',
  styleUrls: ['./solution.component.scss']
})
export class SolutionComponent extends DataRenderBaseComponent {

  @Input("data") solution: Solution;
  renderingProperties: Rendering;
  actionStatus: string;
  defaultCopyText = 'Copy';
  copyText = this.defaultCopyText;
  appName: string;

  constructor(telemetryService: TelemetryService, private _siteService: DiagnosticSiteService) {
    super(telemetryService);
  }

  ngOnInit() {
    let uriParts = this.solution.ResourceUri.split('/');
    this.appName = uriParts[uriParts.length - 1];

    this.buildSolutionText();
  }

  performAction() {
    this.actionStatus = "Running...";

    this.chooseAction(this.solution.Action, this.solution.ResourceUri, this.solution.ActionArgs).subscribe(res => {
      if (res.ok == null || res.ok) {
        this.actionStatus = "Complete!"
      } else {
        this.actionStatus = `Error completing request. Status code: ${res.status}`
      }
    });
  }

  chooseAction(actionType: ActionType, resourceUri: string, args?: Dictionary<string>): Observable<any> {
    switch (actionType) {
      case ActionType.RestartSite:
        return this._siteService.restartSiteFromUri(resourceUri);
      case ActionType.UpdateSiteAppSettings:
        // TODO: Convert this call to return HttpResponse<any>
        return this._siteService.updateSettingsFromUri(resourceUri, args);
      case ActionType.KillW3wpOnInstance:
        break;
    }
  }

  buildSolutionText() {
    this.applyPremadeText();
    this.buildDynamicText();

    let detectorLinkMarkdown = `[Go To Detector](${this.solution.DetectorLink})`;
    this.solution.InternalInstructions = detectorLinkMarkdown + "\n\n" + this.solution.InternalInstructions;
  }

  applyPremadeText() {
    if (this.solution.PremadeDescription) {
      this.solution.Description = getSolutionText(this.solution.PremadeDescription);
    }

    if (this.solution.PremadeInstructions) {
      this.solution.InternalInstructions = getSolutionText(this.solution.PremadeInstructions);
    }
  }

  buildDynamicText() {
    let appSettingsText = '';

    if (this.solution.PremadeDescription === SolutionText.UpdateSettingsDescription) {
      appSettingsText = this.buildAppsettingsText();

      this.solution.Description = this.solution.Description + '\n' + appSettingsText;
    }

    if (this.solution.PremadeInstructions === SolutionText.UpdateSettingsInstructions) {
      if (appSettingsText === '') {
        appSettingsText = this.buildAppsettingsText();
      }

      this.solution.InternalInstructions = this.solution.InternalInstructions + '\n' + appSettingsText;
    }
  }

  buildAppsettingsText() {
    let resultText = '';

    for (let key in this.solution.ActionArgs['properties']) {
      let value = JSON.stringify(this.solution.ActionArgs['properties'][key]);
      resultText = resultText + '\n' + ` - ${key}: ${value}`;
    }

    return resultText
  }

  copyInstructions(copyValue: string) {
    this.copyText = "Copying..";

    let selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = copyValue;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    this.copyText = "Copied!";

    setTimeout(() => {
      this.copyText = this.defaultCopyText;
    }, 2000);
  }

}
