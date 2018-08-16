import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from "@angular/router";
import { getParentRenderElement } from "../../node_modules/@angular/core/src/view/util";
import { Injectable } from "../../node_modules/@angular/core";

@Injectable()
export class CustomReuseStrategy implements RouteReuseStrategy {

    handlers: { [key: string]: DetachedRouteHandle } = {};

    closedTab: string;

     /**
     * Determines if this route (and its subtree) should be detached to be reused later.
     */
    shouldDetach(route: ActivatedRouteSnapshot): boolean {
        let url = this._getUrl(route);

        if (!route.routeConfig) return false;
        if (route.routeConfig.loadChildren) return false;
        return !!route.data && !!(route.data as any).cacheComponent; 
    }

    /**
     * Stores the detached route.
     */
    store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
        let url = this._getUrl(route);

        if(this.closedTab === url) {
            console.log('do not store closed tab: ' + this.closedTab);
            this.closedTab = null;
            return;
        }

        
        console.log('storing: ' + url);
        this.handlers[url] = handle;
    }

    /**
     * Determines if this route (and its subtree) should be reattached.
     */
    shouldAttach(route: ActivatedRouteSnapshot): boolean {
        let url = this._getUrl(route);
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

    removeCachedRoute(url: string) {
        //url = url.replace('/', '');
        console.info('DELETING: ' + url);
        this.closedTab = url;
        this.handlers[url] = null;
    }

    private _getUrl(route: ActivatedRouteSnapshot): string {
        let topLevelParent = this._getParent(route);
        let fullUrl = '/' + this._getFullUrl(topLevelParent);

        return fullUrl;
    }

    private _getParent(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
        return route.parent ? this._getParent(route.parent) : route;
    }

    private _getFullUrl(route: ActivatedRouteSnapshot): string {
        if(!route) {
            return null;
        }

        let childRoute = this._getFullUrl(route.firstChild);
        if(!route.url || route.url.length === 0) {
            return childRoute;
        }
        
        let currentRoute = route.url.join('/');
        let returnValue = childRoute && childRoute !== '' ? [currentRoute, childRoute].join('/') : currentRoute;
        return returnValue;
    }
}
