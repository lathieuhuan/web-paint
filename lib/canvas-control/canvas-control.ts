import { BoxControl, BoxControlConstructParams, OnDrawBox } from "../box-control";

const ENTITY_NAME = "CANVAS";

export type CanvasConstructParams = Omit<BoxControlConstructParams, "canvas" | "defaultHalfSize" | "canvasManager"> & {
  paintGround: HTMLElement;
  id: string;
  defaultBoxSize: number;
};

export type CanvasManager = {
  onDrawBox?: OnDrawBox;
};

export class CanvasControl {
  private paintGround: HTMLElement;
  private previousGroundOverflow = "";
  private canvas: HTMLElement;
  private canvasCls: string;
  private boxCtrl: BoxControl;
  private manager: CanvasManager = {};
  id: string;
  isActive = false;

  get listenersCount() {
    return this.boxCtrl.$listeners.listenersCount;
  }

  constructor(params: CanvasConstructParams) {
    const { id, prefix } = params;

    this.id = id;
    this.canvasCls = `${prefix}-canvas`;
    this.paintGround = params.paintGround;
    this.canvas = this.createCanvas(`${this.canvasCls}--${id}`, this.canvasCls);
    this.boxCtrl = new BoxControl({
      canvas: this.canvas,
      canvasManager: this.manager,
      defaultHalfSize: params.defaultBoxSize / 2,
      ...params,
    });
  }

  private createCanvas(id: string, className: string) {
    const canvas = document.createElement("div");
    canvas.id = id;
    canvas.className = className;
    canvas.style.display = "none";
    canvas.dataset.entity = ENTITY_NAME;
    canvas.draggable = false;
    return canvas;
  }

  addListener<TEventType extends keyof CanvasManager>(eventType: TEventType, listener: CanvasManager[TEventType]) {
    this.manager[eventType] = listener;
  }

  removeListener<TEventType extends keyof CanvasManager>(eventType: TEventType) {
    this.manager[eventType] = undefined;
  }

  clearAll() {
    this.canvas.replaceChildren();
  }

  startSession() {
    this.isActive = true;
    this.previousGroundOverflow = getComputedStyle(this.paintGround).overflow;
    this.paintGround.style.overflow = "hidden";

    const existCanvas = this.paintGround.querySelector(`.${this.canvasCls}`);

    if (existCanvas instanceof HTMLElement) {
      this.canvas = existCanvas;
      this.boxCtrl.canvas = this.canvas;
    } else {
      this.paintGround.appendChild(this.canvas);
    }

    this.canvas.style.display = "block";
  }

  endSession() {
    if (this.isActive) {
      this.isActive = false;
      this.canvas.replaceChildren();
      this.canvas.style.display = "none";
      this.paintGround.style.overflow = this.previousGroundOverflow;

      if (this.paintGround.contains(this.canvas)) {
        this.paintGround.removeChild(this.canvas);
      }
      // #TO_CHECK
      this.boxCtrl.disconnect();
    }
  }

  startBoxDrawing() {
    this.boxCtrl.startDrawing();
  }
}
