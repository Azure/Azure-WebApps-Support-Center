import { INameValuePair } from '../models/namevaluepair';
import { AdvancedApplicationRestartInfo, InstanceInfo, SiteProfilingInfo } from '../models/solution-metadata';

export class MetaDataHelper {

    static getMetaDataValue(metaData: INameValuePair[][], key: string): string {
        let searchKey = key.toLowerCase();
        if (metaData && metaData.length > 0) {
            metaData.forEach(element => {
                element.forEach(nameValuePair => {
                    if (nameValuePair.name.toLowerCase() === searchKey) {
                        return nameValuePair.value;
                    }
                });
            });
        }
        return null;
    }

    static getMetaDataValues(metaData: INameValuePair[][], key: string): string[] {
        let values: string[] = [];
        let searchKey = key.toLowerCase();
        if (metaData && metaData.length > 0) {
            metaData.forEach(element => {
                element.forEach(nameValuePair => {
                    if (nameValuePair.name.toLowerCase() === searchKey) {
                        values.push(nameValuePair.value);
                    }
                });
            });
        }

        return values;
    }

    static getProfilingData(metaData: INameValuePair[][]): SiteProfilingInfo {
        if(metaData.length > 0) {

            var siteNameWithSlot = MetaDataHelper.getValueForName(metaData[0], 'sitename');
            var siteName = "";
            var slotName = "";

            if (siteNameWithSlot.indexOf('(') >= 0) {
                let parts = siteNameWithSlot.split('(');
                siteName = parts[0];
                slotName = parts[1].replace(')', '');
            }
            else
            {
                siteName = siteNameWithSlot;
            }

            let profilingInfo: SiteProfilingInfo = {
                subscriptionId: MetaDataHelper.getValueForName(metaData[0], 'subscriptionid'),
                resourceGroupName: MetaDataHelper.getValueForName(metaData[0], 'resourcegroup'), 
                siteName: siteName,
                slot:slotName,
                instances: []
            }           

            return profilingInfo;
        }
    }

    static getAdvancedApplicationRestartData(metaData: INameValuePair[][]): AdvancedApplicationRestartInfo {
        if(metaData.length > 0) {
            let restartInfo: AdvancedApplicationRestartInfo = {
                subscriptionId: MetaDataHelper.getValueForName(metaData[0], 'subscriptionid'),
                resourceGroupName: MetaDataHelper.getValueForName(metaData[0], 'resourcegroup'), 
                siteName: MetaDataHelper.getValueForName(metaData[0], 'sitename'),
                instances: []
            }

            metaData.forEach((nameValuePairSet: INameValuePair[]) => {
                restartInfo.instances.push(<InstanceInfo>{
                    machineName: MetaDataHelper.getValueForName(nameValuePairSet, 'machinename'),
                    instanceId: MetaDataHelper.getValueForName(nameValuePairSet, 'instanceid')
                })
            })

            return restartInfo;
        }
    }

    static getValueForName(nameValuePairSet: INameValuePair[], name: string): string {
        let matchingNameValuePair = nameValuePairSet.find(nvp => nvp.name.toLowerCase() === name.toLowerCase());
        return matchingNameValuePair && matchingNameValuePair.value ? matchingNameValuePair.value : '';
    }
}