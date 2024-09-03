import { useEffect, useRef } from "react";
import { Paint } from "../lib/main";

function App() {
  const paint = useRef<Paint>();

  useEffect(() => {
    paint.current = new Paint();

    const endSessionOnEscPressed = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        paint.current?.endSession();
      }
    };

    document.addEventListener("keydown", endSessionOnEscPressed);

    return () => {
      paint.current?.endSession();
      document.addEventListener("keydown", endSessionOnEscPressed);
      logListenersCount();
    };
  }, []);

  const onClickStart = () => {
    paint.current?.startSession();
    paint.current?.startBoxDrawing();
  };

  const logListenersCount = () => {
    console.log(paint.current?.listenersCount);
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
