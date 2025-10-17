export declare class Cursor {
    protected _cursor: HTMLDivElement;
    protected _container?: HTMLElement;
    protected _rectContainer?: DOMRect;
    constructor();
    initialize(container: HTMLElement): void;
    moveTo(x: number, y: number, height: number): void;
    destroy(): void;
}
//# sourceMappingURL=Cursor.d.ts.map