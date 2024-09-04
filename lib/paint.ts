import { CanvasControl, CanvasConstructParams } from "./canvas-control";

type PaintConstructOpions = Omit<CanvasConstructParams, "id" | "paintGround">;

const defaultOptions: PaintConstructOpions = {
  prefix: "wpaint",
  minBoxSize: 16,
  defaultBoxSize: 160,
  /** compared to box */
  maxResizersSizeRatio: 0.6,
};

let canvasId = 0;

export class Paint {
  private canvasCtrlById = new Map<string, CanvasControl>();
  private options: PaintConstructOpions;

  constructor(options?: Partial<PaintConstructOpions>) {
    this.options = Object.assign(defaultOptions, options);
  }

  /**
   * @param paintGround where canvas should be appended
   * @returns canvasCtrl
   */
  makeCanvas(paintGround: HTMLElement | (() => HTMLElement) = document.body) {
    const id = `${canvasId++}`;
    const ground = typeof paintGround === "function" ? paintGround() : paintGround;
    const canvasCtrl = new CanvasControl({
      id,
      paintGround: ground,
      ...this.options,
    });
    this.canvasCtrlById.set(id, canvasCtrl);

    return canvasCtrl;
  }

  deleteCanvas(id: string) {
    this.canvasCtrlById.delete(id);
  }
}
