import { Category } from "./category";
import { DetectorMetaData } from "../../../../node_modules/applens-diagnostics/src/app/diagnostic-data/models/detector";

export class CategoryChatState {
    category: Category;
    selectedDetector: DetectorMetaData;
    problemSearchValue: string;

    constructor(category: Category) {
        this.category = category;
    }

    makeMenuSelection(detector: DetectorMetaData) {
        console.log(detector);
        this.selectedDetector = detector;
    }
}