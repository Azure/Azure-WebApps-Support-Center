import { Injectable } from '@angular/core';

@Injectable()
export class UriElementsService {
    private _resourceProviderPrefix: string = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Web/";
    private _siteResource = this._resourceProviderPrefix + "sites/{siteName}";
    private _slotResource = "/slots/{slot}";
    private _siteResourceDiagnosticsPrefix: string = "/diagnostics";

    private _siteRestartUrlFormat: string = "/restart";
    private _analysisResourceFormat: string = this._siteResourceDiagnosticsPrefix + "/{analysisName}";
    private _detectorsUrlFormat: string = this._siteResourceDiagnosticsPrefix + "/detectors";
    private _detectorResourceFormat: string = this._detectorsUrlFormat + "/{detectorName}";
    private _diagnosticPropertiesFormat: string = this._siteResourceDiagnosticsPrefix + "/properties";

    private _queryStringParams = "?startTime={startTime}&endTime={endTime}";

    private _supportApi: string = 'https://support-bay-api.azurewebsites.net/';
    private _killw3wpUrlFormat: string = this._supportApi + 'sites/{subscriptionId}/{resourceGroup}/{siteName}/killsiteprocess';
    /*
        TODO : Need to add start time and end time parameters
    */

    
    private _diagnosticsPath = "/extensions/daas/api/";
       private _diagnosticsSessionsPath = this._diagnosticsPath + "sessions/all";
    private _diagnosticsSessionsDetailsPath = this._diagnosticsPath + "sessions" + "/{type}/{details} ";
    private _diagnosticsDiagnosersPath = this._diagnosticsPath + "diagnosers";
    private _diagnosticsInstancesPath = this._diagnosticsPath + "instances";
    private _diagnosticsSingleSessionPath = this._diagnosticsPath + "session/{sessionId}/{details}";
    private _diagnosticsWebJobStatePath = this._diagnosticsPath + "daaswebjobstate";
    private _diagnosticsWebJobStartPath = this._diagnosticsPath + "daaswebjobstart";
    
    getDiagnosticsDiagnosersUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '') {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticsDiagnosersPath;
    };

    getDiagnosticsSessionsUrl(subscriptionId: string, resourceGroup: string, siteName:string, slot: string = '') {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticsSessionsPath;
    };

    getDiagnosticsSessionsDetailsUrl(subscriptionId: string, resourceGroup: string, siteName:string, type:string, detailed:boolean, slot: string = '') {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticsSessionsDetailsPath.replace("{type}", type)
        .replace("{details}", detailed.toString());
    };

    getDiagnosticsInstancesUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '') {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticsInstancesPath;
    };

    getDiagnosticsSingleSessionUrl(subscriptionId: string, resourceGroup: string, siteName:string, sessionId: string, detailed: boolean, slot: string = '') {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticsSingleSessionPath
        .replace("{sessionId}", sessionId)
        .replace("{details}", detailed.toString());
    };

    getDiagnosticsWebJobStateUrl(subscriptionId: string, resourceGroup: string, siteName:string, slot: string = '') {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticsWebJobStatePath;
    };

    getDiagnosticsWebJobStartUrl(subscriptionId: string, resourceGroup: string, siteName:string, slot: string = '') {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticsWebJobStartPath;
    };


    getSiteRestartUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._siteRestartUrlFormat;
    }

    getKillSiteProcessUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {

        var resource = siteName;
        if (slot !== '') {
            resource = `${siteName}(${slot})`;
        }

        return this._killw3wpUrlFormat
            .replace('{subscriptionId}', subscriptionId)
            .replace('{resourceGroup}', resourceGroup)
            .replace('{siteName}', resource);
    }

    getAnalysisResourceUrl(subscriptionId: string, resourceGroup: string, siteName: string, analysisName: string, slot: string = '', startTime: string = '', endTime: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) +
            this._analysisResourceFormat.replace("{analysisName}", analysisName) +
            this._getQueryParams(startTime, endTime);
    }

    getDetectorsUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._detectorsUrlFormat;
    }

    getDetectorResourceUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '', detectorName: string, startTime: string = '', endTime: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) +
            this._detectorResourceFormat.replace("{detectorName}", detectorName) +
            this._getQueryParams(startTime, endTime);
    }

    getDiagnosticPropertiesUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticPropertiesFormat;
    }

    private _getSiteResourceUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '') {
        let url = this._siteResource.replace("{subscriptionId}", subscriptionId)
            .replace("{resourceGroup}", resourceGroup)
            .replace("{siteName}", siteName);

        if (slot !== undefined && slot != '') {
            url += this._slotResource.replace('{slot}', slot);
        }

        return url;
    };

    private _getQueryParams(startTime: string, endTime: string): string {
        return this._queryStringParams
            .replace("{startTime}", startTime)
            .replace("{endTime}", endTime);
    };
}