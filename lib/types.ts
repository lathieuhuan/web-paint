export type CanvasConstructOptions = {
  id?: string;
  identifier?: string;
  minBoxSize: number;
  maxResizersSizeRatio: number;
  defaultBoxSize: number;
};

export interface ObjectControl {
  canvas: HTMLElement;
  currentObject: HTMLElement;
  currentObjectRect: DOMRect;
}

type BoxDrawingStage = "DEPLOY_START" | "DEPLOY_END" | "ADJUST_START" | "ADJUST_END";

export type OnDrawBox = (stage: BoxDrawingStage, control: Readonly<ObjectControl>) => void;

export type CanvasManager = {
  onDrawBox?: OnDrawBox;
};
