import NavigationController from '@smartface/native/ui/navigationcontroller';
import Page from '@smartface/native/ui/page';
import View from '@smartface/native/ui/view';
import { ComponentStyleContext } from './ComponentStyleContext';

export declare abstract class Styleable {
  static $$styleContext: ComponentStyleContext;
}

export type ViewType = View | NavigationController;

export interface ComponentWithNamedChildren {
  addChildByName(name: string, child: View);
}

export interface ComponentConstructor {
  new (params?: any);
}
