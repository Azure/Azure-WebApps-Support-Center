import { Injectable } from '@angular/core';
import { flatMap } from 'rxjs/operators';
import { Observable, ReplaySubject, of} from 'rxjs';
import { PortalService } from '../../startup/services/portal.service';
import { ResourceService } from './resource.service' ;
import { Verbs } from '../../shared/models/portal'
import { Guid } from '../../shared/utilities/guid';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { AuthService } from '../../startup/services/auth.service';

@Injectable()
export class CXPChatCallerService {
  public isChatSupported: boolean;
  private supportedSupportTopicIds: string[];
  public pesId: string = '';
  public readonly cxpChatTagName: string = 'webapps';
  public readonly applensUserAgentForCXPChat: string = 'applensDiagnostics';
  public supportPlanType: string = '';
  public chatLanguage: string = 'en';

  public trackingId:string = '';
  public chatUrl:string = '';
  public caseSubject : string = '';
  
  

  constructor(private _authService: AuthService, private _portalService: PortalService, private _telemetryService: TelemetryService, private _resourceService?: ResourceService) {
    this.isChatSupported = this._resourceService.isApplicableForLiveChat;
    if (this.isChatSupported) {
      this.supportedSupportTopicIds = this._resourceService.liveChatEnabledSupportTopicIds;
    }

    this._authService.getStartupInfo()
      .subscribe(startupInfo => {
        if (!!startupInfo) {
          if(!!startupInfo.effectiveLocale && startupInfo.effectiveLocale.length > 0) {
            this.chatLanguage = startupInfo.effectiveLocale;
          }

          if(!!startupInfo.optionalParameters) {
            var caseSubjectParam = startupInfo.optionalParameters.find(param => param.key === "caseSubject");
            if (!!caseSubjectParam) {
              this.caseSubject = caseSubjectParam.value;
            }

            var cxSupportPlanType = startupInfo.optionalParameters.find(param => param.key === "supportPlans");
            if(!!cxSupportPlanType) {
              this.supportPlanType = cxSupportPlanType.value.supportPlanType;
            }
          }
        }
      });

    this._resourceService.getPesId().subscribe(pesId => {
      this.pesId = pesId;
    });
  }

  public isSupportTopicEnabledForLiveChat(supportTopicIdToCheck: string): boolean {
    if (!this.isChatSupported) {
      this.logChatEligibilityCheck('CXPChatEnabled', 'false');
      return false;
    }
    this.logChatEligibilityCheck('CXPChatEnabled', 'true');

    if (this.supportedSupportTopicIds.length === 1 && this.supportedSupportTopicIds[0] === '*') {
      this.logChatEligibilityCheck('SupportTopicEnabledForCXPChat', `${supportTopicIdToCheck} is enabled.`);
      return true;
    }
    else {
      supportTopicIdToCheck = supportTopicIdToCheck.toLowerCase();
      let returnValue: boolean = false;

      this.supportedSupportTopicIds.some((currValue: string) => {
        returnValue = (supportTopicIdToCheck === currValue || currValue === '*');
        return returnValue;
      });

      this.logChatEligibilityCheck('SupportTopicEnabledForCXPChat', `${supportTopicIdToCheck} is ${!returnValue? 'not ': ''}enabled.`);

      return returnValue;
    }
  }

  public generateTrackingId(): string {
    let generatedGuid: string = '';
    try {
      generatedGuid = Guid.newGuid();
      this.logChatEligibilityCheck('GenerateCXPChatTrackingId', generatedGuid);
      return generatedGuid;
    } catch (error) {
      this.logChatEligibilityCheck('GenerateCXPChatTrackingId', `Error while generating tracking ID : ${JSON.stringify(error)}`);
      return ''; 
    }
  }


  /**
 * @param supportTopicId  Support Topic id for which the chat is being initiated for.
 * @param trackingIdGuid  Guid used for tracking. Get this by calling generateTrackingId().
 * @returns CXP Chat type. If no engineer is available, it will return None, else it will return the type of chat that can be initiated for this support topic.
 */
  public getChatAvailability(supportTopicId: string, trackingIdGuid: string): ReplaySubject<any> {


    let input = {
      tagName: this.cxpChatTagName,
      eligibilityParams: {
        productId: this.pesId,
        supportPlanType: this.supportPlanType,
        supportTopicId: supportTopicId,
        language: this.chatLanguage,
        subscriptionId: this._resourceService.subscriptionId
      },
      additionalInfo: {
        resourceId: this._resourceService.resource.id,
        subscriptionId: this._resourceService.subscriptionId
      },
      callerName: this.applensUserAgentForCXPChat,
      trackingId: trackingIdGuid,
      params: {}
    };

    this._portalService.postMessage(Verbs.getChatAvailability, JSON.stringify(input));


    //Wait for the response from the CXP chat API call.
    return this._portalService.getChatAvailability();

  }

  /**
 * @param cxpChatType  Get this from the output of cxpChatService.getChatAvailability call.
 * @param queueForSupportTopic This is the output of getChatAvailability call.
 * @param trackingIdGuid  Guid used for tracking. Get this by calling generateTrackingId().
 * @returns Chat URL string. This can be an empty string if no agents are available or if the queue is not found. Always handle for empty string.
 */
  public buildChatUrl(cxpChatType: string, queueForSupportTopic: any, trackingIdGuid: string): Observable<string> {

    let input = {
      chatAvailability: {
        chatType: cxpChatType,
        queue: queueForSupportTopic
      },
      trackingId: trackingIdGuid,
      callerName: this.applensUserAgentForCXPChat,
      additionalInfo: {}
    };

    if(this.chatUrl.length > 0 && this.trackingId.length > 0) {
      let stringToLog = `No call made, result from service cache. ChatUrl: ${this.chatUrl}`;
      this._telemetryService.logEvent(TelemetryEventNames.BuildCXPChatUrl, {
        "cxpChatTrackingId": this.trackingId,
        "passedInput": JSON.stringify(input),
        "returnValue": stringToLog
      });

      return of(this.chatUrl);
    }
    else {
      this._portalService.postMessage(Verbs.buildChatUrl, JSON.stringify(input));

      //Wait for the response from the CXP chat API call.
      return this._portalService.buildChatUrl().pipe(flatMap((chatUrl) => {
        let stringToLog = '';
        let returnValue = '';
        if (chatUrl && chatUrl != '') {
          this.chatUrl = chatUrl;
          this.trackingId = trackingIdGuid;
          stringToLog = chatUrl;
          returnValue = chatUrl;
        }
        else {
          if (chatUrl === '') {
            stringToLog = 'Empty URL returned. Likely cause, no engineer available.';
          }
          else {
            stringToLog = 'NULL object returned. Likely cause, unknown. Followup with CXP team with trackingId.';
          }
        }

        this._telemetryService.logEvent(TelemetryEventNames.BuildCXPChatUrl, {
          "cxpChatTrackingId": trackingIdGuid,
          "passedInput": JSON.stringify(input),
          "returnValue": stringToLog
        });
        return of(returnValue);

      }));
    }
  }


  /**
   * @param supportTopicId  Support Topic id for which the chat is being initiated for.
   * @param trackingIdGuid  Guid used for tracking. Get this by calling generateTrackingId().
   * @returns Chat URL string. This can be an empty string if no agents are available or if the queue is not found. Always handle for empty string.
   */
  public getChatURL(supportTopicId: string, trackingIdGuid: string): Observable<string> {
    let input = {
      tagName: this.cxpChatTagName,
      eligibilityParams: {
        productId: this.pesId,
        supportTopicId: supportTopicId,
        language: this.chatLanguage,
        subscriptionId: this._resourceService.subscriptionId
      },
      additionalInfo: {
        resourceId: this._resourceService.resource.id,
        subscriptionId: this._resourceService.subscriptionId
      },
      callerName: this.applensUserAgentForCXPChat,
      trackingId: trackingIdGuid,
      createTicket: true,
      ticketInformation: {
        subscriptionId: this._resourceService.subscriptionId,
        productId: this.pesId,
        supportTopicId: supportTopicId,
        title: this.caseSubject,
        resourceId: this._resourceService.resource.id
      }
    };

    if(this.chatUrl.length > 0 && this.trackingId.length > 0) {
      let stringToLog = `No call made, result from service cache. ChatUrl: ${this.chatUrl}`;
      this._telemetryService.logEvent(TelemetryEventNames.BuildCXPChatUrl, {
        "cxpChatTrackingId": this.trackingId,
        "passedInput": JSON.stringify(input),
        "returnValue": stringToLog
      });

      return of(this.chatUrl);
    }
    else {
      
      //Make a call to the CXP Chat API to get the URL, the call is piped via SCI Frame blade in the portal.
      try {
        this._telemetryService.logEvent(TelemetryEventNames.GetCXPChatURL, {
          "cxpChatTrackingId": trackingIdGuid,
          "passedInput": JSON.stringify(input),
          "returnValue": 'About to make a call to CXP chat portal RPC API.'
        });

        this._portalService.postMessage(Verbs.getChatUrl, JSON.stringify(input));

        this._telemetryService.logEvent(TelemetryEventNames.GetCXPChatURL, {
          "cxpChatTrackingId": trackingIdGuid,
          "passedInput": JSON.stringify(input),
          "returnValue": 'Made a call to CXP chat portal RPC API. Waiting on response...'
        });
      } catch (error) {
        this._telemetryService.logEvent(TelemetryEventNames.GetCXPChatURL, {
          "cxpChatTrackingId": trackingIdGuid,
          "passedInput": JSON.stringify(input),
          "returnValue": `Error while sending a call to CXP chat portal RPC API. ${JSON.stringify(error)}`
        });
      }
      
      //Wait for the response from the CXP chat API call.
      try {
        return this._portalService.getChatUrl().pipe(flatMap((chatUrl) => {
          let stringToLog = '';
          let returnValue = '';
          
          if (chatUrl && chatUrl != '') {
            this.chatUrl = chatUrl;
            this.trackingId = trackingIdGuid;
            stringToLog = chatUrl;
            returnValue = chatUrl;
          }
          else {
            if (chatUrl === '') {
              stringToLog = 'Empty URL returned. Likely cause, no engineer available.';
            }
            else {
              stringToLog = 'NULL object returned. Likely cause, unknown. Followup with CXP team with trackingId.';
            }
          }
    
          this._telemetryService.logEvent(TelemetryEventNames.GetCXPChatURL, {
            "cxpChatTrackingId": trackingIdGuid,
            "passedInput": JSON.stringify(input),
            "returnValue": stringToLog
          });
          return of(returnValue);
        }));      
      } catch (error) {
        this._telemetryService.logEvent(TelemetryEventNames.GetCXPChatURL, {
          "cxpChatTrackingId": trackingIdGuid,
          "passedInput": JSON.stringify(input),
          "returnValue": `Error in Chat portal RPC API response. ${JSON.stringify(error)}`
        });
        return of('');
      }

    }
  }


  public notifyChatOpened() {
    //When CXP API is ready to receive a message from us on chat opened, update this function and call their API with the correct contract in the Ibiza project SCIFrameBlade _notifyChatOpened method
    let chatOpenedNotificationContract = {};
    this._portalService.postMessage(Verbs.notifyChatOpened, JSON.stringify(chatOpenedNotificationContract) );
  }

  /**
 * @param userAction Which button did the user click on
 * @param trackingIdGuid  Guid used for tracking. This is the trackingId for which the Chat was initiated.
 * @param chatUrl  The chat URL that is being opened.
 */
  public logUserActionOnChat(userAction: string, trackingIdGuid: string, chatUrl: string): void {
    let notificationMessage = {
      "cxpChatTrackingId": trackingIdGuid,
      "userAction": userAction,
      "chatUrl": chatUrl
    };

    this._telemetryService.logEvent(TelemetryEventNames.CXPChatUserAction, notificationMessage);
  }

  /**
   * @param checkType Which button did the user click on
   * @param checkOutcome  Guid used for tracking. This is the trackingId for which the Chat was initiated.
   */
  public logChatEligibilityCheck(checkType: string, checkOutcome: string): void {
    let notificationMessage = {
      "checkType": checkType,
      "checkOutcome": checkOutcome
    };

    this._telemetryService.logEvent(TelemetryEventNames.CXPChatEligibilityCheck, notificationMessage);
  }
}
