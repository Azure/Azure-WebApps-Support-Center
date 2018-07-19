import { Injectable } from '@angular/core';
import { BotEventType } from './events.enumerations';
import { LoggingService } from './logging.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ArmService } from '../arm.service';
import { PortalService } from '../../../startup/services/portal.service';

@Injectable()
export class BotLoggingService extends LoggingService {

    constructor(private _portalService: PortalService, private _authService: AuthService, private _armService: ArmService) {
        super(_portalService, _authService, _armService);
    }

    LogHealthCheckInvoked(): void {
        this._log(BotEventType[BotEventType.HealthCheckInvoked], 'Support Home');
    }

    LogDetectorViewInBot(detector: string, displayed: boolean) {
        this._log(BotEventType[BotEventType.DetectorViewChatDisplayed], 'Support Home', {
            detector: detector,
            displayed: displayed
        });
    }

    LogHealthCheckResults(healthCheckResults: string[]): void {
        this._log(BotEventType[BotEventType.HealthCheckResults], 'Support Home', {
            results: healthCheckResults ? healthCheckResults.toString().replace(new RegExp(',', 'g'), '|') : ''
        });
    }

    LogLiveChatWidgetOpened(source: string): void {
        this._log(BotEventType[BotEventType.LiveChatWidgetOpened], source, {});
    }

    LogLiveChatWidgetClosed(source: string): void {
        this._log(BotEventType[BotEventType.LiveChatWidgetClosed], source, {});
    }
}