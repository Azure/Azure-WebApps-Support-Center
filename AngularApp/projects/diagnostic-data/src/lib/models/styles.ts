import { HealthStatus } from "./detector";

export class StatusStyles {
    public static Critical: string = "#ff0000";
    public static Warning: string = "#ff9104";
    public static Healthy: string = "#3da907";
    public static Info: string = "#3a9bc7";

    public static CriticalIcon: string = "fa-exclamation-circle";
    public static WarningIcon: string = "fa-exclamation-triangle";
    public static HealthyIcon: string = "fa-check-circle";
    public static InfoIcon: string = "fa-info-circle";

    public static getColorByStatus(status: HealthStatus) {
        switch (status) {
            case HealthStatus.Critical:
                return StatusStyles.Critical;
            case HealthStatus.Warning:
                return StatusStyles.Warning;
            case HealthStatus.Success:
                return StatusStyles.Healthy;
            case HealthStatus.Info:
                return StatusStyles.Info;
            default:
                return '';
        }
    }

    public static getIconByStatus(status: HealthStatus) {
        switch (status) {
            case HealthStatus.Critical:
                return StatusStyles.CriticalIcon;
            case HealthStatus.Warning:
                return StatusStyles.WarningIcon;
            case HealthStatus.Success:
                return StatusStyles.HealthyIcon;
            case HealthStatus.Info:
                return StatusStyles.InfoIcon;
            default:
                return '';
        }
    }
}