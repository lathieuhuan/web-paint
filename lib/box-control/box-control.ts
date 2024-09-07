import ListenersManager from "../listeners-manager";
import ClassName from "../class-name";
import { ResizerControl } from "./resizer-control";
import { ResizeDirection } from "./configs";
import type { CanvasConstructOptions, CanvasManager, ObjectControl } from "../types";

type Point = {
  x: number;
  y: number;
};

const ENTITY_NAME = "box";
const RESIZER_SIZE_VAR_NAME = "--resizer-size";

type BoxControlConstructParams = Pick<CanvasConstructOptions, "identifier" | "minBoxSize" | "maxResizersSizeRatio"> & {
  canvas: HTMLElement;
  defaultHalfSize: number;
  canvasManager: CanvasManager;
};

export class BoxControl {
  canvas: BoxControlConstructParams["canvas"];
  private minBoxSize: BoxControlConstructParams["minBoxSize"];
  private defaultHalfSize: BoxControlConstructParams["defaultHalfSize"];
  private maxResizersSizeRatio: BoxControlConstructParams["maxResizersSizeRatio"];
  private canvasManager: CanvasManager;

  private cls: ClassName;
  private anchor: Point = {
    x: 0,
    y: 0,
  };
  private resizerCtrl: ResizerControl;
  $listeners = new ListenersManager();

  private _currentBox: HTMLElement | undefined;
  private set currentBox(box: HTMLElement) {
    const currentCls = this.cls.withModifier("current");

    this._currentBox?.classList.remove(currentCls);
    this._currentBox = box;
    this._currentBox.classList.add(currentCls);
  }
  private get currentBox() {
    if (this._currentBox) {
      return this._currentBox;
    }
    console.error("No box was selected");
    return document.createElement("div");
  }

  constructor(params: BoxControlConstructParams) {
    this.canvas = params.canvas;
    this.minBoxSize = params.minBoxSize;
    this.defaultHalfSize = params.defaultHalfSize;
    this.maxResizersSizeRatio = params.maxResizersSizeRatio;
    this.canvasManager = params.canvasManager;

    this.cls = new ClassName(ENTITY_NAME, params.identifier);
    this.resizerCtrl = new ResizerControl(params.identifier);
  }

  private set currentBoxStyle(style: Partial<CSSStyleDeclaration>) {
    const { currentBox } = this;

    for (const key in style) {
      currentBox.style[key] = style[key]!;
    }

    currentBox.style.setProperty(
      RESIZER_SIZE_VAR_NAME,
      `calc(${this.maxResizersSizeRatio} * min(${currentBox.style.width}, ${currentBox.style.height}))`
    );
  }

  private get currentBoxRect() {
    return this.currentBox.getBoundingClientRect();
  }

  private get exposedControl(): ObjectControl {
    return {
      canvas: this.canvas,
      currentObject: this.currentBox,
      currentObjectRect: this.currentBoxRect,
    };
  }

  private getPointOnCanvas(pointOnViewPort: Point): Point {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: pointOnViewPort.x - rect.left,
      y: pointOnViewPort.y - rect.top,
    };
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
        this.canvasManager.onDrawBox?.("ADJUST_START", this.exposedControl);
        this.startBoxAdjustment(direction);
        return;
      }
      this.canvasManager.onDrawBox?.("DEPLOY_START", this.exposedControl);
      this.startBoxDeployment(e);
    }
  };

  private toggleBoxInitStage(initStage: boolean, box: HTMLElement = this.currentBox) {
    box.dataset.init = initStage ? "true" : "false";
    return box;
  }

  private deleteCurrentBox = (e: KeyboardEvent) => {
    if (e.key === "Delete" && this._currentBox) {
      this.removeBox(this._currentBox);
    }
  };

  // ========== SETUP BOX ==========

  private createBox(left: number, top: number, width: number, height: number) {
    const currentBox = document.createElement("div");
    currentBox.className = this.cls.toString('unfinished');
    currentBox.dataset.entity = ENTITY_NAME;

    this.currentBox = this.toggleBoxInitStage(true, currentBox);
    this.currentBoxStyle = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
    return currentBox;
  }

  private createNewBox(left: number, top: number, width = 0, height = 0) {
    this.createBox(left, top, width, height);
    this.canvas.appendChild(this.currentBox);
    this.anchor = { x: left, y: top };
  }

  private resizeBox = (e: MouseEvent) => {
    const { x: anchorX, y: anchorY } = this.anchor;
    const coordinate = this.getPointOnCanvas({
      x: e.clientX,
      y: e.clientY,
    });
    const width = `${Math.abs(coordinate.x - anchorX)}px`;
    const height = `${Math.abs(coordinate.y - anchorY)}px`;

    this.currentBoxStyle = {
      left: `${Math.min(coordinate.x, anchorX)}px`,
      top: `${Math.min(coordinate.y, anchorY)}px`,
      width,
      height,
    };
    this.toggleBoxInitStage(false);
  };

  private ensureBoxMinSize(boxRect = this.currentBoxRect) {
    const { width, height, right, bottom } = boxRect;
    const { x, y } = this.getPointOnCanvas(boxRect);
    const { x: canvasX, y: canvasY } = this.canvas.getBoundingClientRect();

    // Expand the box to min size
    const newBoxStyle: Partial<CSSStyleDeclaration> = {};

    if (width < this.minBoxSize) {
      newBoxStyle.width = `${this.minBoxSize}px`;

      if (x < this.anchor.x) {
        newBoxStyle.left = `${right - canvasX - this.minBoxSize}px`;
      }
    }
    if (height < this.minBoxSize) {
      newBoxStyle.height = `${this.minBoxSize}px`;

      if (y < this.anchor.y) {
        newBoxStyle.top = `${bottom - canvasY - this.minBoxSize}px`;
      }
    }

    this.currentBoxStyle = newBoxStyle;
  }

  private removeBox(box: HTMLElement) {
    if (this.canvas.contains(box)) {
      this.canvas.removeChild(box);
    }
  }

  // ========== DEPLOY BOX ==========

  private startBoxDeployment = (e: MouseEvent) => {
    const { x, y } = this.getPointOnCanvas(e);

    this.createNewBox(x, y);
    this.$listeners.add(this.canvas, "CANVAS", "mousemove", this.resizeBox);
    this.$listeners.add(this.canvas, "CANVAS", "mouseup", this.endBoxDeployment);
  };

  private endBoxDeployment = (e: MouseEvent) => {
    const boxRect = this.currentBoxRect;
    const { width, height } = boxRect;

    if (!width && !height) {
      // User click, width & height are 0
      const { x, y } = this.getPointOnCanvas(e);
      const { clientWidth, clientHeight } = this.canvas;

      const startX = Math.max(Math.min(x, clientWidth - this.defaultHalfSize) - this.defaultHalfSize, 0);
      const startY = Math.max(Math.min(y, clientHeight - this.defaultHalfSize) - this.defaultHalfSize, 0);

      this.removeBox(this.currentBox);
      this.createNewBox(startX, startY, this.defaultHalfSize * 2, this.defaultHalfSize * 2);
    } //
    else {
      this.ensureBoxMinSize(boxRect);
    }

    /**
     * Style finished currentBox here
     */
    this.currentBox.classList.replace(this.cls.withModifier("unfinished"), this.cls.withModifier("finished"));

    this.resizerCtrl.addResizers(this.currentBox, `var(${RESIZER_SIZE_VAR_NAME})`);
    this.toggleBoxInitStage(false);

    this.unsubscribeDeployment();
    this.canvasManager.onDrawBox?.("DEPLOY_END", this.exposedControl);
  };

  private unsubscribeDeployment = () => {
    this.$listeners.remove(this.canvas, "CANVAS", "mousemove", this.resizeBox);
    this.$listeners.remove(this.canvas, "CANVAS", "mouseup", this.endBoxDeployment);
  };

  // ========== ADJUST BOX ==========

  private startBoxAdjustment = (direction: ResizeDirection) => {
    const { currentBoxRect } = this;

    switch (direction) {
      case "tl":
        this.anchor = this.getPointOnCanvas({
          x: currentBoxRect.right,
          y: currentBoxRect.bottom,
        });
        break;
      case "tr":
        this.anchor = this.getPointOnCanvas({
          x: currentBoxRect.left,
          y: currentBoxRect.bottom,
        });
        break;
      case "br":
        this.anchor = this.getPointOnCanvas(currentBoxRect);
        break;
      case "bl":
        this.anchor = this.getPointOnCanvas({
          x: currentBoxRect.right,
          y: currentBoxRect.top,
        });
        break;
    }

    this.$listeners.add(this.canvas, "CANVAS", "mousemove", this.resizeBox);
    this.$listeners.add(this.canvas, "CANVAS", "mouseup", this.endBoxAdjustment);
  };

  private endBoxAdjustment = () => {
    this.ensureBoxMinSize();
    this.unsubscribeAdjustment();
    this.canvasManager.onDrawBox?.("ADJUST_END", this.exposedControl);
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
