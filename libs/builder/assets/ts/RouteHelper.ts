import { Route } from '@smartface/router';
import Page from '@smartface/native/ui/page';

export default class RouteHelper extends Route {
  private _headerBarParams: { visible: boolean };

  constructor(params) {
    super({ headerBarParams: () => this._headerBarParams, ...params });
  }

  //@ts-ignore
  set routeDidEnter(_routeDidEnter) {
    //@ts-ignore
    this.emitRouteDidEnter = _routeDidEnter;
  }
  //@ts-ignore
  set routeDidExit(_routeDidExit) {
    //@ts-ignore
    this.emitRouteDidExit = _routeDidExit;
  }
  set routeWillEnter(_routeWillEnter) {
    //@ts-ignore
    this.emitRouteWillEnter = _routeWillEnter;
  }
  set headerBarParams(_headerBarParams) {
    this._headerBarParams = _headerBarParams;
  }

  //@ts-ignore
  get build(): any {
    //@ts-ignore
    return this._build;
  }

  //@ts-ignore
  set build(_build) {
    //@ts-ignore
    this._build = _build;
  }
}
