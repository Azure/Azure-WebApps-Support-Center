import { DemoSubscriptions } from "../../betaSubscriptions";

export class VersioningHelper {

    static isV2Subscription(subscriptionId: string): boolean {

        // When we decide to enable the A/B testing for v2, change this to true
        let enableV2 = false;

        let isBetaSubscription = DemoSubscriptions.betaSubscriptions.findIndex(item => subscriptionId.toLowerCase() === item.toLowerCase()) > -1;
        if (isBetaSubscription) {
            return true;
        }
        
        let firstDigit = "0x" + subscriptionId.substr(0, 1);

        // doing a 70:30 split for now
        return (parseInt(firstDigit, 16) >= 12) && enableV2;
    }
}