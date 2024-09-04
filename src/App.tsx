import { useEffect, useRef } from "react";
import { Paint, CanvasControl } from "../lib/main";

const paint = new Paint();

function App() {
  const canvas = useRef<CanvasControl>();

  useEffect(() => {
    const newCanvas = paint.makeCanvas();
    newCanvas.addListener("onDrawBox", () => newCanvas.clearAll());

    const endSessionOnEscPressed = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        newCanvas.endSession();
      }
    };

    canvas.current = newCanvas;
    document.addEventListener("keydown", endSessionOnEscPressed);

    return () => {
      newCanvas.endSession();
      document.addEventListener("keydown", endSessionOnEscPressed);
      logListenersCount();
    };
  }, []);

  const onClickStart = () => {
    canvas.current?.startSession();
    canvas.current?.startBoxDrawing();
  };

  const logListenersCount = () => {
    console.log(canvas.current?.listenersCount);
  };

  return (
    <div style={{ height: 1200 }}>
      <div className="flex gap-4 cursor-nwse-resize">
        <button className="button button-primary" onClick={onClickStart}>
          Start
        </button>
        <button className="button button-danger" onClick={logListenersCount}>
          Log Listeners count
        </button>
      </div>
    </div>
  );
}

export default App;
