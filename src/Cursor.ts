import { assertIsDefined } from "./helpers";

export class Cursor {
  protected _cursor: HTMLDivElement;
  protected _container?: HTMLElement;
  protected _rectContainer?: DOMRect;

  constructor() {
    this._cursor = document.createElement('div');
    this._cursor.className = 'player-cursor';
  }

  initialize(container: HTMLElement) {
    this._container = container;
    this._rectContainer = container.getBoundingClientRect();
    container.appendChild(this._cursor);
  }

  moveTo(x: number, y: number, height: number) {
    assertIsDefined(this._container);
    assertIsDefined(this._rectContainer);
    const cx = x - this._rectContainer.left /*+ this._container.scrollLeft*/;
    const cy = y - this._rectContainer.top /*+ this._container.scrollTop*/;
    this._cursor.style.transform = `translate(${cx}px,${cy}px)`;
    this._cursor.style.height = `${height}px`;
  }

  destroy(): void {
    this._cursor.remove();
  }
}
