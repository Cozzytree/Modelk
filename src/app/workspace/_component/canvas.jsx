"use client";

import { useEffect, useRef, useState } from "react";
import { ScalingFactor, config, Scale } from "@/lib/utils.ts";
import Shape from "./shape.js";
import { Button } from "@/components/ui/button.tsx";
import CanvasShapeOptions from "../_component/canvasShapeOptions.jsx";
import {
  ArrowBottomRightIcon,
  BoxIcon,
  CircleIcon,
  CursorArrowIcon,
} from "@radix-ui/react-icons";
import { Rect, Circle, Line } from "../_component/stylesClass.js";

const buttons = [
  { icon: <CursorArrowIcon />, label: "free" },
  { icon: <BoxIcon />, label: "rect" },
  { icon: <CircleIcon />, label: "sphere" },
  { icon: <ArrowBottomRightIcon />, label: "arrowLine" },
  //   { icon: <Line />, label: "line" },
];

const width = 2000;
const height = 1800;
function drawCurve(line, tempPoint, canvas, context) {
  context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before re-drawing
  context.beginPath();
  context.strokeStyle = "white";
  context.lineWidth = 1;

  // Start the path at the first point
  context.moveTo(line.curvePoints[0].x, line.curvePoints[0].y);

  // Draw the curve through all the points
  for (let i = 0; i < line.curvePoints.length - 1; i++) {
    const cp1 = line.curvePoints[i];
    const cp2 = line.curvePoints[i + 1];

    //   context.arcTo(cp1.x, cp1.y, cp2.x, cp2.y, 50);
    // Calculate the weighted midpoint (e.g., 75% closer to cp2)
    const t = 0.8; // Weighting factor, 0.5 for halfway, closer to 1 for closer to cp2
    const midPointX = (1 - t) * cp1.x + t * cp2.x;
    const midPointY = (1 - t) * cp1.y + t * cp2.y;

    // Use cp1 as the control point and the adjusted midpoint as the end point
    context.quadraticCurveTo(cp1.x, cp1.y, midPointX, midPointY);
  }

  //    Handle the last segment, if tempPoint is provided
  if (tempPoint) {
    const lastCp = line.curvePoints[line.curvePoints.length - 1];
    //   context.arcTo(lastCp.x, lastCp.y, tempPoint.x, tempPoint.y, 50);

    context.quadraticCurveTo(lastCp.x, lastCp.y, tempPoint.x, tempPoint.y);
  }

  context.stroke();
  context.closePath();
}

export default function Canvas() {
  const [rectMap, setRectMap] = useState(new Map());
  const [circleMap, setCircleMap] = useState(new Map());
  const [textMap, setTextMap] = useState(new Map());
  const [lineMap, setLineMap] = useState(new Map());
  const [breakPoints, setBreakPoints] = useState(new Map());
  const [mode, setMode] = useState("free");
  const [currentActive, setCurrentActive] = useState(null);

  const canvasRef = useRef(null);
  const breakPointsRef = useRef(null);
  const shapeClassRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const breakPointsCanvas = breakPointsRef.current;

    canvas.width = width;
    canvas.height = height;
    breakPointsCanvas.width = width;
    breakPointsCanvas.height = height;

    const shape = new Shape(
      canvas,
      breakPointsCanvas,
      rectMap,
      circleMap,
      textMap,
      lineMap,
      breakPoints,
      mode,
      currentActive
    );
    shapeClassRef.current = shape;

    const canvasClick = (e) => {
      if (config.currentActive !== currentActive) {
        setCurrentActive(config.currentActive);
      }

      if (mode === "free") return;
      const { x: mouseX, y: mouseY } = shape.getTransformedMouseCoords(e);
      if (mode === "rect") {
        const newRect = new Rect(mouseX, mouseY, 100, 100);
        const newMap = new Map(rectMap);
        const key = Date.now();
        newMap.set(key, newRect); // Use Date.now() or a unique key
        setRectMap(newMap);
        setMode("free");

        const newBreakPoint = new Map(breakPoints);
        newBreakPoint.set(key, {
          minX: newRect.x,
          minY: newRect.y,
          maxX: newRect.x + newRect.width,
          maxY: newRect.y + newRect.height,
        });
        setBreakPoints(newBreakPoint);
      } else if (mode === "sphere") {
        const newSphere = new Circle(mouseX, mouseY, 50, 50);
        const newMap = new Map(circleMap);
        const key = Date.now();
        newMap.set(key, newSphere);
        setCircleMap(newMap);

        setMode("free");
        const newBreakPoint = new Map(breakPoints);
        newBreakPoint.set(key, {
          minX: newSphere.x - newSphere.xRadius,
          minY: newSphere.y - newSphere.yRadius,
          maxX: newSphere.x + newSphere.xRadius,
          maxY: newSphere.y + newSphere.yRadius,
          mid: newSphere.x,
        });
        setBreakPoints(newBreakPoint);
      }

      shape.draw(); // Trigger draw after adding new shape
    };

    const canvasZoomInOut = (e) => {
      // Get the bounding rectangle of the canvas
      const rect = canvas.getBoundingClientRect();

      // Calculate the mouse position relative to the canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      if (
        e.ctrlKey &&
        mouseX >= 0 &&
        mouseX <= canvas.width &&
        mouseY >= 0 &&
        mouseY <= canvas.height
      ) {
        e.preventDefault();
        if (e.deltaY > 0) {
          // zoom out
          Scale.scale /= Scale.scalingFactor;
        } else {
          //zoom in
          Scale.scale *= Scale.scalingFactor;
        }
        Scale.scale = Math.round(Scale.scale * 10) / 10;

        shape.draw();
      }
    };

    shape.initialize();
    canvas.addEventListener("click", canvasClick);
    window.addEventListener("wheel", canvasZoomInOut, { passive: false });
    shape.draw();

    return () => {
      shape.cleanup();
      canvas.removeEventListener("click", canvasClick);
      window.removeEventListener("wheel", canvasZoomInOut, { passive: false });
    };
  }, [rectMap, textMap, lineMap, circleMap, mode, breakPoints, currentActive]);

  return (
    <>
      <canvas ref={breakPointsRef} className="absolute top-0 left-0"></canvas>
      <canvas ref={canvasRef} className="absolute top-0 left-0"></canvas>
      <div className="absolute top-10 left-2 border border-zinc-800 p-[4px] flex flex-col items-center">
        {buttons.map((button, i) => (
          <Button
            onClick={() => setMode(button.label)}
            variant="ghost"
            size="icon"
            className={`${
              button.label === mode ? "bg-secondary" : ""
            } text-xs p-2 w-fit h-fit`}
            key={i}
          >
            {button.icon}
          </Button>
        ))}
        <Button
          onClick={() => {
            let line = null;
            let isDrawing = false;
            let tempPoint = null;
            let minX = Infinity;
            let maxX = -Infinity;
            let minY = Infinity;
            let maxY = -Infinity;
            const shape = shapeClassRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            const onMouseMove = (e) => {
              if (line && isDrawing && shape) {
                const { x, y } = shape.getTransformedMouseCoords(e);
                tempPoint = { x: x, y: y };
                drawCurve(line, tempPoint, canvas, context);
              }
            };

            const onCanvasClick = (e) => {
              const { x, y } = shape.getTransformedMouseCoords(e);
              if (x < minX) {
                minX = x;
              }
              if (x > maxX) {
                maxX = x;
              }
              if (y < minY) {
                minY = y;
              }
              if (y > maxY) {
                maxY = y;
              }

              if (!line && !isDrawing) {
                line = new Line();
                line.curvePoints.push({ x: x, y: y });
                isDrawing = true;
                canvas.addEventListener("mousemove", onMouseMove);
              } else {
                line.curvePoints.push({ x: x, y: y });
              }
              tempPoint = null; // Reset the temp point after adding the click point to the array
            };

            const onCanvasDblClick = (e) => {
              isDrawing = false;
              canvas.removeEventListener("mousemove", onMouseMove);
              canvas.removeEventListener("click", onCanvasClick);
              canvas.removeEventListener("dblclick", onCanvasDblClick);
              line.curvePoints.pop();
              line.minX = minX;
              line.maxX = maxX;
              line.minY = minY;
              line.maxY = maxY;
              //   line.isStraight = true;
              lineMap.set(Math.random() * 10, line);
              shape.draw();
            };

            canvas.addEventListener("click", onCanvasClick);
            canvas.addEventListener("dblclick", onCanvasDblClick);
          }}
          variant="ghost"
          size="icon"
          className={`text-xs p-2 w-full h-fit`}
        >
          <div className="w-[2px] h-[20px] bg-white rotate-[142deg]"></div>
        </Button>
      </div>

      {currentActive && (
        <CanvasShapeOptions
          shapeClassRef={shapeClassRef.current}
          currentActive={currentActive}
          setCurrent={setCurrentActive}
        />
      )}
    </>
  );
}
