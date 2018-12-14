import { INameValuePair } from '../namevaluepair';
import { SolutionType, ActionType } from '../enumerations';
import { SolutionProperties } from './solutionproperties';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';

export abstract class SolutionUIModelBase {
    private hasBeenExpanded = false;

    constructor(public rank: number, public properties: SolutionProperties, protected _logger: AvailabilityLoggingService) {
    }

    public execute(): void {
        this.run();
    }

    protected abstract run(): void;

    public logExpandSolutionEvent(opened: boolean): void {
        if (!this.hasBeenExpanded && opened) {
            this._logger.LogSolutionExpanded(this.properties.title, this.rank.toString());
            this.hasBeenExpanded = true;
        }
    }
}
