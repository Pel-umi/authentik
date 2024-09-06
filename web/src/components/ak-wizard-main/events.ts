export class WizardNavigationEvent extends Event {
    destination: string;
    static readonly eventName = "ak-wizard-navigation";
    constructor(destination: string) {
        super(WizardNavigationEvent.eventName, { bubbles: true, composed: true });
        this.destination = destination;
    }
}

export class WizardUpdateEvent<T> extends Event {
    static readonly eventName = "ak-wizard-update";
    content: T;
    constructor(content: T) {
        super(WizardUpdateEvent.eventName, { bubbles: true, composed: true });
        this.content = content;
    }
}

export class WizardCloseEvent extends Event {
    static readonly eventName = "ak-wizard-close";
    constructor() {
        super(WizardCloseEvent.eventName, { bubbles: true, composed: true });
    }
}

declare global {
    interface GlobalEventHandlersEventMap {
        [WizardNavigationEvent.eventName]: WizardNavigationEvent;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [WizardUpdateEvent.eventName]: WizardUpdateEvent<any>;
        [WizardCloseEvent.eventName]: WizardCloseEvent;
    }
}
