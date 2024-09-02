import { BoxControl } from "./box-control";
import $events from "./events-manager";

type PaintConstructOpions = {
  prefix: string;
  minBoxSize: number;
  defaultBoxSize: number;
};

const defaultOptions: PaintConstructOpions = {
  prefix: "wpaint",
  minBoxSize: 16,
  defaultBoxSize: 160,
};

let paintNo = 0;

export class Paint {
  private canvas: HTMLDivElement;
  private previousBodyOverflow = "";
  private boxCtrl: BoxControl;
  isActive = false;

  constructor(options?: Partial<PaintConstructOpions>) {
    const { prefix, minBoxSize, defaultBoxSize } = Object.assign(defaultOptions, options);
    const canvasCls = `${prefix}-canvas`;

    this.canvas = this.createCanvas(`${canvasCls}--${paintNo++}`, canvasCls);
    this.boxCtrl = new BoxControl(prefix, this.canvas, minBoxSize, defaultBoxSize / 2);
  }

  private createCanvas(id: string, className: string) {
    const canvas = document.createElement("div");
    canvas.id = id;
    canvas.className = className;
    canvas.style.display = "none";
    canvas.draggable = false;
    return canvas;
  }

  get subscribersCount() {
    return $events.subscribersCount;
  }

  private handleMousedown = (e: MouseEvent) => {
    if (e.target instanceof HTMLElement) {
      if (this.boxCtrl.isBoxResizer(e.target)) {
        this.boxCtrl.startBoxAdjustment(e.target);
        return;
      }
      this.boxCtrl.startBoxDeployment(e);
    }
  };

  startSession() {
    this.isActive = true;
    this.previousBodyOverflow = getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    if (!document.body.contains(this.canvas)) {
      document.body.appendChild(this.canvas);
    }

    this.canvas.style.display = "block";
    // $events.subscribe("mousedown", this.handleMousedown);
  }

  endSession() {
    if (this.isActive) {
      this.isActive = false;
      document.body.style.overflow = this.previousBodyOverflow;

      this.canvas.style.display = "none";
      $events.unsubscribe("mousedown", this.handleMousedown);

      // #TO_CHECK
      this.boxCtrl.disconnect();
    }
  }

  startBoxDrawing() {
    this.boxCtrl.startDrawing();
  }
}
