import { ResizeDirection } from "./configs";

const ENTITY_NAME = "RESIZER";

export class ResizerControl {
  private identityCls: string;

  constructor(prefix: string) {
    this.identityCls = `${prefix}-box_resizer`;
  }

  private makeResizer(direction: ResizeDirection, maxResizerSize: number) {
    const resizer = document.createElement("div");
    resizer.id = `${this.identityCls}-${direction}`;
    resizer.className = `${this.identityCls} ${this.identityCls}--${direction.toLowerCase()}`;
    resizer.style.maxWidth = `${maxResizerSize}px`;
    resizer.style.maxHeight = `${maxResizerSize}px`;
    resizer.dataset.entity = ENTITY_NAME;
    resizer.dataset.direction = direction;

    return resizer;
  }

  addResizers(box: HTMLElement, maxResizerSize: number) {
    const DIRECTIONS: ResizeDirection[] = ["TL", "TR", "BR", "BL"];

    for (const direction of DIRECTIONS) {
      box.appendChild(this.makeResizer(direction, maxResizerSize));
    }
  }

  directionOf(elmt: HTMLElement) {
    return elmt.dataset.entity === ENTITY_NAME ? (elmt.dataset.direction as ResizeDirection) : null;
  }
}
