import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AutohealingConfigSummaryComponent } from './autohealing-config-summary/autohealing-config-summary.component';
import { AutohealingCustomActionComponent } from './autohealing-custom-action/autohealing-custom-action.component';
import { AutohealingMemoryRuleComponent } from './autohealing-memory-rule/autohealing-memory-rule.component';
import { AutohealingRequestsRuleComponent } from './autohealing-requests-rule/autohealing-requests-rule.component';
import { AutohealingSlowrequestsRuleComponent } from './autohealing-slowrequests-rule/autohealing-slowrequests-rule.component';
import { AutohealingStartupTimeComponent } from './autohealing-startup-time/autohealing-startup-time.component';
import { AutohealingStatuscodesRuleComponent } from './autohealing-statuscodes-rule/autohealing-statuscodes-rule.component';
import { AutohealingComponent } from './autohealing.component';
import { ProactiveAutohealingComponent } from './proactive-autohealing/proactive-autohealing.component';

@NgModule({
  declarations: [
    AutohealingComponent,
    AutohealingConfigSummaryComponent,
    AutohealingCustomActionComponent,
    AutohealingMemoryRuleComponent,
    AutohealingRequestsRuleComponent,
    AutohealingSlowrequestsRuleComponent,
    AutohealingStartupTimeComponent,
    AutohealingStatuscodesRuleComponent,
    ProactiveAutohealingComponent
  ],
  imports: [
    SharedModule
  ],
  exports: [
    AutohealingComponent
  ],
})
export class AutoHealingModule { }
