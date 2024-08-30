import { BoxControl } from "./box-control";
import $events from "./events-manager";

type CanvasConstructOpions = {
  closeOnEscape?: boolean;
};

const prefix = "wpaint";
const MIN_BOX_SIZE = 16;
const DEFAULT_BOX_HALF_SIZE = 80; // x2 for default box size

const defaultOptions: CanvasConstructOpions = {
  closeOnEscape: true,
};

export class Canvas {
  private previousBodyOverflow = "";
  private boxCtrl = new BoxControl(this.overlay, prefix, MIN_BOX_SIZE, DEFAULT_BOX_HALF_SIZE * 2);

  constructor(private options: CanvasConstructOpions = defaultOptions) {}

  private get overlay() {
    let overlayElmt: HTMLDivElement | null = document.querySelector(`#${prefix}`);

    if (!overlayElmt) {
      overlayElmt = document.createElement("div");
      overlayElmt.id = prefix;
      overlayElmt.style.display = "none";
      overlayElmt.draggable = false;
      document.body.appendChild(overlayElmt);
    }
    return overlayElmt;
  }

  get subscribersCount() {
    return $events.subscribersCount;
  }

  private endSessionOnEscPressed = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.options.closeOnEscape) {
      this.endSession();
    }
  };

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
    this.previousBodyOverflow = getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    this.overlay.style.display = "block";
    $events.subscribe("keydown", this.endSessionOnEscPressed);
    $events.subscribe("mousedown", this.handleMousedown);
  }

  endSession() {
    document.body.style.overflow = this.previousBodyOverflow;

    this.overlay.style.display = "none";
    this.boxCtrl.disconnect();
    $events.unsubscribe("keydown", this.endSessionOnEscPressed);
    $events.unsubscribe("mousedown", this.handleMousedown);
  }
}
