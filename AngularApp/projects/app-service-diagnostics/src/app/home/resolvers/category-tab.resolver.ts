import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { CategoryService } from '../../shared-v2/services/category.service';
import { Observable, of } from 'rxjs';
import { GenericCategoryFlow } from '../../supportbot/message-flow/v2-flows/generic-category.flow';
import { mergeMap, first, map } from 'rxjs/operators';

@Injectable()
export class CategoryTabResolver implements Resolve<Observable<string>> {
    constructor(private _categoryService: CategoryService) { }

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot): Observable<string> {
       if (activatedRouteSnapshot.params && activatedRouteSnapshot.params.category) {
           return this._categoryService.categories.pipe(map(categories => {
               return categories.find(category => category.id === activatedRouteSnapshot.params.category).name;
            }), first());
       }

       return of('Genie');
    }
}

@Injectable()
export class CategoryChatResolver implements Resolve<Observable<any>> {
    constructor(private _categoryService: CategoryService, private _genericCategoryService: GenericCategoryFlow) { }

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot): Observable<any> {
       if (activatedRouteSnapshot.params && activatedRouteSnapshot.params.category) {
           return this._categoryService.categories.pipe(mergeMap(categories => {
               const category = categories.find(category => category.id === activatedRouteSnapshot.params.category);
               return this._genericCategoryService.createMessageFlowForCategory(category);
           }), first());
       }

       return of('Genie');
    }
}
