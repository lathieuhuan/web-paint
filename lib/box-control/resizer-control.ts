import { Direction } from "./configs";

export type ResizerElement = HTMLDivElement & {
  __direction: Direction;
};

export class ResizerControl {
  private identityCls: string;

  constructor(prefix: string) {
    this.identityCls = `${prefix}-box-resizer`;
  }

  private makeResizer(direction: Direction, maxResizerSize: number): ResizerElement {
    const resizer = document.createElement("div");
    resizer.id = `${this.identityCls}-${direction}`;
    resizer.className = `${this.identityCls} ${this.identityCls}--${direction.toLowerCase()}`;
    resizer.style.maxWidth = `${maxResizerSize}px`;
    resizer.style.maxHeight = `${maxResizerSize}px`;

    Object.assign(resizer, { __direction: direction });

    return resizer as ResizerElement;
  }

  addResizers(box: HTMLElement, maxResizerSize: number) {
    const DIRECTIONS: Direction[] = ["TL", "TR", "BR", "BL"];

    for (const direction of DIRECTIONS) {
      box.appendChild(this.makeResizer(direction, maxResizerSize));
    }
  }

  isResizer(elmt: HTMLElement | ResizerElement): elmt is ResizerElement {
    return elmt.classList.contains(this.identityCls);
  }
}
