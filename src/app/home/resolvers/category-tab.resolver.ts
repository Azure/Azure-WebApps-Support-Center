import { Resolve, ActivatedRouteSnapshot } from "@angular/router";
import { Injectable } from "@angular/core";
import { CategoryService } from "../../shared-v2/services/category.service";
import { Observable } from "../../../../node_modules/rxjs";
import { GenericCategoryFlow } from "../message-flows/generic-category.flow";
import { Category } from "../../shared-v2/models/category";

@Injectable()
export class CategoryTabResolver implements Resolve<Observable<string>>{
    constructor(private _categoryService: CategoryService) { }

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot): Observable<string> {
       if (activatedRouteSnapshot.params && activatedRouteSnapshot.params.category) {
           return this._categoryService.categories.map(categories => {
               return categories.find(category => category.id === activatedRouteSnapshot.params.category).name;
           }).first();
       }

       return Observable.of('Genie');
    }
}

@Injectable()
export class CategoryChatResolver implements Resolve<Observable<any>>{
    constructor(private _categoryService: CategoryService, private _genericCategoryService: GenericCategoryFlow) { }

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot): Observable<any> {
       if (activatedRouteSnapshot.params && activatedRouteSnapshot.params.category) {
           return this._categoryService.categories.flatMap(categories => {
               let category = categories.find(category => category.id === activatedRouteSnapshot.params.category);
               return this._genericCategoryService.createMessageFlowForCategory(category);
           }).first();
       }

       return Observable.of('Genie');
    }
}