import ClassName from "./class-name";
import { BoxControl } from "./box-control";
import type { CanvasConstructOptions, CanvasManager } from "./types";
import "./index.css";

let nextCanvasId = 0;
const ENTITY_NAME = "canvas";

const defaultOptions: CanvasConstructOptions = {
  minBoxSize: 16,
  defaultBoxSize: 160,
  /** compared to box */
  maxResizersSizeRatio: 0.6,
};

export class CanvasControl {
  private previousGroundOverflow = "";
  private canvas: HTMLElement;
  private cls: ClassName;
  private boxCtrl: BoxControl;
  private manager: CanvasManager = {};
  id: string;
  isActive = false;

  get subscribersCount() {
    return this.boxCtrl.$listeners.listenersCount;
  }

  constructor(private paintGround: HTMLElement = document.body, options?: Partial<CanvasConstructOptions>) {
    const mergedOptions = Object.assign(defaultOptions, options);
    const { id = `${nextCanvasId++}` } = mergedOptions;

    this.cls = new ClassName(ENTITY_NAME, mergedOptions.identifier);
    this.id = id;
    this.canvas = this.createCanvas(this.cls.withModifier(id), this.cls.toString());
    this.boxCtrl = new BoxControl({
      canvas: this.canvas,
      canvasManager: this.manager,
      defaultHalfSize: mergedOptions.defaultBoxSize / 2,
      ...mergedOptions,
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

    const existCanvas = this.paintGround.querySelector(`.${this.cls.entity}`);

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
