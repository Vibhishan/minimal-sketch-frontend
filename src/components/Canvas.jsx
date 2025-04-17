import React, { useState, useEffect, useRef, useCallback } from "react";

export default function Canvas() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);

  const [tool, setTool] = useState("pencil");
  const [lineWidth, setLineWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#000000");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 600;
    canvas.height = 400;

    const context = canvas.getContext("2d");

    context.lineCap = "round";
    context.lineJoin = "round";

    contextRef.current = context;
    console.log("Canvas initialized");

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

    if (event.nativeEvent.touches && event.nativeEvent.touches.length > 0) {
      const touch = event.nativeEvent.touches[0];
      const rect = canvas.getBoundingClientRect();
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: event.clientX - canvas.getBoundingClientRect().left,
      y: event.clientY - canvas.getBoundingClientRect().top,
    };
  };

  const startDrawing = useCallback((event) => {
    const context = contextRef.current;
    if (!context) return;
    const { x, y } = getCoordinates(event);
    context.beginPath();
    context.moveTo(x, y);
    isDrawingRef.current = true;
    event.preventDefault(); // Prevent default touch actions like scrolling
    console.log("Start drawing at:", x, y);
  }, []); // Dependencies: None needed as it reads from refs mostly

  const draw = useCallback((event) => {
    if (!isDrawingRef.current) return;
    const context = contextRef.current;
    if (!context) return;

    const { x, y } = getCoordinates(event);
    context.lineTo(x, y);
    context.stroke();
    event.preventDefault(); // Prevent default touch actions
  }, []); // Dependencies: None needed

  const stopDrawing = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;
    if (isDrawingRef.current) {
      context.closePath();
      isDrawingRef.current = false;
      console.log("Stop drawing");
    }
  }, []); // Dependencies: None needed

  // --- Toolbar Actions ---
  const handleClearCanvas = useCallback(() => {
    clearCanvas();
  }, []); // Dependencies: Include clearCanvas if it uses state/props

  // Encapsulate clear logic
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      // Optional: Fill with a background color if needed (e.g., white)
      // Store current composite operation
      const currentGCO = context.globalCompositeOperation;
      context.globalCompositeOperation = "source-over"; // Ensure we can fill
      context.fillStyle = "#FFFFFF"; // White background
      context.fillRect(0, 0, canvas.width, canvas.height);
      // Restore composite operation
      context.globalCompositeOperation = currentGCO;

      console.log("Canvas cleared");
    }
  };
  return (
    <div>
      <div>
        <button onClick={() => setTool("pencil")}>Pencil</button>
        <button onClick={() => setTool("eraser")}>Eraser</button>
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
      ></canvas>
    </div>
  );
}
