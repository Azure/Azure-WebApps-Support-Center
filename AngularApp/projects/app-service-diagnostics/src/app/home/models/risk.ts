import { HealthStatus } from "diagnostic-data";
import { MessageBarType } from "office-ui-fabric-react";
import { Observable } from "rxjs";

export interface RiskTile {
    title: string;
    action: () => void;
    linkText: string;
    infoObserverable: Observable<RiskInfo>;
    showTile:boolean;
}

export interface RiskInfo {
    [propName: string]: HealthStatus;
}

export class RiskHelper
{
    public static convertToRiskInfo(info:any):RiskInfo {
        let riskInfo:RiskInfo = {};
        const keys = Object.keys(info);
        for(let key of keys){
            const type = info[key].messageType;
            if(type !== undefined && type !== null){
                let status = this.convertMessageTypeToHealthStatus(type);
                riskInfo[key] = status;
            }
        }
        return riskInfo;
    }

    private static convertMessageTypeToHealthStatus(messageBarType:MessageBarType):HealthStatus{
        switch (messageBarType) {
            case MessageBarType.severeWarning:
            case MessageBarType.error:
                return HealthStatus.Critical;
            
            case MessageBarType.warning:
                return HealthStatus.Warning;
            
            case MessageBarType.info:
                return HealthStatus.Info;
            
            case MessageBarType.success:
                return HealthStatus.Success;
            
            default:
                return HealthStatus.Info;
        }
    }
}