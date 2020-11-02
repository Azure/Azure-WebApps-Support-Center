import { HealthStatus } from "diagnostic-data";
import { Observable } from "rxjs";

export interface RiskTile {
    title: string;
    action: () => void;
    link: string;
    infoObserverable: Observable<RiskInfo>;
}

export interface RiskInfo {
    [propName: string]: HealthStatus;
}