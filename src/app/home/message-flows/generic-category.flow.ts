import { Injectable } from '@angular/core';
import { RegisterMessageFlowWithFactory } from '../../supportbot/message-flow/message-flow.factory';
import { IMessageFlowProvider } from '../../supportbot/interfaces/imessageflowprovider';
import { MessageGroup } from '../../supportbot/models/message-group';
import { TextMessage, ButtonListMessage } from '../../supportbot/models/message';
import { MessageSender, ButtonActionType } from '../../supportbot/models/message-enums';
import { Observable } from '../../../../node_modules/rxjs';
import { Category } from '../../shared-v2/models/category';
import { DiagnosticService } from 'applens-diagnostics';
import { DetectorMetaData } from '../../../../node_modules/applens-diagnostics/src/app/diagnostic-data/models/detector';
import { CategoryMenuMessage } from '../../supportbot/message-flow/category-menu/category-menu.component';
import { CategoryChatState } from '../../shared-v2/models/category-chat-state';
import { DetectorSummaryComponent, DetectorSummaryMessage } from '../../supportbot/message-flow/detector-summary/detector-summary.component';
import { DocumentSearchMessage } from '../../supportbot/message-flow/document-search/document-search.component';
import { DocumentSearchResultsMessage } from '../../supportbot/message-flow/document-search-results/document-search-results.component';

@Injectable()
@RegisterMessageFlowWithFactory()
export class GenericCategoryFlow extends IMessageFlowProvider {

  messageFlowList: MessageGroup[] = [];

  constructor(private _diagnosticApiService: DiagnosticService) {
    super();

    var cpuAnalysisGroup: MessageGroup = new MessageGroup('generic-category', [], () => 'feedbackprompt');
    cpuAnalysisGroup.messages.push(new TextMessage('Hello! Welcome to App Service diagnostics! My name is Genie and I\'m here to help you diagnose and solve problems'));
    cpuAnalysisGroup.messages.push(new TextMessage('I noticed that your app was experiencing high CPU usage within the last 24 hours. Would you like me to show you more details about the issues we found?', MessageSender.System, 2000));

    var needMoreHelp: MessageGroup = new MessageGroup('more-help', [], () => 'feedback');
    needMoreHelp.messages.push(new TextMessage('I need further assistance', MessageSender.User));
    needMoreHelp.messages.push(new TextMessage('Sorry to hear I could not help you solve your problem', MessageSender.System));

    this.messageFlowList.push(cpuAnalysisGroup);
    this.messageFlowList.push(needMoreHelp);
  }

  GetMessageFlowList(): MessageGroup[] {
    return this.messageFlowList;
  }

  createMessageFlowForCategory(category: Category): Observable<MessageGroup[]> {
    let state = new CategoryChatState(category);

    return this._diagnosticApiService.getDetectors().map((detectors: DetectorMetaData[]) => {
      console.log('create message flow for ' + category.name);
      var messageGroupList: MessageGroup[] = [];

      let mainMenuId: string = `main-menu-${category.id}`;
      let moreHelpId: string = `more-help-${category.id}`;
      let showTiles: string = `show-all-tiles-${category.id}`

      var welcomeCategory: MessageGroup = new MessageGroup(`welcome-${category.id}`, [], () => mainMenuId);
      welcomeCategory.messages.push(new TextMessage('Hello! Welcome to App Service diagnostics! My name is Genie and I\'m here to help you diagnose and solve problems.'));
      welcomeCategory.messages.push(new TextMessage(`Here are some issues related to ${category.name} that I can help with. Please select the tile that best describes your issue.`, MessageSender.System, 500));

      var categoryMainMenu: MessageGroup = new MessageGroup(mainMenuId, [], () => 'feedback');
      categoryMainMenu.messages.push(new CategoryMenuMessage(detectors.filter(detector => detector.category && detector.category.toLowerCase() == category.name.toLowerCase()), state));
      categoryMainMenu.messages.push(new TextMessage('Okay give me a moment while I analyze your app for any issues related to this tile. Once the detectors load, feel free to click to investigate each topic further.', MessageSender.System, 500));
      categoryMainMenu.messages.push(new DetectorSummaryMessage(state));
      categoryMainMenu.messages.push(new TextMessage('Did you find what you were looking for?', MessageSender.System, 3000));
      categoryMainMenu.messages.push(new ButtonListMessage(this._getButtonListDidYouFindHelpful(showTiles, moreHelpId), 'Did you find what you were looking for?'));
      categoryMainMenu.messages.push(new TextMessage('Yes I found the right information.', MessageSender.User));
      categoryMainMenu.messages.push(new TextMessage('Great I\'m glad I could be of help!', MessageSender.System));

      var documentSearch: MessageGroup = new MessageGroup(moreHelpId, [], () => 'feedback');
      documentSearch.messages.push(new TextMessage('I need further assistance.', MessageSender.User));
      documentSearch.messages.push(new TextMessage('If you describe your problem, I can search relevant documentation that may help you.', MessageSender.System));
      documentSearch.messages.push(new DocumentSearchMessage(state));
      //documentSearch.messages.push(new ButtonListMessage(this._getButtonListForMoreHelpSearchResponse(mainMenuId), 'Did you find what you were looking for?', MessageSender.User));
      //documentSearch.messages.push(new DocumentSearchResultsMessage(state));
      documentSearch.messages.push(new TextMessage('Was this helpful to finding what you were looking for?', MessageSender.System, 2000));
      documentSearch.messages.push(new ButtonListMessage(this._getButtonListDidYouFindHelpful(showTiles, 'more-help'), 'Did you find what you were looking for?'));
      documentSearch.messages.push(new TextMessage('Yes I found the right information.', MessageSender.User));
      documentSearch.messages.push(new TextMessage('Great I\'m glad I could be of help!', MessageSender.System));

      var showAllTiles: MessageGroup = new MessageGroup(showTiles, [], () => mainMenuId);
      showAllTiles.messages.push(new TextMessage('Show all tiles.', MessageSender.User));
      showAllTiles.messages.push(new TextMessage('Here are all the tiles related to Configuration and Management:', MessageSender.System));


      this.messageFlowList.push(welcomeCategory);
      this.messageFlowList.push(categoryMainMenu);
      this.messageFlowList.push(documentSearch);
      this.messageFlowList.push(showAllTiles);

      return messageGroupList;
    });
  }

  private _getButtonListForMoreHelpSearchResponse(mainMenuId: string): any {
    return [{
      title: 'Search',
      type: ButtonActionType.Continue,
      next_key: ''
    },
    {
      title: 'Show All Tiles',
      type: ButtonActionType.SwitchToOtherMessageGroup,
      next_key: mainMenuId
    }];
  }

  private _getButtonListDidYouFindHelpful(mainMenuId: string, furtherAssistance: string): any {
    return [{
      title: 'Yes I found the right information',
      type: ButtonActionType.Continue,
      next_key: ''
    }, {
      title: 'I need further assistance',
      type: ButtonActionType.SwitchToOtherMessageGroup,
      next_key: furtherAssistance
    },
    {
      title: 'Show All Tiles',
      type: ButtonActionType.SwitchToOtherMessageGroup,
      next_key: mainMenuId
    }];
  }
}
