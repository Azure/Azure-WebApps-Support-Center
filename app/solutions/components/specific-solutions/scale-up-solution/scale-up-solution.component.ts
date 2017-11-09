import { Component, Input } from '@angular/core';
import { SolutionBaseComponent } from '../../common/solution-base/solution-base.component';
import { SolutionData } from '../../../../shared/models/solution';
import { ServerFarmDataService, PortalActionService } from '../../../../shared/services';
import { ServerFarm } from '../../../../shared/models/server-farm';


@Component({
    templateUrl: 'scale-up-solution.component.html',
    styleUrls: ['../../../styles/solutions.css',
        'scale-up-solution.component.css'
    ]
})
export class ScaleUpSolutionComponent implements SolutionBaseComponent {

    @Input() data: SolutionData;

    title: string = "Scale up your App Service Plan";
    description: string = "Increase the size of the instances in your app service plan. Each instance will have more cores (CPU), memory, and disk space.";

    whyToScale: string[] = [
        "Your app is designed to do a lot of processing that requires a high amount of CPU and you want more cores for each instance",
        "Your app is designed to need a lot of memory. You want each instance to have a larger RAM size. "
    ];

    whyNotToScale: string[] = [
        "Your app is experiencing high CPU or memory, but it is not designed to. This could be the result of a bug in your app code and scaling will not necessarily help.",
        "You experience high resource usage during the hours of peak traffic for your app. A more cost effective solution would be AutoScale."
    ];

    currentServerFarm: ServerFarm;

    suggestion: string;

    secondarySuggestion: string;

    constructor(private _serverFarmService: ServerFarmDataService, private _portalActionService: PortalActionService) {
        this._serverFarmService.getSiteServerFarm().subscribe(serverFarm => {
            if (serverFarm) {
                console.log(serverFarm);
                this.currentServerFarm = serverFarm;
                this.generateSuggestion();
            }
        }, error => {
            //TODO: handle error
        })
    }

    generateSuggestion() {
        let sizeId = parseInt(this.currentServerFarm.sku.name.replace(this.currentServerFarm.sku.family, ''));

        // TODO: if it is an ASE, we should offer premium sized instances

        if (sizeId < 3) {
            this.suggestion = `You can increase your App Service Plan to the next tier <b>${this.currentServerFarm.sku.family + (sizeId + 1)}</b>. ` +
                `This would increase your RAM size to <b>${this.currentServerFarm.additionalProperties.ramInGB * 2}GB</b> ` +
                `and the number of cores to <b>${this.currentServerFarm.additionalProperties.cores * 2}</b>.`

            this.secondarySuggestion = "<b>Note:</b> Scaling up will increase the cost of your App Service Plan. You can try scaling up and see if it solves your problem, and if not scale back down."
        }
        else {
            this.suggestion = 'You are already scaled to the maximum instance size. You could try scaling out instead.'
        }
    }

    openBlade() {
        this._portalActionService.openBladeScaleUpBlade();
    }
}
