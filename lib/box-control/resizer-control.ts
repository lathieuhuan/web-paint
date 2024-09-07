import ClassName from "../class-name";
import { ResizeDirection } from "./configs";

const ENTITY_NAME = "box_resizer";

export class ResizerControl {
  private cls: ClassName;

  constructor(identifier?: string) {
    this.cls = new ClassName(ENTITY_NAME, identifier);
  }

  private makeResizer(direction: ResizeDirection, maxResizerSize: string) {
    const resizer = document.createElement("div");
    resizer.className = this.cls.toString(direction);
    resizer.style.maxWidth = maxResizerSize;
    resizer.dataset.entity = ENTITY_NAME;
    resizer.dataset.direction = direction;

    return resizer;
  }

  addResizers(box: HTMLElement, maxResizerSize: string) {
    const DIRECTIONS: ResizeDirection[] = ["tl", "tr", "br", "bl"];

    for (const direction of DIRECTIONS) {
      box.appendChild(this.makeResizer(direction, maxResizerSize));
    }
  }

  directionOf(elmt: HTMLElement) {
    return elmt.dataset.entity === ENTITY_NAME ? (elmt.dataset.direction as ResizeDirection) : null;
  }
}
