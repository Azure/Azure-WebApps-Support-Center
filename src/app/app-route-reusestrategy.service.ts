import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from "@angular/router";
import { getParentRenderElement } from "../../node_modules/@angular/core/src/view/util";

export class CustomReuseStrategy implements RouteReuseStrategy {

    handlers: { [key: string]: DetachedRouteHandle } = {};

     /**
     * Determines if this route (and its subtree) should be detached to be reused later.
     */
    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        console.log('shouldDetach');
        console.log(route);
        if (!route.routeConfig) return false;
        if (route.routeConfig.loadChildren) return false;
        return !!route.data && !!(route.data as any).cacheComponent; 
    }

    /**
     * Stores the detached route.
     */
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        let url = this._getUrl(route);
        console.log('storing: ' + url);
        this.handlers[url] = handle;
    }

    /**
     * Determines if this route (and its subtree) should be reattached.
     */
    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        let url = this._getUrl(route);
        // console.log(route.routeConfig);
        console.log(url);
        console.log(!!route.routeConfig && !!this.handlers[url]);
        return !!route.routeConfig && !!this.handlers[url];
    }

    /**
     * Retrieves the previously stored route.
     */
    retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
        
        if (!route.routeConfig) return null;
        if (route.routeConfig.loadChildren) return null;

        let url = this._getUrl(route);
        return this.handlers[url];
    }

    /**
     * Determines if a route should be reused.
     */
    shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {

        if (curr.routeConfig === null && future.routeConfig === null) {
            return true;
        }

        // never reuse routes with incompatible configurations
        if (future.routeConfig !== curr.routeConfig) {
            console.log('never reuse routes with incompatible configurations');
            return false;
        }

        // console.log(this._getUrl(future));
        // console.log(this._getUrl(curr));
        if(this._getUrl(future) === this._getUrl(curr)){
            console.log('should reuse route')
        }
        
        return this._getUrl(future) === this._getUrl(curr);
        
    }

    private _getUrl(route: ActivatedRouteSnapshot): string {
        let topLevelParent = this._getParent(route);
        let fullUrl = this._getFullUrl(topLevelParent);

        var url = route.url.join('/');
        // route.url.forEach((item) => {
        //     url += `${item.path}/`;
        // });

        // console.log('fullUrl: ' + fullUrl);
        // console.log('url: ' + url);

        return fullUrl;
    }

    private _getParent(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
        return route.parent ? this._getParent(route.parent) : route;
    }

    // private _getFullUrlSegment(route: ActivatedRouteSnapshot) {
    //     if(!route) {

    //     }

    //     return route.data this._getFullUrlSegment()
    // }

    private _getFullUrl(route: ActivatedRouteSnapshot): string {
        if(!route) {
            return null;
        }

        let childRoute = this._getFullUrl(route.firstChild);
        let currentRoute = route.url.join('/');


        return childRoute && childRoute !== '' ? [currentRoute, childRoute].join('/') : currentRoute;
    }
}
