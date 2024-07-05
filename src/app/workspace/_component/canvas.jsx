"use client";

import Shape from "./shape.js";
import CanvasShapeOptions from "../_component/canvasShapeOptions.jsx";
import {
   ArrowBottomRightIcon,
   BoxIcon,
   BoxModelIcon,
   CircleIcon,
   CursorArrowIcon,
   HandIcon,
   ImageIcon,
   Pencil1Icon,
   TextIcon,
} from "@radix-ui/react-icons";
import ZoomLabel from "./ZoomLabel.tsx";
import { useParams } from "next/navigation.js";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { config, Scale, scrollBar } from "@/lib/utils.ts";
import { Rect, Circle, Line, Text, Figure } from "../_component/stylesClass.js";
import { useNewRect, useNewSphere } from "@/requests/shapeRequests.ts";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

const buttons = [
   { icon: <HandIcon />, label: "handsFree" },
   { icon: <CursorArrowIcon />, label: "free" },
   { icon: <BoxIcon />, label: "rect" },
   { icon: <CircleIcon />, label: "sphere" },
   { icon: <ArrowBottomRightIcon />, label: "arrowLine" },
   { icon: <TextIcon />, label: "text" },
   { icon: <Pencil1Icon />, label: "pencil" },
];

const width = window.innerWidth;
const height = window.innerHeight;

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
   // shapes
   //   const { mutate: createNewRect, isPending } = useNewRect();
   //   const { newSphere: createNewSphere } = useNewSphere();
   const params = useParams();

   const [newImage, setImage] = useState(null);
   // maps
   const [imageMap, setImageMap] = useState(new Map());
   const [rectMap, setRectMap] = useState(new Map());
   const [circleMap, setCircleMap] = useState(new Map());
   const [textMap, setTextMap] = useState(new Map());
   const [lineMap, setLineMap] = useState(new Map());
   const [breakPoints, setBreakPoints] = useState(new Map());
   const [figure] = useState(new Map());
   const [pencil, setPencil] = useState(new Map());

   const [mode, setMode] = useState("free");
   const [currentActive, setCurrentActive] = useState(null);
   const [scale, setScale] = useState(Scale.scale);

   const canvasRef = useRef(null);
   const breakPointsRef = useRef(null);
   const shapeClassRef = useRef(null);
   const renderCanvasRef = useRef(null);

   useEffect(() => {
      const canvas = canvasRef.current;
      const breakPointsCanvas = breakPointsRef.current;
      const renderCanvas = renderCanvasRef.current;

      canvas.width = width;
      canvas.height = height;
      breakPointsCanvas.width = width;
      breakPointsCanvas.height = height;
      renderCanvas.width = width;
      renderCanvas.height = height;

      const shape = new Shape(canvas, breakPointsCanvas, renderCanvas);
      shapeClassRef.current = shape;

      shape.initialize();
      return () => {
         shape.cleanup();
         canvas.removeEventListener("click", shape.insertNewAsset);
      };
   }, []);

   useEffect(() => {
      const canvas = canvasRef.current;
      const shape = shapeClassRef.current;
      const handler = (e) => {
         if (config.mode === "pencil") return;
         if (!shape) return;

         if (newImage) {
            const { x, y } = shape.getTransformedMouseCoords(e);
            shape.insertImage({
               x: x,
               y: y,
               width: 300,
               height: 200,
               src: newImage,
               isActive: true,
               type: "image",
               pointTo: [],
               radius: 2,
            });
            setImage(null);
         }
         shape.insertNewAsset(e, setMode, setCurrentActive, currentActive);
      };

      const zoomInOut = (e) => {
         if (e.target.tagName !== "CANVAS") return;

         if (shape) {
            shape.canvasZoomInOutAndScroll(e, setScale);
         }
      };

      canvas.addEventListener("click", handler);
      window.addEventListener("wheel", zoomInOut, {
         passive: false,
      });

      return () => {
         canvas.removeEventListener("click", handler);
         window.removeEventListener("wheel", zoomInOut);
      };
   }, [currentActive, newImage]);

   return (
      <>
         <canvas
            ref={breakPointsRef}
            className="absolute top-0 left-0"
         ></canvas>
         <canvas
            ref={renderCanvasRef}
            className="absolute top-0 left-0"
         ></canvas>
         <canvas ref={canvasRef} className="absolute top-0 left-0"></canvas>
         <TooltipProvider>
            <div className="absolute top-[8%] left-2 border p-[2px] border-zinc-800 flex flex-col items-center rounded-sm gap-[2px]">
               {buttons.map((button, i) => (
                  <Tooltip key={i}>
                     <TooltipTrigger
                        asChild
                        className={`${
                           button.label === mode ? "bg-accent" : ""
                        } ${buttonVariants({
                           variant: "ghost",
                           size: "icon",
                        })} text-xs p-[10px] w-fit h-fit`}
                        onClick={() => {
                           config.mode = button.label;
                           setMode(button.label);
                        }}
                     >
                        {button.icon}
                     </TooltipTrigger>
                     <TooltipContent
                        side="right"
                        sideOffset={6}
                        className=" bg-secondary text-foreground"
                     >
                        {button.label}
                     </TooltipContent>
                  </Tooltip>
               ))}
               <Tooltip>
                  <TooltipTrigger
                     className={`${
                        config.mode === "line" && "bg-accent"
                     }  ${buttonVariants({
                        variant: "ghost",
                        size: "icon",
                     })} text-xs p-[10px] w-full h-fit`}
                     onClick={() => {
                        if (
                           config.mode === "handsFree" ||
                           config.mode === "rect" ||
                           config.mode === "sphere" ||
                           config.mode === "text"
                        )
                           return;

                        //change mode
                        config.mode = "line";
                        setMode(config.mode);

                        let line = null;
                        let isDrawing = false;
                        let tempPoint = null;
                        let minX = Infinity;
                        let maxX = -Infinity;
                        let minY = Infinity;
                        let maxY = -Infinity;
                        const shape = shapeClassRef.current;
                        const canvas = canvasRef.current;
                        const renderCanvas = renderCanvasRef.current;
                        const context = renderCanvas.getContext("2d");

                        const onMouseMove = (e) => {
                           if (line && isDrawing && shape) {
                              const { x, y } =
                                 shape.getTransformedMouseCoords(e);
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
                           canvas.removeEventListener(
                              "dblclick",
                              onCanvasDblClick
                           );
                           line.curvePoints.pop();
                           line.minX = minX;
                           line.maxX = maxX;
                           line.minY = minY;
                           line.maxY = maxY;
                           //   line.isStraight = true;
                           shape.lineMap.set(Math.random() * 10, line);
                           config.mode = "free";
                           setMode(config.mode);
                           context.clearRect(0, 0, canvas.width, canvas.height);
                           shape.draw();
                        };

                        canvas.addEventListener("click", onCanvasClick);
                        canvas.addEventListener("dblclick", onCanvasDblClick);
                     }}
                  >
                     <div className="w-[2px] h-[20px] bg-white rotate-[142deg]"></div>
                  </TooltipTrigger>
                  <TooltipContent
                     side="right"
                     sideOffset={6}
                     className=" bg-secondary text-foreground"
                  >
                     Line
                  </TooltipContent>
               </Tooltip>

               <Tooltip>
                  <TooltipTrigger
                     className={`${
                        config.mode === "image" && "bg-accent"
                     } ${buttonVariants({
                        variant: "ghost",
                        size: "icon",
                     })} text-xs p-[10px] w-full h-fit`}
                  >
                     <label
                        onClick={() => {
                           config.mode = "image";
                           setMode(config.mode);
                        }}
                        htmlFor="image"
                     >
                        <ImageIcon fill="transparent" />
                     </label>
                     <input
                        onChange={() => {
                           const shape = shapeClassRef.current;
                           const file = event.target.files[0];
                           const reader = new FileReader();
                           reader.onload = () => {
                              const base64Image = reader.result;
                              setImage(base64Image);
                           };
                           reader.readAsDataURL(file);
                        }}
                        type="file"
                        accept="image/*"
                        id="image"
                        className="hidden"
                     />
                  </TooltipTrigger>
                  <TooltipContent
                     side="right"
                     sideOffset={6}
                     className=" bg-secondary text-foreground"
                  >
                     Image
                  </TooltipContent>
               </Tooltip>

               <Button
                  onClick={() => {
                     config.mode = "figure";
                     setMode(config.mode);
                  }}
                  className={`${
                     config.mode === "figure" && "bg-accent"
                  } text-xs p-2 w-full h-fit`}
                  variant="ghost"
                  size="icon"
               >
                  <BoxModelIcon />
               </Button>
            </div>
         </TooltipProvider>

         {currentActive && (
            <CanvasShapeOptions
               shapeClassRef={shapeClassRef.current}
               currentActive={currentActive}
               setCurrent={setCurrentActive}
            />
         )}
         <ZoomLabel scale={scale} />
      </>
   );
}
