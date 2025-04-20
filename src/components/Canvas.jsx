import React, { useRef, useState, useEffect, useCallback } from "react";

export default function Canvas() {
  const canvasRef = useRef(null); // Ref to the canvas HTML element
  const contextRef = useRef(null); // Ref to the canvas 2D context
  const isDrawingRef = useRef(false); // Ref to track if drawing is active

  const [tool, setTool] = useState("pencil"); // 'pencil' or 'eraser'
  const [lineWidth, setLineWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#000000"); // Default to black

  const [completedStrokes, setCompletedStrokes] = useState([]); // Store completed strokes
  const currentStrokeRef = useRef(null); // Ref to track the current stroke being drawn
  const strokeRef = useRef(completedStrokes);

  useEffect(() => {
    strokeRef.current = completedStrokes;
  }, [completedStrokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 800; // Example fixed width
    canvas.height = 600; // Example fixed height

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
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
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
      currentStrokeRef.current.lastX = x;
      currentStrokeRef.current.lastY = y;
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

      if (currentStrokeRef.current) {
        const newStroke = {
          ...currentStrokeRef.current,
          endX: currentStrokeRef.current.lastX,
          endY: currentStrokeRef.current.lastY,
        };

        setCompletedStrokes((prevStrokes) => [...prevStrokes, newStroke]);
        currentStrokeRef.current = null; // Reset current stroke
      }
      console.log("Stop drawing");
    }
  }, []);

  // --- Toolbar Actions ---
  const handleClearCanvas = useCallback(() => {
    clearCanvas();
  }, []);

  // Encapsulate clear logic
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
    const logInterval = 1000;

    const intervalId = setInterval(() => {
      if (strokeRef.current.length > 0) {
        const payLoadToLog = [...strokeRef.current];
        console.log("Current strokes:", payLoadToLog);

        setCompletedStrokes([]);
      }
    }, logInterval);

    return () => {
      clearInterval(intervalId);
    };
  });

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
          disabled={tool === "eraser"} // Disable color when erasing
        />

        {/* Line Width */}
        <label htmlFor="lineWidth">Width:</label>
        <input
          type="range"
          id="lineWidth"
          min="1"
          max="50" // Adjust max width as needed
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
        onMouseLeave={stopDrawing} // Stop drawing if mouse leaves canvas
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        // Add CSS class for styling
        className="drawing-canvas"
      >
        Your browser does not support the HTML canvas element.
      </canvas>
    </div>
  );
}
