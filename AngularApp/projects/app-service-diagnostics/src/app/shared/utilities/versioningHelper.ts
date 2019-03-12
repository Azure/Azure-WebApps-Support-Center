export class VersioningHelper{

static isV2Subscription(subscriptionId:string):boolean {
      
    // When we decide to enable the A/B testing for v2, change this to true
    let enableV2 = false;

    let firstDigit = "0x" + subscriptionId.substr(0, 1);
    return (parseInt(firstDigit, 16) % 2 == 1) && enableV2;
}

}