import { NavigationExtras } from "@angular/router";

export interface FeatureType {
    name: string;
    id: string;
    icon: string;
    color: string;
}

export class FeatureTypes {

    static Detector: FeatureType =
        {
            id: 'detector',
            name: 'Detector',
            icon: 'fa-bar-chart',
            color: 'rgb(85, 113, 138)'
        };

    static Tool: FeatureType =
        {
            id: 'tool',
            name: 'Tool',
            icon: 'fa-wrench',
            color: 'rgb(85, 138, 89)'
        };

    static Documentation: FeatureType =
        {
            id: 'docs',
            name: 'Documentation',
            icon: 'fa-book',
            color: 'rgb(138, 87, 85)'
        };

    static All: FeatureType[] = [FeatureTypes.Detector, FeatureTypes.Tool, FeatureTypes.Documentation]
}

export interface FeatureAction {
    (): void;
}

export interface Feature {
    name: string;
    id: string;
    description: string;
    category: string;
    featureType: FeatureType;
    clickAction: FeatureAction;
}

// export class GenericDetectorFeature extends Feature {
//     onClick() {
//         let navigationExtras: NavigationExtras = {
//             queryParamsHandling: 'preserve',
//             preserveFragment: true,
//             relativeTo: this._activatedRoute.parent
//           };
      
//           this._router.navigate(path.split('/'), navigationExtras);
//     }
// }