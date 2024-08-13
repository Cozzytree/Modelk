"use client";

import { Button, buttonVariants } from "@/components/ui/button.tsx";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { config, Scale, scrollBar } from "@/lib/utils.ts";
import {
   ArrowBottomRightIcon,
   BoxIcon,
   BoxModelIcon,
   CircleIcon,
   CursorArrowIcon,
   HandIcon,
   ImageIcon,
   Pencil1Icon,
   SlashIcon,
   TextIcon
} from "@radix-ui/react-icons";
import { useParams } from "next/navigation.js";
import { useEffect, useRef, useState } from "react";
import CanvasRecord from "../_canvas/canvasRecord.js";
import Shape from "../_canvas/shape.js";
import CanvasShapeOptions from "../_component/canvasShapeOptions.jsx";
import Polygon from "../_component/polygon.jsx";
import ZoomLabel from "./ZoomLabel.tsx";

const buttons = [
   { icon: <HandIcon width={"100%"} />, label: "handsFree" },
   { icon: <CursorArrowIcon />, label: "free" },
   { icon: <BoxIcon />, label: "rect" },
   { icon: <CircleIcon />, label: "sphere" },
   { icon: <ArrowBottomRightIcon />, label: "arrowLine" },
   { icon: <SlashIcon />, label: "line" },
   { icon: <TextIcon />, label: "text" },
   { icon: <Pencil1Icon />, label: "pencil" },
];

const width = window.innerWidth;
const height = 1200;

function drawCurve(line, tempPoint, canvas, context) {
   context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before re-drawing

   context.save();
   context.translate(-scrollBar.scrollPositionX, -scrollBar.scrollPositionY);
   context.scale(Scale.scale, Scale.scale);

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
   context.restore();
}

function pencilDraw(x, y, context, lastPoint) {
   // Line width and style settings
   context.save();
   context.scale(Scale.scale, Scale.scale);
   context.translate(-scrollBar.scrollPositionX, -scrollBar.scrollPositionY);
   context.lineWidth = 1.6;
   context.strokeStyle = "white";
   context.lineCap = "round";
   context.lineJoin = "round";

   // Linear interpolation function
   function lerp(start, end, amt) {
      return (1 - amt) * start + amt * end;
   }

   // Number of interpolation steps
   const steps = 10;

   for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const interpolatedX = lerp(lastPoint.x, x, t);
      const interpolatedY = lerp(lastPoint.y, y, t);

      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(interpolatedX, interpolatedY);
      context.stroke();
      context.closePath();

      // Update lastPoint for next iteration
      lastPoint.x = interpolatedX;
      lastPoint.y = interpolatedY;
   }
   context.restore();
}

export default function Canvas() {
   // shapes
   //   const { mutate: createNewRect, isPending } = useNewRect();
   //   const { newSphere: createNewSphere } = useNewSphere();
   const records = new CanvasRecord();
   const params = useParams();

   const [newImage, setImage] = useState(null);
   const [mode, setMode] = useState("free");
   const [currentActive, setCurrentActive] = useState(null);
   const [scale, setScale] = useState(Scale.scale);

   const canvasRef = useRef(null);
   const canvasRecord = useRef(records);
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

      const shape = new Shape(
         canvas,
         breakPointsCanvas,
         renderCanvas,
         (data) => {
            canvasRecord.current.insertNewRecord([data]);
         },
      );
      shapeClassRef.current = shape;

      if (canvasRecord.current)
         canvasRecord.current.pushRecords((data) => {
            if (!data.length) return;
            // console.log(data);
         });

      shape.initialize();
      return () => {
         shape.cleanup();
      };
   }, []);

   useEffect(() => {
      const canvas = canvasRef.current;
      const shape = shapeClassRef.current;

      const handler = (e) => {
         if (config.mode === "pencil") return;

         if (!shape) return;
         if (config.currentActive !== currentActive) {
            setCurrentActive(config.currentActive);
         }
         if (config.mode !== mode) {
            setMode(config.mode);
         }

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
               containerId: null,
            });
            config.mode = "free";
            setMode(config.mode);
            setImage(null);
         }

         if (e.ctrlKey) {
            const s = shape.canvasClick(e);
            if (!s) return;
            s.isActive = true;
            shape.draw();
         }
         if (config.mode === "text") {
            const { x, y } = shape.getTransformedMouseCoords(e);
            shape.inputText(
               x,
               y,
               `<div class="w-fit absolute px-[3px] min-w-[10ch] text-[14px] outline-none z-[999] h-fit shadow-sm bg-transparent" id="input" contenteditable="true"></div>`,
            );
         }
      };

      const zoomInOut = (e) => {
         if (e.target.tagName !== "CANVAS") return;

         if (shape) {
            shape.canvasZoomInOutAndScroll(e, setScale);
         }
      };

      const keyDownHandler = (e) => {
         const v = shape.redoEvent(e);
         shape.deleteAndSeletAll(e);
         const convertToNumber = Number(e.key);
         if (convertToNumber !== NaN) {
            if (buttons[convertToNumber]) {
               config.mode = buttons[convertToNumber].label;
               setMode(config.mode);
            }
         }
      };

      document.addEventListener("keydown", keyDownHandler);
      canvas.addEventListener("click", handler);
      window.addEventListener("wheel", zoomInOut, {
         passive: false,
      });

      return () => {
         document.removeEventListener("keydown", keyDownHandler);
         canvas.removeEventListener("click", handler);
         window.removeEventListener("wheel", zoomInOut);
      };
   }, [currentActive, newImage, mode]);

   function checkCurrentShape() {
      config.currentActive = null;
      if (config.currentActive !== currentActive) {
         setCurrentActive(config.currentActive);
      }
   }

   return (
      <>
         <canvas
            ref={breakPointsRef}
            className="absolute top-0 left-0 z-[1] transition-all duration-200"
         ></canvas>
         <canvas
            ref={renderCanvasRef}
            className="absolute top-0 left-0 z-[1] transition-all duration-200"
         ></canvas>
         <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 z-[1] transition-all duration-200"
         ></canvas>

         <TooltipProvider>
            <div className="absolute top-[8%] left-2 border p-[2px] border-zinc-800 flex flex-col items-center rounded-sm gap-[2px] z-[2]">
               <Polygon setMode={setMode} />

               {buttons.map((button, index) => (
                  <Tooltip key={index}>
                     <TooltipTrigger
                        asChild
                        className={`${button.label === mode &&
                           "bg-secondary/70 text-primary-foreground"
                           } ${buttonVariants({
                              variant: "ghost",
                              size: "icon",
                           })} text-xs p-[10px] w-fit h-fit`}
                        onClick={() => {
                           config.mode = button.label;
                           checkCurrentShape();
                           setMode(button.label);
                           if (
                              shapeClassRef.current &&
                              shapeClassRef.current.massiveSelection
                           ) {
                              shapeClassRef.current.removeActiveForAll();
                           }
                        }}
                     >
                        <p className="flex items-center relative">
                           {button.icon}
                           <span className="absolute top-1/2 left-[69%] text-xs font-bold">
                              {index}
                           </span>
                        </p>
                     </TooltipTrigger>
                     <TooltipContent side="right" sideOffset={6}>
                        {button.label}
                     </TooltipContent>
                  </Tooltip>
               ))}
               <Tooltip>
                  <TooltipTrigger
                     className={`${config.mode === "image" &&
                        "bg-secondary/70 text-primary-foreground"
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
                        onChange={(e) => {
                           const shape = shapeClassRef.current;
                           const file = e.target.files[0];
                           if (!file) {
                              config.mode = "free";
                              setMode(config.mode);
                           }
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
                  <TooltipContent side="right" sideOffset={6}>
                     Image
                  </TooltipContent>
               </Tooltip>

               <Button
                  onClick={() => {
                     config.mode = "figure";
                     setMode(config.mode);
                  }}
                  className={`${config.mode === "figure" && "bg-accent"
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
