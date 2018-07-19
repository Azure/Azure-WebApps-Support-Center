import { Resolve, ActivatedRouteSnapshot } from "@angular/router";
import { Injectable } from "@angular/core";
import { CategoryService } from "../../shared-v2/services/category.service";

@Injectable()
export class CategoryTabResolver implements Resolve<string>{
    constructor(private _categoryService: CategoryService) { }

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot): string {
       if(activatedRouteSnapshot.params && activatedRouteSnapshot.params.category) {
           return this._categoryService.categories.find(category => category.id === activatedRouteSnapshot.params.category).name;
       }

       return 'Genie';
    }
}