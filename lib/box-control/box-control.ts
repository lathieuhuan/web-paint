import { ResizerControl, ResizerElement } from "./resizer-control";
import ListenersManager from "../listeners-manager";

export class BoxControl {
  private boxCls: string;
  private anchor = {
    x: 0,
    y: 0,
  };
  private resizerCtrl: ResizerControl;
  $listeners = new ListenersManager();

  private _currentBox: HTMLDivElement | undefined;
  private set currentBox(box: HTMLDivElement) {
    this._currentBox = box;
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
    this.$listeners.add(this.canvas, "CANVAS", "mousedown", this.handleMousedown);
  }

  stopDrawing() {
    this.$listeners.remove(this.canvas, "CANVAS", "mousedown", this.handleMousedown);
  }

  private handleMousedown = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      if (this.resizerCtrl.isResizer(e.target)) {
        this.startBoxAdjustment(e.target);
        return;
      }
      this.startBoxDeployment(e);
    }
  };

  private removeBox = () => {
    if (this.canvas.contains(this.currentBox)) {
      this.canvas.removeChild(this.currentBox);
    }
  };

  // ========== SETUP BOX ==========

  private createBox = (left: number, top: number, width: number, height: number) => {
    const currentBox = document.createElement("div");
    // currentBox.id = `${this.prefix}-box`;
    currentBox.className = this.boxCls;

    this.currentBox = currentBox;
    this.currentBoxStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
    return currentBox;
  };

  private updateAnchor = ({ x, y }: { x: number; y: number } = this.currentBoxRect) => {
    this.anchor = { x, y };
  };

  private createNewBox = (left: number, top: number, width = 0, height = 0) => {
    /** Only 1 currentBox at a time so we remove old currentBox */
    this.removeBox();
    this.createBox(left, top, width, height);
    this.canvas.appendChild(this.currentBox);
    this.updateAnchor();
  };

  private resizeBox = (e: MouseEvent) => {
    const { x, y } = this.anchor;

    this.currentBoxStyle = {
      left: `${Math.min(e.x, x)}px`,
      top: `${Math.min(e.y, y)}px`,
      width: `${Math.abs(e.x - x)}px`,
      height: `${Math.abs(e.y - y)}px`,
    };
  };

  // ========== DEPLOY BOX ==========

  startBoxDeployment = (e: MouseEvent) => {
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

      this.createNewBox(startX, startY, this.defaultHalfSize * 2, this.defaultHalfSize * 2);
    }

    /**
     * Style finished currentBox here
     */
    this.currentBox.classList.add(`${this.boxCls}--finished`);

    const maxResizerSize = Math.floor(Math.min(this.currentBox.clientWidth, this.currentBox.clientHeight) * 0.45);
    this.resizerCtrl.addResizers(this.currentBox, maxResizerSize);

    this.updateAnchor();
    this.unsubscribeDeployment();
  };

  private unsubscribeDeployment = () => {
    this.$listeners.remove(this.canvas, "CANVAS", "mousemove", this.resizeBox);
    this.$listeners.remove(this.canvas, "CANVAS", "mouseup", this.endBoxDeployment);
  };

  // ========== ADJUST BOX ==========

  startBoxAdjustment = (resizer: ResizerElement) => {
    const { currentBoxRect } = this;

    switch (resizer.__direction) {
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
    this.updateAnchor();
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
    this.removeBox();
  };
}
