import { ResizerControl, ResizerElement } from "./resizer-control";
import $events from "../events-manager";

export class BoxControl {
  private box: HTMLDivElement;
  private defaultHalfSize: number;
  private anchor = {
    x: 0,
    y: 0,
  };
  private resizerCtrl: ResizerControl;

  constructor(private sea: HTMLElement, private prefix: string, private minBoxSize: number, defaultSize: number) {
    this.box = this.createBox(0, 0, 0, 0);
    this.defaultHalfSize = defaultSize / 2;
    this.resizerCtrl = new ResizerControl(prefix);
  }

  private set boxStyle(style: Partial<CSSStyleDeclaration>) {
    for (const key in style) {
      if (style[key]) this.box.style[key] = style[key];
    }
  }

  private get boxRect() {
    return this.box.getBoundingClientRect();
  }

  private removeBox = () => {
    if (this.sea.contains(this.box)) {
      this.sea.removeChild(this.box);
    }
  };

  // ========== SETUP BOX ==========

  private createBox = (left: number, top: number, width: number, height: number) => {
    const box = document.createElement("div");
    box.id = `${this.prefix}-box`;

    this.box = box;
    this.boxStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
    return box;
  };

  private updateAnchor = ({ x, y }: { x: number; y: number } = this.boxRect) => {
    this.anchor = { x, y };
  };

  private createNewBox = (left: number, top: number, width = 0, height = 0) => {
    /** Only 1 box at a time so we remove old box */
    this.removeBox();
    this.createBox(left, top, width, height);
    this.sea.appendChild(this.box);
    this.updateAnchor();
  };

  // ========== DEPLOY BOX ==========

  private resizeBox = (e: MouseEvent) => {
    const { x, y } = this.anchor;

    this.boxStyle = {
      left: `${Math.min(e.x, x)}px`,
      top: `${Math.min(e.y, y)}px`,
      width: `${Math.abs(e.x - x)}px`,
      height: `${Math.abs(e.y - y)}px`,
    };
  };

  private unsubscribeDeployment = () => {
    $events.unsubscribe("mousemove", this.resizeBox);
    $events.unsubscribe("mouseup", this.endBoxDeployment);
  };

  startBoxDeployment = (e: MouseEvent) => {
    this.createNewBox(e.x, e.y);

    $events.subscribe("mousemove", this.resizeBox);
    $events.subscribe("mouseup", this.endBoxDeployment);
  };

  private endBoxDeployment = (e: MouseEvent) => {
    const { width, height } = this.boxRect;

    // If the box user drew is too small, launch new box with default size
    if (width < this.minBoxSize || height < this.minBoxSize) {
      const { clientWidth, clientHeight } = document.documentElement;
      const startX = Math.max(Math.min(e.x, clientWidth - this.defaultHalfSize) - this.defaultHalfSize, 0);
      const startY = Math.max(Math.min(e.y, clientHeight - this.defaultHalfSize) - this.defaultHalfSize, 0);

      this.createNewBox(startX, startY, this.defaultHalfSize * 2, this.defaultHalfSize * 2);
    }

    /**
     * Style finished box here
     */
    this.box.classList.add(`${this.prefix}-box--finished`);

    const maxResizerSize = Math.floor(Math.min(this.box.clientWidth, this.box.clientHeight) * 0.45);
    this.resizerCtrl.addResizers(this.box, maxResizerSize);

    this.updateAnchor();
    this.unsubscribeDeployment();
  };

  // ========== ADJUST BOX ==========

  isBoxResizer = (elmt: HTMLElement) => {
    return this.resizerCtrl.isResizer(elmt);
  };

  startBoxAdjustment = (resizer: ResizerElement) => {
    const { boxRect } = this;

    switch (resizer.__direction) {
      case "TL":
        this.updateAnchor({
          x: boxRect.right,
          y: boxRect.bottom,
        });
        break;
      case "TR":
        this.updateAnchor({
          x: boxRect.left,
          y: boxRect.bottom,
        });
        break;
      case "BR":
        this.updateAnchor(boxRect);
        break;
      case "BL":
        this.updateAnchor({
          x: boxRect.right,
          y: boxRect.top,
        });
        break;
    }

    $events.subscribe("mousemove", this.resizeBox);
    $events.subscribe("mouseup", this.endBoxAdjustment);
  };

  private endBoxAdjustment = () => {
    this.updateAnchor();
    this.unsubscribeAdjustment();
  };

  private unsubscribeAdjustment = () => {
    $events.unsubscribe("mousemove", this.resizeBox);
    $events.unsubscribe("mouseup", this.endBoxAdjustment);
  };

  disconnect = () => {
    this.unsubscribeAdjustment();
    this.unsubscribeDeployment();
    this.removeBox();
  };
}
