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
import { Line, Pencil, Rect } from "../_component/stylesClass.js";
import { useNewRect, useNewSphere } from "@/requests/shapeRequests.ts";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

const buttons = [
   { icon: <HandIcon width={"100%"} />, label: "handsFree" },
   { icon: <CursorArrowIcon />, label: "free" },
   { icon: <BoxIcon />, label: "rect" },
   { icon: <CircleIcon />, label: "sphere" },
   { icon: <ArrowBottomRightIcon />, label: "arrowLine" },
   { icon: <TextIcon />, label: "text" },
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
   const params = useParams();

   const [newImage, setImage] = useState(null);

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
      };
   }, []);

   useEffect(() => {
      const canvas = canvasRef.current;
      const shape = shapeClassRef.current;

      let isDrawing = false;
      let draw = null;
      let tempPoint = null;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const renderCanvas = breakPointsRef.current;
      const context = renderCanvas.getContext("2d");

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
            });
            setImage(null);
         }

         //  shape.insertNewAsset(e, setMode, setCurrentActive, currentActive);
      };

      const canvasmousedown = (e) => {
         if (config.mode === "free" || config.mode === "handsFree") return;
         const { x, y } = shape.getTransformedMouseCoords(e);
         draw = new Pencil();
         draw.points.push({ x, y });
         isDrawing = true;
         canvas.addEventListener("mousemove", (e) => {
            if (!isDrawing) return;

            const { x, y } = shape.getTransformedMouseCoords(e);
            canvasmousemove(x, y);
         });
         context.strokeStyle = "white";
         context.stroke();
         tempPoint = { x, y };
      };

      const canvasmousemove = (x, y) => {
         if (config.mode === "rect") {
         } else if (config.mode === "pencil") {
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
            pencilDraw(x, y, context, tempPoint);
            draw.points.push(tempPoint);
            tempPoint = { x, y };
         }
      };

      const mouseUp = () => {
         if (config.mode === "pencil" && isDrawing) {
            isDrawing = false;
            draw.minX = minX;
            draw.maxX = maxX;
            draw.minY = minY;
            draw.maxY = maxY;

            minX = Infinity;
            maxX = -Infinity;
            minY = Infinity;
            maxY = -Infinity;

            // set new drawing
            shape.pencilMap.set(draw.id, draw);
            canvas.removeEventListener("mousemove", canvasmousemove);
            context.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
            shape.drawImage();
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
      };

      document.addEventListener("keydown", keyDownHandler);
      canvas.addEventListener("click", handler);
    //   canvas.addEventListener("mousedown", canvasmousedown);
    //   canvas.addEventListener("mouseup", mouseUp);
      window.addEventListener("wheel", zoomInOut, {
         passive: false,
      });

      return () => {
         document.removeEventListener("keydown", keyDownHandler);
         canvas.removeEventListener("click", handler);
        //  canvas.removeEventListener("mousedown", canvasmousedown);
        //  canvas.removeEventListener("mouseup", mouseUp);
         window.removeEventListener("wheel", zoomInOut);
      };
   }, [currentActive, newImage, mode]);

   return (
      <>
         <canvas
            ref={breakPointsRef}
            className="absolute top-0 left-0 z-[1]"
         ></canvas>
         <canvas
            ref={renderCanvasRef}
            className="absolute top-0 left-0 z-[]"
         ></canvas>
         <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 z-[1]"
         ></canvas>

         <TooltipProvider>
            <div className="absolute top-[8%] left-2 border p-[2px] border-zinc-800 flex flex-col items-center rounded-sm gap-[2px] z-[2]">
               {buttons.map((button, i) => (
                  <Tooltip key={i}>
                     <TooltipTrigger
                        asChild
                        className={`${
                           button.label === mode &&
                           "bg-secondary/70 text-primary-foreground"
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
                     <TooltipContent side="right" sideOffset={6}>
                        {button.label}
                     </TooltipContent>
                  </Tooltip>
               ))}

               <Tooltip>
                  <TooltipTrigger
                     asChild
                     className={`${
                        mode === "pencil" &&
                        "bg-secondary/70 text-primary-foreground"
                     } ${buttonVariants({
                        variant: "ghost",
                        size: "icon",
                     })} text-xs p-[10px] w-fit h-fit`}
                     onClick={() => {
                        config.mode = "pencil";
                        setMode(config.mode);
                     }}
                  >
                     <Pencil1Icon />
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={6}>
                     Pencil
                  </TooltipContent>
               </Tooltip>

               <Tooltip>
                  <TooltipTrigger
                     className={`${
                        config.mode === "line" &&
                        "bg-secondary/70 text-primary-foreground"
                     }  ${buttonVariants({
                        variant: "ghost",
                        size: "icon",
                     })} text-xs p-[10px] w-full h-fit`}
                     onClick={() => {
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
                        const renderCanvas = breakPointsRef.current;
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
                           if (config.mode !== "line") return;
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
                              line = new Line("curve");
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
                  <TooltipContent side="right" sideOffset={6}>
                     Line
                  </TooltipContent>
               </Tooltip>

               <Tooltip>
                  <TooltipTrigger
                     className={`${
                        config.mode === "image" &&
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
                  <TooltipContent side="right" sideOffset={6}>
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
