import { Component, OnInit } from '@angular/core';
import { FabSpinnerComponent } from '@angular-react/fabric';

@Component({
    selector: 'loader-detector-view',
    templateUrl: './loader-detector-view.component.html',
    styleUrls: ['./loader-detector-view.component.scss']
})
export class LoaderDetectorViewComponent implements OnInit {

    message: string = "loading detector view";
    imgSrc: string = "assets/img/loading-detector-view/fetching_logs.svg";
    loadingString: string = "Fetching properties and logs ...";
    delay: number = 2000;
    timer: any = 0;
    i: number = 0;
    loadingStages: LoadingStage[] = [
        {
            duration: 2000,
            imgSrc: "assets/img/loading-detector-view/fetching_logs.svg",
            loadingString: "Fetching properties and logs ..."
        },
        {
            duration: 2000,
            imgSrc: "assets/img/loading-detector-view/analyzing_data.svg",
            loadingString: "Analyzing data ..."
        },
        {
            duration: 3000,
            imgSrc: "assets/img/loading-detector-view/checking_health.svg",
            loadingString: "Checking resource health ..."
        },
        {
            duration: 3000,
            imgSrc: "assets/img/loading-detector-view/generating_report.svg",
            loadingString: "Generating report ..."
        }
    ];

    constructor() {
    }

    ngOnInit() {
        this.loading();
    }

    // This is the loading function for each stage. We set a random time out for each stage.
    loading() {
        window.clearTimeout(this.timer);

        // Display the next loading stage after a random timeout
        this.timer = setTimeout(() => {
            if (this.i < this.loadingStages.length) {
                this.delay = this.i === 0 ? 0 : this.random(this.loadingStages[this.i - 1].duration);
                this.imgSrc = this.loadingStages[this.i].imgSrc;
                this.loadingString = this.loadingStages[this.i].loadingString;
                this.i++;
                this.loading();
            }
        }, this.delay);
    }

    // Generate a random delay to load the next stage, the random number will be at least 1000 miliseconds in case the random number is too small.
    random(n): number {
        return Math.random() * n + 1000;
    }

    ngOnDestroy() {
        window.clearTimeout(this.timer);
    }
}

export interface LoadingStage {
    duration: number,
    imgSrc: string,
    loadingString: string
}
