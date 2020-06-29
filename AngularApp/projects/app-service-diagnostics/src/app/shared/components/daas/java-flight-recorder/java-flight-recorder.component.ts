import { Component, OnInit, OnDestroy } from '@angular/core';
import { DaasComponent } from '../daas.component';
import { StepWizardSingleStep } from '../../../models/step-wizard-single-step';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from 'projects/app-service-diagnostics/src/app/startup/services/window.service';
import { Session } from '../../../models/daas';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';

@Component({
  selector: 'java-flight-recorder',
  templateUrl: './java-flight-recorder.component.html',
  styleUrls: ['./java-flight-recorder.component.scss','../daas.component.scss']
})
export class JavaFlightRecorderComponent extends DaasComponent implements OnInit, OnDestroy {

    instancesStatus: Map<string, number>;
    selectedInstance: string;
    WizardSteps: StepWizardSingleStep[] = [];
    error: any;

    constructor(private _serverFarmServiceLocal: ServerFarmDataService, private _siteServiceLocal: SiteService, private _daasServiceLocal: DaasService, private _windowServiceLocal: WindowService, private _loggerLocal: AvailabilityLoggingService) {

        super(_serverFarmServiceLocal, _siteServiceLocal, _daasServiceLocal, _windowServiceLocal, _loggerLocal);
        this.diagnoserName = 'JAVA Flight Recorder';
        this.diagnoserNameLookup = 'JAVA Flight Recorder';
    }

    ngOnInit(): void {
    }

    collectJfrTrace() {
        this.collectDiagnoserData(false);
    }

    initWizard(): void {
        this.WizardSteps = [];
        this.WizardSteps.push({
            Caption: 'Step 1: Starting Java Flight Recorder',
            IconType: 'fa-clock-o',
            AdditionalText: '',
            CaptionCompleted: 'Step 1: Java Flight Recorder Started'
        });

        this.WizardSteps.push({
            Caption: 'Step 2: Reproduce the issue now',
            IconType: 'fa-user',
            AdditionalText: 'Flight Recorder trace will stop automatically after 60 seconds',
            CaptionCompleted: 'Step 2: Events captured'
        });

        this.WizardSteps.push({
            Caption: 'Step 3: Stopping Flight Recorder',
            IconType: 'fa-stop',
            AdditionalText: '',
            CaptionCompleted: 'Step 3: Flight Recorder Stopped'
        });

        this.WizardSteps.push({
            Caption: 'Step 4: Analyzing Flight Recorder trace',
            IconType: 'fa-cog',
            AdditionalText: '',
            CaptionCompleted: 'Step 4: Analysis Complete'
        });

    }

    getDiagnoserStateFromSession(session: Session) {
        const jfrDiagnoser = session.DiagnoserSessions.find(x => x.Name.startsWith('JAVA Flight Recorder'));
        if (jfrDiagnoser) {
            this.diagnoserSession = jfrDiagnoser;
            this.Logs = jfrDiagnoser.Logs;
            this.Reports = jfrDiagnoser.Reports;
            if (jfrDiagnoser.CollectorStatus === 2) {
                if (jfrDiagnoser.CollectorStatusMessages.length > 0) {
                    jfrDiagnoser.CollectorStatusMessages.forEach(msg => {
                        // The order of this IF check should not be changed
                        if (msg.Message.indexOf('Stopping') >= 0 || msg.Message.indexOf('Stopped') >= 0) {

                            this.instancesStatus.set(msg.EntityType, 3);
                        } else if (msg.Message.indexOf('seconds') >= 0) {
                            this.instancesStatus.set(msg.EntityType, 2);
                        }
                    });
                    this.sessionStatus = this.instancesStatus.get(this.selectedInstance);
                }
            } else if (jfrDiagnoser.AnalyzerStatus === 2) {

                // once we are at the analyzer, lets just set all instances's status to
                // analyzing as we will reach here once all the collectors have finsihed
                this.sessionStatus = 4;

                this.WizardStepStatus = '';
                if (jfrDiagnoser.AnalyzerStatusMessages.length > 0) {
                    const thisInstanceMessages = jfrDiagnoser.AnalyzerStatusMessages.filter(x => x.EntityType.startsWith(this.selectedInstance));
                    if (thisInstanceMessages != null) {
                        const messagesLength = thisInstanceMessages.length;
                        if (messagesLength > 0) {
                            this.WizardStepStatus = thisInstanceMessages[messagesLength - 1].Message;
                        }
                    }
                }

            }
        }
    }

}
