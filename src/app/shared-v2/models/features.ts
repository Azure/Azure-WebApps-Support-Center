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
            name: 'Docuementation',
            icon: 'fa-book',
            color: 'rgb(138, 87, 85)'
        };

    static All: FeatureType[] = [FeatureTypes.Detector, FeatureTypes.Tool, FeatureTypes.Documentation]
}

export interface Feature {
    name: string;
    id: string;
    description: string;
    category: string;
    featureType: FeatureType;
    path: string;
    href: string;
}