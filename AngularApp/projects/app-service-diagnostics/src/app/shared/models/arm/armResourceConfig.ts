import { Category } from "../../../shared-v2/models/category";
import { MessageGroup } from "../../../supportbot/models/message-group";

export class ArmResourceConfig {
	homePageText?: HomePageText;
	matchRegEx?: string;
	searchSuffix?: string;
	azureServiceName?: string;
	armApiVersion?: string;
	isSearchEnabled?: boolean;
	isApplicableForLiveChat?: boolean;
	categories?: Array<Category>;
	pesId?: string;
}

export interface GenieConfig {
	isGenieEnabled: boolean;
	Messages: MessageGroup[];
}

export class HomePageText {
	title: string;
	description: string;
	searchBarPlaceHolder: string;
}

export enum ResourceDescriptorGroups {
	subscription = 1,
	resourceGroup = 3,
	provider = 4,
	resource = 5
}
export class ResourceDescriptor {
	constructor() {
		this.subscription = '';
		this.resourceGroup = '';
		this.provider = '';
		this.type = '';
		this.resource = '';
		this.types = [];
		this.resources = [];
		this.resourceUriRegExp = new RegExp('/subscriptions/([^/]+)/(resourceGroups/([^/]+)/)?providers/([^/]+)/(.+)', "i");
	}
	subscription: string;
	resourceGroup: string;
	provider: string;
	type: string;
	resource: string;
	types: Array<string>;
	resources: Array<string>;
	resourceUriRegExp:RegExp;
}