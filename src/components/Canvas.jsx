import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { DRAW_EVENT, CLEAR_CANVAS } from "../constants/webSocketEvents.js";
import { SocketContext } from "../context/SocketContext.jsx";
import "../styles/Canvas.css";

export default function Canvas({ isDrawing }) {
  const canvasRef = useRef(null); // Ref to the canvas HTML element
  const contextRef = useRef(null); // Ref to the canvas 2D context
  const isDrawingRef = useRef(false); // Ref to track if drawing is active

  const { socket, isConnected, roomId } = useContext(SocketContext);
  const [tool, setTool] = useState("pencil"); // 'pencil' or 'eraser'
  const [lineWidth, setLineWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#000000"); // Default to black

  const [completedStrokes, setCompletedStrokes] = useState([]); // Store completed strokes
  const currentStrokeRef = useRef(null); // Ref to track the current stroke being drawn

  const drawStrokes = useCallback((strokes) => {
    const context = contextRef.current;
    if (!context) return;

    context.save();
    strokes.forEach((stroke) => {
      context.lineWidth = stroke.lineWidth;
      context.strokeStyle = stroke.color;
      context.globalCompositeOperation =
        stroke.tool === "eraser" ? "destination-out" : "source-over";

      context.beginPath();
      context.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        context.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      context.stroke();
    });
    context.restore();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on(DRAW_EVENT, (data) => {
      console.log("Received drawing event:", data);
      if (socket.id === data.senderId) return;
      drawStrokes(data.strokes);
    });

    socket.on(CLEAR_CANVAS, () => {
      console.log("Received clear canvas event");
      clearCanvas();
      setCompletedStrokes([]);
      if (currentStrokeRef.current) {
        currentStrokeRef.current = null;
      }
    });

    return () => {
      socket.off(DRAW_EVENT);
      socket.off(CLEAR_CANVAS);
    };
  }, [socket, drawStrokes]);

  // Reset canvas when drawing state changes
  useEffect(() => {
    clearCanvas();
    setCompletedStrokes([]);
    if (currentStrokeRef.current) {
      currentStrokeRef.current = null;
    }
  }, [isDrawing]);

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

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (event.nativeEvent.offsetX !== undefined) {
      return {
        x: event.nativeEvent.offsetX * scaleX,
        y: event.nativeEvent.offsetY * scaleY,
      };
    } else if (
      event.nativeEvent.touches &&
      event.nativeEvent.touches.length > 0
    ) {
      const touch = event.nativeEvent.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = useCallback(
    (event) => {
      if (!isDrawing) return;

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
    },
    [tool, strokeColor, lineWidth, isDrawing]
  );

  const draw = useCallback(
    (event) => {
      if (!isDrawingRef.current || !isDrawing) return;
      const context = contextRef.current;
      if (!context) return;

      const { x, y } = getCoordinates(event);
      context.lineTo(x, y);
      context.stroke();

      if (currentStrokeRef.current) {
        currentStrokeRef.current.points.push({ x, y });
      }
      event.preventDefault();
    },
    [isDrawing]
  );

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
    }
  }, []);

  const handleClearCanvas = useCallback(() => {
    clearCanvas();
    if (socket && isConnected && roomId) {
      console.log("Emitting clear canvas event");
      socket.emit(CLEAR_CANVAS, { roomId });
    }
  }, [socket, isConnected, roomId]);

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
    let isMounted = true;

    const intervalId = setInterval(() => {
      if (!isMounted) return;

      setCompletedStrokes((currentStrokes) => {
        if (currentStrokes.length === 0) return currentStrokes;

        if (!socket || !isConnected || !roomId) {
          console.warn(
            "Socket not ready or not in room. Strokes NOT cleared, will try again next interval.",
            { isConnected, roomId, socket: !!socket }
          );
          return currentStrokes;
        }

        const payloadToSend = [...currentStrokes];
        const payload = {
          senderId: socket.id,
          roomId: roomId,
          strokes: payloadToSend,
        };

        try {
          console.log("Sending drawing event:", {
            roomId,
            strokeCount: payloadToSend.length,
          });
          socket.emit(DRAW_EVENT, payload);
          return [];
        } catch (error) {
          console.error("Error sending drawing data:", error);
          return currentStrokes;
        }
      });
    }, logInterval);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [socket, isConnected, roomId]);

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
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
        />
        <span>{lineWidth}</span>

        {/* Clear Button */}
        <button onClick={handleClearCanvas}>Clear</button>
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
