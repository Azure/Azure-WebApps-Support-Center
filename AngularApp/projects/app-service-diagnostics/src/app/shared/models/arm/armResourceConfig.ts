import { Category } from "../../../shared-v2/models/category";
import { MessageGroup } from "../../../supportbot/models/message-group";

export class ArmResourceConfig {
	homePageText?: HomePageText;
	matchRegEx?: string;
	searchSuffix?: string;
	azureServiceName?: string;
	armApiVersion?: string;
	isSearchEnabled?: boolean;
	liveChatConfig?: LiveChatConfig
	categories?: Array<Category>;
	pesId?: string;
}

export interface LiveChatConfig {
	isApplicableForLiveChat?: boolean;
	supportTopicIds?: string[];
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
