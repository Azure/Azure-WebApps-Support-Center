import { Component, Input, OnInit, ViewEncapsulation, ElementRef, HostBinding, ViewChild, Renderer } from '@angular/core';
import { Subcategory } from '../../models/problem-category';
import { NguCarousel, NguCarouselStore, NguCarouselService } from '@ngu/carousel';
import { LoggingService } from '../../services/logging/logging.service';

@Component({
    selector: 'scrolling-tile',
    templateUrl: 'scrolling-tile.component.html',
    styleUrls: ['scrolling-tile.component.css']
})

export class ScrollingTileComponent implements OnInit {

    @Input() public Subcategories: Subcategory[];
    @Input() public Collapsed: boolean;

    public carouselTile: NguCarousel;

    constructor(private _logger: LoggingService, private carousel: NguCarouselService, private el: ElementRef, private renderer: Renderer) {
    }

    logCategorySelected(name: string) {
        this._logger.LogClickEvent(name, 'Home Page');
    }


    ngOnInit() {

        if (this.Subcategories.length > 0) {
            this.carouselTile = {
                grid: { xs: 0, sm: 0, md: 0, lg: 0, all: 135 },
                speed: 1000,
                interval: 3000,
                point: {
                    visible: false
                },
                load: 1,
                touch: false
            };
        }
    }
}