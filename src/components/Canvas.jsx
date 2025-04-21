import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { DRAW_EVENT } from "../constants/webSocketEvents.js";
import { SocketContext } from "./Game";

export default function Canvas() {
  const canvasRef = useRef(null); // Ref to the canvas HTML element
  const contextRef = useRef(null); // Ref to the canvas 2D context
  const isDrawingRef = useRef(false); // Ref to track if drawing is active

  const [tool, setTool] = useState("pencil"); // 'pencil' or 'eraser'
  const [lineWidth, setLineWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#000000"); // Default to black

  const { socket, isConnected, joinedRoom } = useContext(SocketContext);
  const [completedStrokes, setCompletedStrokes] = useState([]); // Store completed strokes
  const currentStrokeRef = useRef(null); // Ref to track the current stroke being drawn

  useEffect(() => {
    if (!socket) return;

    socket.on(DRAW_EVENT, ({ senderId, strokes }) => {
      if (socket.id === senderId) return;
      console.log("Received draw event from:", senderId);

      const context = contextRef.current;
      if (!context) return;

      context.save();

      strokes.forEach((stroke) => {
        context.lineWidth = stroke.lineWidth || 3;
        context.strokeStyle = stroke.color || "#000000";
        context.globalCompositeOperation =
          stroke.tool === "eraser" ? "destination-out" : "source-over";

        context.beginPath();
        context.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          context.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        context.stroke();
      });
    });

    return () => {
      socket.off(DRAW_EVENT);
    };
  }, [socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 800;
    canvas.height = 600;

    const context = canvas.getContext("2d");

    context.lineCap = "round";
    context.lineJoin = "round";

    contextRef.current = context;
    console.log("Canvas context initialized", contextRef.current);
    clearCanvas();
  }, []);

  useEffect(() => {
    if (!contextRef.current) return;

    contextRef.current.lineWidth = lineWidth;
    contextRef.current.strokeStyle = strokeColor;
    contextRef.current.globalCompositeOperation =
      tool === "eraser" ? "destination-out" : "source-over";
  }, [lineWidth, strokeColor, tool]);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    if (event.nativeEvent.offsetX !== undefined) {
      return { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
    } else if (
      event.nativeEvent.touches &&
      event.nativeEvent.touches.length > 0
    ) {
      const rect = canvas.getBoundingClientRect();
      const touch = event.nativeEvent.touches[0];

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = useCallback(
    (event) => {
      const context = contextRef.current;
      if (!context) return;
      const { x, y } = getCoordinates(event);
      context.beginPath();
      context.moveTo(x, y);
      isDrawingRef.current = true;

      currentStrokeRef.current = {
        tool: tool,
        color: strokeColor,
        lineWidth: lineWidth,
        points: [{ x, y }],
      };
      event.preventDefault();

      console.log("Start drawing at:", x, y);
    },
    [tool, strokeColor, lineWidth]
  );

  const draw = useCallback((event) => {
    if (!isDrawingRef.current) return;
    const context = contextRef.current;
    if (!context) return;

    const { x, y } = getCoordinates(event);
    context.lineTo(x, y);
    context.stroke();

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push({ x, y });
    }
    event.preventDefault();
    console.log("Drawing at:", x, y);
  }, []);

  const stopDrawing = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    if (isDrawingRef.current) {
      context.closePath();
      isDrawingRef.current = false;

      if (
        currentStrokeRef.current &&
        currentStrokeRef.current.points.length > 0
      ) {
        setCompletedStrokes((prevStrokes) => [
          ...prevStrokes,
          { ...currentStrokeRef.current },
        ]);
        currentStrokeRef.current = null;
      }
      console.log("Stop drawing");
    }
  }, []);

  const handleClearCanvas = useCallback(() => {
    clearCanvas();
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const currentGCO = context.globalCompositeOperation;
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.globalCompositeOperation = currentGCO;

      console.log("Canvas cleared");
    }
  };

  useEffect(() => {
    const logInterval = 20;

    const intervalId = setInterval(() => {
      setCompletedStrokes((currentStrokes) => {
        if (currentStrokes.length > 0) {
          const payloadToSend = [...currentStrokes];
          const currentLondonTime = new Date().toLocaleTimeString("en-GB", {
            timeZone: "Europe/London",
          });
          console.log(
            `[${currentLondonTime}] Strokes Payload to Send (${payloadToSend.length} strokes):`,
            payloadToSend
          );

          if (socket && isConnected && joinedRoom) {
            const payload = {
              senderId: socket.id,
              roomId: joinedRoom,
              strokes: payloadToSend,
            };
            socket.emit(DRAW_EVENT, payload);
            return [];
          } else {
            console.warn(
              "Socket not ready or not in room. Strokes NOT cleared, will try again next interval."
            );
            return currentStrokes;
          }
        }
        return currentStrokes;
      });
    }, logInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [socket, isConnected, joinedRoom]);

  return (
    <div className="canvas-container">
      <div className="toolbar">
        {/* Tool Selection */}
        <button
          onClick={() => setTool("pencil")}
          className={tool === "pencil" ? "active" : ""}
        >
          Pencil
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={tool === "eraser" ? "active" : ""}
        >
          Eraser
        </button>

        {/* Color Picker */}
        <label htmlFor="strokeColor">Color:</label>
        <input
          type="color"
          id="strokeColor"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
          disabled={tool === "eraser"}
        />

        {/* Line Width */}
        <label htmlFor="lineWidth">Width:</label>
        <input
          type="range"
          id="lineWidth"
          min="1"
          max="50"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
        />
        <span>{lineWidth}</span>

        {/* Clear Button */}
        <button onClick={handleClearCanvas}>Clear Canvas</button>
        <span style={{ marginLeft: "auto", fontSize: "0.8em", color: "#555" }}>
          London Time:{" "}
          {new Date().toLocaleTimeString("en-GB", {
            timeZone: "Europe/London",
          })}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="drawing-canvas"
      >
        Your browser does not support the HTML canvas element.
      </canvas>
    </div>
  );
}
