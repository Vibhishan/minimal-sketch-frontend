import React, { useRef, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import {
  JOIN_EVENT,
  DRAW_EVENT,
  SOCKET_SERVER_URL,
} from "../constants/webSocketEvents.js";

export default function Canvas() {
  const canvasRef = useRef(null); // Ref to the canvas HTML element
  const contextRef = useRef(null); // Ref to the canvas 2D context
  const isDrawingRef = useRef(false); // Ref to track if drawing is active

  const [tool, setTool] = useState("pencil"); // 'pencil' or 'eraser'
  const [lineWidth, setLineWidth] = useState(3);
  const [strokeColor, setStrokeColor] = useState("#000000"); // Default to black

  const [socket, setSocket] = useState(null); // Socket connection
  const [isConnected, setIsConnected] = useState(false); // Connection status
  const [mySocketId, setMySocketId] = useState(null);
  const [roomToJoin, setRoomToJoin] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");

  const [completedStrokes, setCompletedStrokes] = useState([]); // Store completed strokes
  const currentStrokeRef = useRef(null); // Ref to track the current stroke being drawn
  // const strokeRef = useRef(completedStrokes);

  const handleRoomToJoinChange = (event) => {
    setRoomToJoin(event.target.value);
  };

  const handleJoinRoom = useCallback(() => {
    if (socket && isConnected && roomToJoin.trim()) {
      socket.emit(JOIN_EVENT, roomToJoin);
      console.log("Joining room:", roomToJoin);
      setJoinedRoom(roomToJoin);
      setRoomToJoin("");
    }
  }, [socket, isConnected, roomToJoin]);

  // useEffect(() => {
  //   strokeRef.current = completedStrokes;
  // }, [completedStrokes]);

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to socket server: ", newSocket.id);
      setIsConnected(true);
      setMySocketId(newSocket.id);
      setJoinedRoom("");
    });

    newSocket.on(DRAW_EVENT, ({ senderId, strokes }) => {
      if (!newSocket || newSocket.id === senderId) return;
      console.log("Received draw event from:", senderId);

      const context = contextRef.current;

      context.save();

      strokes.forEach((stroke) => {
        // if (
        //   !stroke ||
        //   !Array.isArray(stroke.points) ||
        //   stroke.points.length === 0
        // ) {
        //   console.warn("Skipping invalid stroke object received:", stroke);
        //   return;
        // }
        // Set context properties for this specific stroke
        context.lineWidth = stroke.lineWidth || 3;
        context.strokeStyle = stroke.color || "#000000";
        context.globalCompositeOperation =
          stroke.tool === "eraser" ? "destination-out" : "source-over";

        // Draw the line segment for the stroke
        context.beginPath();
        context.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          context.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        context.stroke();
        // context.closePath(); // Close path for this segment
      });
    });
  }, []);

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
    const logInterval = 20;

    const intervalId = setInterval(() => {
      setCompletedStrokes((currentStrokes) => {
        // currentStrokes is guaranteed to be the latest state here

        if (currentStrokes.length > 0) {
          // 1. This is the batch to send
          const payloadToSend = [...currentStrokes]; // Create copy if needed outside this scope
          const currentLondonTime = new Date().toLocaleTimeString("en-GB", {
            timeZone: "Europe/London",
          });
          console.log(
            `[${currentLondonTime}] Strokes Payload to Send (${payloadToSend.length} strokes):`,
            payloadToSend
          );

          // 2. EMIT TO WEBSOCKET
          if (socket && isConnected && joinedRoom) {
            const payload = {
              senderId: socket.id,
              roomId: joinedRoom,
              strokes: payloadToSend,
            };
            socket.emit(DRAW_EVENT, payload);
            // 3. Return empty array to CLEAR state AFTER successful emit attempt
            return [];
          } else {
            console.warn(
              "Socket not ready or not in room. Strokes NOT cleared, will try again next interval."
            );
            // 3b. Return original array to KEEP state if emit failed
            return currentStrokes;
          }
        } else {
          // No strokes to send, return the current (empty) state
          return currentStrokes; // or return [];
        }
      });
    }, logInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [socket, isConnected, joinedRoom, mySocketId]);

  return (
    <div className="canvas-container">
      <p>
        Status: <span>{isConnected ? "Connected" : "Disconnected"}</span>
      </p>
      {mySocketId && (
        <p>
          My Socket ID: <span>{mySocketId}</span> (You can use this in the 'Send
          To' field on another client to test direct messages)
        </p>
      )}
      <div>
        <input
          type="text"
          value={roomToJoin}
          onChange={handleRoomToJoinChange}
          placeholder="Enter Room ID"
        />
        <button onClick={handleJoinRoom}>Join</button>
      </div>
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
