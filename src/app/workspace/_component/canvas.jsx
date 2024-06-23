"use client";

import { useEffect, useRef, useState } from "react";
import Shape from "./shape.js";
import { Button } from "@/components/ui/button.tsx";
import {
  ArrowBottomRightIcon,
  BoxIcon,
  CircleIcon,
  CursorArrowIcon,
} from "@radix-ui/react-icons";
import { Rect, Circle } from "../_component/stylesClass.js";

const buttons = [
  { icon: <CursorArrowIcon />, label: "free" },
  { icon: <BoxIcon />, label: "rect" },
  { icon: <CircleIcon />, label: "sphere" },
  { icon: <ArrowBottomRightIcon />, label: "arrowLine" },
];

const width = 1800;
const height = 1000;

export default function Canvas() {
  const [rectMap, setRectMap] = useState(new Map());
  const [circleMap, setCircleMap] = useState(new Map());
  const [textMap, setTextMap] = useState(new Map());
  const [lineMap, setLineMap] = useState(new Map());
  const [breakPoints, setBreakPoints] = useState(new Map());
  const [mode, setMode] = useState("free");
  const [currentActive, setCurrentActive] = useState({});

  const canvasRef = useRef(null);
  const breakPointsRef = useRef(null);

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

    const canvasClick = (e) => {
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
        newMap.set(Date.now(), newSphere);
        setCircleMap(newMap);
        setMode("free");
      }
      shape.draw(); // Trigger draw after adding new shape
    };

    setCurrentActive(shape.initialize());
    canvas.addEventListener("click", canvasClick);
    shape.draw();
    console.log(currentActive);

    return () => {
      shape.cleanup();
      canvas.removeEventListener("click", canvasClick);
    };
  }, [rectMap, textMap, lineMap, circleMap, mode, breakPoints, currentActive]);

  return (
    <>
      <canvas ref={breakPointsRef} className="absolute top-0 left-0"></canvas>
      <canvas ref={canvasRef} className="absolute top-0 left-0"></canvas>
      <div className="absolute top-3 left-2 border border-zinc-800 p-[4px] flex flex-col items-center">
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
      </div>
    </>
  );
}
