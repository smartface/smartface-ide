import NavigationController = require('@smartface/native/ui/navigationcontroller');
import Page = require('@smartface/native/ui/page');
import View = require('@smartface/native/ui/view');

export declare abstract class Styleable {
    static $$styleContext: ComponentStyleContext;
}

type ViewType = View | NavigationController;

export type ComponentStyleContext = {
    classNames: string,
    defaultClassNames: string,
    userProps: { [key: string]: any },
    statusBar?: {
        classNames: string,
        defaultClassNames: string,
        userProps: { [key: string]: any }
    },
    headerBar?: {
        classNames: string,
        defaultClassNames: string,
        userProps: { [key: string]: any }
    }
}

export abstract class StyledPage extends Page {
    private children: Map<string, ViewType>;

    static $$styleContext: ComponentStyleContext;

    constructor(params: any) {
        super(params);
        this.children = new Map();
        this.addChild('statusBar', this.statusBar);
        this.addChild('headerBar', this.headerBar);
        if (this.ios) {
            this.ios.safeAreaLayoutMode = true;
        }
    }

    protected addChild(name: string, child: Object) {
        this.children.set(name, child);
        if (this.layout) {
            this.layout.addChild(child);
        } else {
            this.addChild(child);
        }
    }
}