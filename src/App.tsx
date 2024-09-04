import { useEffect, useRef } from "react";
import { Paint, CanvasControl } from "../lib/main";

const paint = new Paint();

function App() {
  const canvas = useRef<CanvasControl>();

  useEffect(() => {
    const newCanvas = paint.makeCanvas();

    newCanvas.addListener("onDrawBox", (stage, boxCtrl) => {
      console.log('stage', stage);

      switch (stage) {
        case "DEPLOY_START":
          newCanvas.clearAll();
          break;
        case "DEPLOY_END":
        case "ADJUST_END":
          console.log(boxCtrl.currentBoxRect.toJSON());
          break;
      }
    });

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
      logSubscribersCount();
    };
  }, []);

  const onClickStart = () => {
    canvas.current?.startSession();
    canvas.current?.startBoxDrawing();
  };

  const logSubscribersCount = () => {
    console.log(canvas.current?.subscribersCount);
  };

  return (
    <div style={{ height: 1200 }}>
      <div className="flex gap-4 cursor-nwse-resize">
        <button className="button button-primary" onClick={onClickStart}>
          Start
        </button>
        <button className="button button-danger" onClick={logSubscribersCount}>
          Log Listeners count
        </button>
      </div>
    </div>
  );
}

export default App;
