import { ResizerControl } from "./resizer-control";
import ListenersManager from "../listeners-manager";
import { ResizeDirection } from "./configs";

const ENTITY_BOX = "BOX";

export class BoxControl {
  private boxCls: string;
  private anchor = {
    x: 0,
    y: 0,
  };
  private resizerCtrl: ResizerControl;
  $listeners = new ListenersManager();

  private _currentBox: HTMLElement | undefined;
  private set currentBox(box: HTMLElement) {
    if (this._currentBox) {
      this._currentBox.classList.remove(`${this.boxCls}--current`);
    }
    this._currentBox = box;
    this._currentBox.classList.add(`${this.boxCls}--current`);
  }
  private get currentBox() {
    if (this._currentBox) {
      return this._currentBox;
    }
    console.error("No box was selected");
    return document.createElement("div");
  }

  constructor(
    prefix: string,
    private canvas: HTMLElement,
    private minBoxSize: number,
    private defaultHalfSize: number
  ) {
    this.boxCls = `${prefix}-box`;
    this.resizerCtrl = new ResizerControl(prefix);
  }

  private set currentBoxStyle(style: Partial<CSSStyleDeclaration>) {
    for (const key in style) {
      if (style[key]) this.currentBox.style[key] = style[key];
    }
  }

  private get currentBoxRect() {
    return this.currentBox.getBoundingClientRect();
  }

  startDrawing() {
    this.canvas.style.cursor = "crosshair";
    this.$listeners.add(this.canvas, "CANVAS", "mousedown", this.handleMousedown);
    this.$listeners.add(document.body, "DOCUMENT", "keydown", this.deleteCurrentBox);
  }

  private stopDrawing() {
    this.canvas.style.cursor = "default";
    this.$listeners.remove(this.canvas, "CANVAS", "mousedown", this.handleMousedown);
    this.$listeners.remove(document.body, "DOCUMENT", "keydown", this.deleteCurrentBox);
  }

  private handleMousedown = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      const direction = this.resizerCtrl.directionOf(e.target);

      if (direction) {
        this.currentBox = e.target.parentElement!;
        this.startBoxAdjustment(direction);
        return;
      }
      this.startBoxDeployment(e);
    }
  };

  private deleteCurrentBox = (e: KeyboardEvent) => {
    if (e.key === "Delete" && this._currentBox) {
      this.removeBox(this._currentBox);
    }
  };

  // ========== SETUP BOX ==========

  private createBox(left: number, top: number, width: number, height: number) {
    const currentBox = document.createElement("div");
    // currentBox.id = `${this.prefix}-box`;
    currentBox.className = this.boxCls;
    currentBox.dataset.entity = ENTITY_BOX;

    this.currentBox = currentBox;
    this.currentBoxStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
    return currentBox;
  }

  private updateAnchor({ x, y }: { x: number; y: number } = this.currentBoxRect) {
    this.anchor = { x, y };
  }

  private createNewBox(left: number, top: number, width = 0, height = 0) {
    /** Only 1 currentBox at a time so we remove old currentBox */
    // this.removeBox();
    this.createBox(left, top, width, height);
    this.canvas.appendChild(this.currentBox);
    this.updateAnchor();
  }

  private resizeBox = (e: MouseEvent) => {
    const { x, y } = this.anchor;

    this.currentBoxStyle = {
      left: `${Math.min(e.x, x)}px`,
      top: `${Math.min(e.y, y)}px`,
      width: `${Math.abs(e.x - x)}px`,
      height: `${Math.abs(e.y - y)}px`,
    };
  };

  private removeBox(box: HTMLElement) {
    if (this.canvas.contains(box)) {
      this.canvas.removeChild(box);
    }
  }

  // ========== DEPLOY BOX ==========

  private startBoxDeployment = (e: MouseEvent) => {
    this.createNewBox(e.x, e.y);

    this.$listeners.add(this.canvas, "CANVAS", "mousemove", this.resizeBox);
    this.$listeners.add(this.canvas, "CANVAS", "mouseup", this.endBoxDeployment);
  };

  private endBoxDeployment = (e: MouseEvent) => {
    const { width, height } = this.currentBoxRect;

    // If the currentBox user drew is too small, launch new currentBox with default size
    if (width < this.minBoxSize || height < this.minBoxSize) {
      const { clientWidth, clientHeight } = document.documentElement;
      const startX = Math.max(Math.min(e.x, clientWidth - this.defaultHalfSize) - this.defaultHalfSize, 0);
      const startY = Math.max(Math.min(e.y, clientHeight - this.defaultHalfSize) - this.defaultHalfSize, 0);

      this.removeBox(this.currentBox);
      this.createNewBox(startX, startY, this.defaultHalfSize * 2, this.defaultHalfSize * 2);
    }

    /**
     * Style finished currentBox here
     */
    this.currentBox.classList.add(`${this.boxCls}--finished`);

    const { width: currentWidth, height: currentHeight } = this.currentBoxRect;
    const maxResizerSize = Math.floor(Math.min(currentWidth, currentHeight) * 0.45);
    this.resizerCtrl.addResizers(this.currentBox, maxResizerSize);

    this.unsubscribeDeployment();
  };

  private unsubscribeDeployment = () => {
    this.$listeners.remove(this.canvas, "CANVAS", "mousemove", this.resizeBox);
    this.$listeners.remove(this.canvas, "CANVAS", "mouseup", this.endBoxDeployment);
  };

  // ========== ADJUST BOX ==========

  private startBoxAdjustment = (direction: ResizeDirection) => {
    const { currentBoxRect } = this;

    switch (direction) {
      case "TL":
        this.updateAnchor({
          x: currentBoxRect.right,
          y: currentBoxRect.bottom,
        });
        break;
      case "TR":
        this.updateAnchor({
          x: currentBoxRect.left,
          y: currentBoxRect.bottom,
        });
        break;
      case "BR":
        this.updateAnchor(currentBoxRect);
        break;
      case "BL":
        this.updateAnchor({
          x: currentBoxRect.right,
          y: currentBoxRect.top,
        });
        break;
    }

    this.$listeners.add(this.canvas, "CANVAS", "mousemove", this.resizeBox);
    this.$listeners.add(this.canvas, "CANVAS", "mouseup", this.endBoxAdjustment);
  };

  private endBoxAdjustment = () => {
    this.unsubscribeAdjustment();
  };

  private unsubscribeAdjustment = () => {
    this.$listeners.remove(this.canvas, "CANVAS", "mousemove", this.resizeBox);
    this.$listeners.remove(this.canvas, "CANVAS", "mouseup", this.endBoxAdjustment);
  };

  disconnect = () => {
    this.unsubscribeDeployment();
    this.unsubscribeAdjustment();
    this.stopDrawing();
  };
}
