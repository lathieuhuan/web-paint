import { BoxControl } from "./box-control";

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
  private paintGround: HTMLElement | undefined;
  private canvas: HTMLDivElement;
  private previousGroundOverflow = "";
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

  get listenersCount() {
    return this.boxCtrl.$listeners.listenersCount;
  }

  startSession(paintGround?: HTMLElement | (() => HTMLElement)) {
    this.paintGround = paintGround ? (typeof paintGround === "function" ? paintGround() : paintGround) : document.body;

    this.isActive = true;
    this.previousGroundOverflow = getComputedStyle(this.paintGround).overflow;
    this.paintGround.style.overflow = "hidden";

    if (!this.paintGround.contains(this.canvas)) {
      this.paintGround.appendChild(this.canvas);
    }

    this.canvas.style.display = "block";
  }

  endSession() {
    if (this.isActive) {
      this.isActive = false;

      if (this.paintGround) {
        this.paintGround.style.overflow = this.previousGroundOverflow;
      }

      this.canvas.replaceChildren();
      this.canvas.style.display = "none";
      // #TO_CHECK
      this.boxCtrl.disconnect();
    }
  }

  startBoxDrawing() {
    this.boxCtrl.startDrawing();
  }
}
