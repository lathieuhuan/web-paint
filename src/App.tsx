import { useEffect, useRef } from "react";
import { Canvas } from "../lib/main";

function App() {
  const canvas = useRef<Canvas>();

  useEffect(() => {
    canvas.current = new Canvas();

    return () => {
      logListenersCount();
      canvas.current?.endSession();
    };
  }, []);

  const onClickStart = () => {
    canvas.current?.startSession();
  };

  const logListenersCount = () => {
    console.log(canvas.current?.subscribersCount);
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
