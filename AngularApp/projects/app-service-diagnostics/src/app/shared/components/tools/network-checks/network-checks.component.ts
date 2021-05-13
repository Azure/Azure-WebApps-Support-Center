import { Component, Input, OnInit, OnDestroy, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { Site, SiteInfoMetaData } from '../../../models/site';
import { SiteService } from '../../../services/site.service';
import { ArmService } from '../../../services/arm.service';

import { HealthStatus, LoadingStatus, TelemetryService } from 'diagnostic-data';

import { DiagProvider, OutboundType } from './diag-provider';
import { Globals } from 'projects/app-service-diagnostics/src/app/globals';
import { CheckManager } from './check-manager';
import { CheckStepView, DropdownStepView, InfoStepView, StepFlow, StepFlowManager, StepView, StepViewContainer, StepViewType } from '../../step-views/step-view-lib';
import { ActivatedRoute, Router } from '@angular/router';
import { PortalService } from 'projects/app-service-diagnostics/src/app/startup/services/portal.service';
import { configFailureFlow } from './network-check-flows/configFailureFlow.js';
import { connectionFailureFlow } from './network-check-flows/connectionFailureFlow.js';
import { learnMoreFlow } from './network-check-flows/learnMoreFlow.js';

abstract class NetworkCheckFlow {
    public id: string;
    public title: string;
    public description?: string;
    abstract func(siteInfo: SiteInfoMetaData & Site & { fullSiteName: string }, diagProvider: DiagProvider, flowMgr: StepFlowManager): Promise<null>;
}

@Component({
    templateUrl: 'network-checks.component.html',
    styleUrls: ['../styles/daasstyles.scss', './network-checks.component.scss'],
    encapsulation: ViewEncapsulation.None,
    entryComponents: []
})


export class NetworkCheckComponent implements OnInit, AfterViewInit {

    @ViewChild('networkCheckingTool', { static: false }) networkCheckingToolDiv: any;
    title: string = 'Network/Connectivity Troubleshooter (Preview)';
    description: string = 'Check your network connectivity and troubleshoot network issues';
    stepFlowManager: StepFlowManager;
    stepViews: StepViewContainer[] = [];

    diagProvider: DiagProvider;
    siteInfo: SiteInfoMetaData & Site & { fullSiteName: string };
    vnetIntegrationDetected = null;
    openFeedback = false;
    debugMode = false;
    isSupportCenter: boolean;
    logEvent: (eventMessage: string, properties: { [name: string]: string }, measurements?: any) => void;
    private _feedbackQuestions = "- Is your networking issue resolved? \r\n\r\n\r\n" +
        "- What was the issue?\r\n\r\n\r\n" +
        "- If the issue was not resolved, what can be the reason?\r\n\r\n\r\n" +
        "- What else do you expect from this tool?\r\n";
    //checks: any[];

    constructor(private _siteService: SiteService, private _armService: ArmService, private _telemetryService: TelemetryService, private _globals: Globals, private _route: ActivatedRoute, private _router: Router, private _portalService: PortalService) {
        try {
            var feedbackPanelConfig = { defaultFeedbackText: this._feedbackQuestions, detectorName: "NetworkCheckingTool", notResetOnDismissed: true, url: window.location.href }
            _globals.messagesData.feedbackPanelConfig = feedbackPanelConfig;
            var queryParams = _route.snapshot.queryParams;
            this.isSupportCenter = (queryParams["isSupportCenter"] === "true");
            this.logEvent = (eventMessage: string, properties: { [name: string]: string } = {}, measurements?: any) => {
                properties.isSupportCenter = this.isSupportCenter.toString();
                _telemetryService.logEvent(eventMessage, properties, measurements);
            };
            window["networkCheckLinkClickEventLogger"] = (viewId: string, url: string, text: string) => {
                this.logEvent("NetworkCheck.LinkClick", { viewId, url, text });
            }
            window["logDebugMessage"] = _globals.logDebugMessage;
            if (window["debugMode"]) {
                _telemetryService["telemetryProviders"] = [];
                this.debugMode = window["debugMode"];
            }

            var siteInfo = this._siteService.currentSiteMetaData.value;
            var fullSiteName = siteInfo.siteName + (siteInfo.slot == "" ? "" : "-" + siteInfo.slot);
            this.stepFlowManager = new StepFlowManager(this.stepViews, _telemetryService);
            this.siteInfo = { ...this._siteService.currentSiteMetaData.value, ...this._siteService.currentSite.value, fullSiteName };

            this.diagProvider = new DiagProvider(this.siteInfo, _armService, _siteService, _portalService.shellSrc);
            this.loadFlowsAsync().catch(e => {
                throw e;
            });
        } catch (error) {
            this.stepFlowManager.errorMsg = "Initialization failure, retry may not help.";
            this.stepFlowManager.errorDetailMarkdown = "```\r\n\r\n" + error.stack + "\r\n\r\n```";
            _telemetryService.logException(error, "NetworkCheck.Initialization");
            console.log(error);
        }
    }

    ngAfterViewInit() {
        this.stepFlowManager.setDom(this.networkCheckingToolDiv.nativeElement);
    }

    async loadFlowsAsync(): Promise<void> {
        try {
            var globals = this._globals;
            globals.messagesData.currentNetworkCheckFlow = null;
            var telemetryService = this._telemetryService;
            var networkCheckFlows = { connectionFailureFlow, configFailureFlow, learnMoreFlow }
            var flows = this.processFlows(networkCheckFlows);
            if (this.debugMode) {
                window["logDebugMessage"] = console.log.bind(console);
                var remoteFlows: any = await CheckManager.loadRemoteCheckAsync(true);
                remoteFlows = this.processFlows(remoteFlows, "(debug)");
                flows = flows.concat(remoteFlows);
            }
            var mgr = this.stepFlowManager;
            if (this.siteInfo.kind.includes("functionapp") && this.siteInfo.sku.toLowerCase() == "dynamic") {
                mgr.addView(new CheckStepView({ id: "NotSupportedCheck", title: "VNet integration is not supported by Consumption Plan Function App", level: 2 }));
            } else {
                var dropDownView = new DropdownStepView({
                    id: "InitialDropDown",
                    description: "Tell us more about the problem you are experiencing:",
                    dropdowns: [{
                        options: flows.map(f => f.title),
                        placeholder: "Please select..."
                    }],
                    expandByDefault: true,
                    async callback(dropdownIdx: number, selectedIdx: number): Promise<void> {
                        mgr.reset(state);
                        var flow = flows[selectedIdx];
                        globals.messagesData.currentNetworkCheckFlow = flow.id;
                        globals.messagesData.feedbackPanelConfig.detectorName = "NetworkCheckingTool." + flow.id;
                        telemetryService.logEvent("NetworkCheck.FlowSelected", { flowId: flow.id });
                        mgr.setFlow(flow);
                    },
                    onDismiss: ()=>{
                        telemetryService.logEvent("NetworkCheck.DropdownExpanded", {});
                    }
                });
                var state = mgr.addView(dropDownView);
            }
        } catch (e) {
            console.log("loadFlowsAsync failed", e);
            throw e;
        }
    }

    processFlows(flows: any, postfix?: string): StepFlow[] {
        return Object.keys(flows).map(key => {
            var flow = flows[key];
            if (postfix != null) {
                flow.title += " " + postfix;
            }
            flow.id = flow.id || key;
            var siteInfo = this.siteInfo;
            var diagProvider = this.diagProvider;
            var stepFlow: StepFlow = {
                id: flow.id,
                title: flow.title,
                description: flow.description || null,
                async run(flowMgr: StepFlowManager): Promise<void> {
                    return flow.func(siteInfo, diagProvider, flowMgr);
                }
            };
            return stepFlow;
        });
    }

    ngOnInit(): void {
        this._telemetryService.logEvent("NetworkCheck.FirstPageLoad");
    }

    convertFromNetworkCheckFlow(flow: NetworkCheckFlow): StepFlow {
        var siteInfo = this.siteInfo;
        var diagProvider = this.diagProvider;
        var stepFlow: StepFlow = {
            id: flow.id,
            title: flow.title,
            description: flow.description || null,
            async run(flowMgr: StepFlowManager): Promise<void> {
                return flow.func(siteInfo, diagProvider, flowMgr);
            }
        };

        return stepFlow;
    }
}


