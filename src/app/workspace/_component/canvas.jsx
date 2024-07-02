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
   Pencil1Icon,
   TextIcon,
} from "@radix-ui/react-icons";
import ZoomLabel from "./ZoomLabel.tsx";
import { useParams } from "next/navigation.js";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button.tsx";
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

export default function Canvas({}) {
   // shapes
   //   const { mutate: createNewRect, isPending } = useNewRect();
   //   const { newSphere: createNewSphere } = useNewSphere();
   const params = useParams();

   // maps
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
      const canvasDiv = document.getElementById("canvas-div");
      const canvas = canvasRef.current;
      const renderCanvas = renderCanvasRef.current;
      const breakPointsCanvas = breakPointsRef.current;

      canvas.width = width;
      canvas.height = height;
      breakPointsCanvas.width = width;
      breakPointsCanvas.height = height;
      renderCanvas.width = width;
      renderCanvas.height = height;

      const shape = new Shape(
         canvas,
         breakPointsCanvas,
         rectMap,
         circleMap,
         textMap,
         lineMap,
         breakPoints,
         currentActive,
         renderCanvas
      );
      shapeClassRef.current = shape;

      function renderFigure() {
         document
            .querySelectorAll(".canvas-container")
            .forEach((c) => c.remove());
         figure.forEach((fig) => {
            const { x, y, id, isActive, title, width, height, lineWidth } = fig;
            const html = `
             <div style="top : ${y}px; left : ${x}px; z-index: ${
               isActive ? 900 : 999
            }; width : ${width}px; height : ${height}px; scale: ${
               Scale.scale
            }; translate: ${-scrollBar.scrollPositionX}px ${-scrollBar.scrollPositionY}px;" data-container="${id}" class="canvas-container border border-zinc-700 absolute">
               <span class="z-[999] text-xs">${title}</span>
             </div>`;

            if (canvasDiv) canvasDiv.insertAdjacentHTML("afterbegin", html);
         });
      }

      function canvasClick(e) {
         if (config.mode === "pencil") return;
         if (config.currentActive !== currentActive) {
            setCurrentActive(config.currentActive);
         }

         if (config.mode === "free") return;
         const { x: mouseX, y: mouseY } = shape.getTransformedMouseCoords(e);
         if (config.mode === "rect") {
            const newRect = new Rect(mouseX, mouseY, 100, 100, [], 15, true);
            // createNewRect({
            //   projectId: params.workspaceId,
            //   type: newRect.type,
            //   params: newRect,
            // });
            rectMap.set(newRect.id, newRect);

            // change modes
            setMode("free");
            config.mode = "free";

            // add breakpoint
            breakPoints.set(newRect.id, {
               minX: newRect.x,
               minY: newRect.y,
               maxX: newRect.x + newRect.width,
               maxY: newRect.y + newRect.height,
               midX: newRect.x + newRect.width / 2,
               midY: newRect.y + newRect.height / 2,
            });
         } else if (config.mode === "sphere") {
            const newSphere = new Circle(mouseX, mouseY, 50, 50);
            // createNewSphere({
            //   projectId: params.workspaceId,
            //   sphereData: { shapeType: newSphere.type, params: newSphere },
            // });
            circleMap.set(newSphere.id, newSphere);

            // change modes
            setMode("free");
            config.mode = "free";

            // add breakpoint
            breakPoints.set(newSphere.id, {
               minX: newSphere.x - newSphere.xRadius,
               minY: newSphere.y - newSphere.yRadius,
               maxX: newSphere.x + newSphere.xRadius,
               maxY: newSphere.y + newSphere.yRadius,
               midX: newSphere.x,
               midY: newSphere.y,
            });
         } else if (config.mode === "arrowLine") {
            const newArr = new Line(
               "elbow",
               mouseX,
               mouseX,
               mouseX + 100,
               mouseY,
               [
                  { x: mouseX, y: mouseY },
                  { x: mouseX + 100, y: mouseY },
               ],
               true
            );
            lineMap.set(newArr.id, newArr);
            config.mode = "free";
            setMode(config.mode);
         } else if (config.mode === "figure") {
            const newFigure = new Figure(mouseX, mouseY, "Figure", 100, 100);
            figure.set(newFigure.id, newFigure);
            renderFigure();
            config.mode = "free";
            setMode(config.mode);
         }
      }

      function canvasZoomInOutAndScroll(e) {
         // Get the bounding rectangle of the canvas
         const rect = canvas.getBoundingClientRect();
         // Calculate the mouse position relative to the canvas
         const mouseX = e.clientX - rect.left;
         const mouseY = e.clientY - rect.top;
         if (
            mouseX >= 0 &&
            mouseX <= canvas.width &&
            mouseY >= 0 &&
            mouseY <= canvas.height
         ) {
            if (e.ctrlKey) {
               e.preventDefault();

               if (e.deltaY > 0) {
                  // zoom out
                  Scale.scale /= Scale.scalingFactor;
               } else {
                  //zoom in
                  Scale.scale *= Scale.scalingFactor;
               }
               if (mouseX > rect.width / 2) {
                  scrollBar.scrollPositionX += 10;
               } else if (mouseX < rect.width / 2) {
                  scrollBar.scrollPositionX -= 10;
               }
               Scale.scale = Math.round(Scale.scale * 10) / 10;
               setScale(Scale.scale);
               //    e.preventDefault();
               //    // Calculate the mouse position in the canvas coordinates before scaling
               //    const mouseCanvasX =
               //       (mouseX + scrollBar.scrollPositionX) / Scale.scale;
               //    const mouseCanvasY =
               //       (mouseY + scrollBar.scrollPositionY) / Scale.scale;

               //    // Save the old scale
               //    const oldScale = Scale.scale;

               //    // Adjust the scale
               //    if (e.deltaY > 0) {
               //       // Zoom out
               //       Scale.scale /= Scale.scalingFactor;
               //    } else {
               //       // Zoom in
               //       Scale.scale *= Scale.scalingFactor;
               //    }

               //    // Round the scale
               //    Scale.scale = Math.round(Scale.scale * 10) / 10;
               //    setScale(Scale.scale);

               //    // Calculate the new scroll positions to keep the mouse position stationary
               //    scrollBar.scrollPositionX = mouseCanvasX * Scale.scale - mouseX;
               // //    scrollBar.scrollPositionY = mouseCanvasY * Scale.scale - mouseY;
            } else {
               if (e.deltaY > 0) {
                  scrollBar.scrollPositionY += 40; // Adjust this value as needed
               } else {
                  scrollBar.scrollPositionY -= 40; // Adjust this value as needed
               }
            }
            renderFigure();
            shape.draw();
         }
      }

      function newText(event, canvas) {
         if (event.target.tagName === "TEXTAREA") return;

         if (config.mode === "free" || config.mode === "text") {
            const html = `<textarea class="w-fit absolute px-[3px] text-[14px] outline-none z-[999] h-fit shadow-sm bg-transparent" id="input"></textarea>`;
            document.body.insertAdjacentHTML("afterbegin", html);
            const input = document.getElementById("input");
            input.style.left = event.clientX + "px";
            input.style.top = event.clientY + "px";
            input.style.fontSize = "18px";
            input.focus();
            const changeEvent = (e) => {
               const mouseX =
                  event.clientX - canvas.getBoundingClientRect().left;
               const mouseY =
                  event.clientY - canvas.getBoundingClientRect().top;

               const content = e.target.value.split("\n");
               const newText = new Text(
                  mouseX,
                  mouseY,
                  15,
                  content,
                  "Monoscope"
               );
               textMap.set(newText.id, newText);
               input.remove();
            };

            input.addEventListener("change", changeEvent);

            input.addEventListener("blur", (e) => {
               input.removeEventListener("change", changeEvent);
               input.remove();
            });
         }
      }

      function getCurrentShape(current) {
         switch (current.type) {
            case "rect":
               const newShape = new Rect(
                  current.x,
                  current.y,
                  current.width,
                  current.height,
                  current.text,
                  current.textSize
               );
               rectMap.set(newShape.id, newShape);
               return newShape;
            case "sphere":
               const newSphere = new Circle(
                  current.x,
                  current.y,
                  current.xRadius,
                  current.yRadius,
                  current.text,
                  current.textSize
               );
               circleMap.set(newSphere.id, newSphere);
               return newSphere;
            case "text":
               const newText = new Text(
                  current.x,
                  current.y,
                  current.size,
                  current.content,
                  current.font,
                  true,
                  current.height,
                  current.width
               );
               textMap.set(newText.id, newText);
               return newText;
            default:
               break;
         }
      }

      function duplicate(e) {
         if (e.altKey && config.mode !== "handsFree") {
            const current = shape.canvasClick(e);

            if (current) {
               const newShape = getCurrentShape(current);

               const mouseMoveHandler = (moveEvent) => {
                  const { x, y } = shape.getTransformedMouseCoords(moveEvent);
                  newShape.x = x;
                  newShape.y = y;
                  shape.draw();
               };

               const mouseUpHandler = () => {
                  if (newShape.type === "rect") {
                     breakPoints.set(newShape.id, {
                        minX: newShape.x,
                        maxX: newShape.x + newShape.width,
                        minY: newShape.y,
                        maxX: newShape.y + newShape.height,
                     });
                  } else if (newShape.type === "sphere") {
                     breakPoints.set(newShape.id, {
                        minX: newShape.x - newShape.xRadius,
                        maxX: newShape.x + newShape.xRadius,
                        minY: newShape.y - newShape.yRadius,
                        maxX: newShape.y + newShape.yRadius,
                     });
                  }
                  canvas.removeEventListener("mousemove", mouseMoveHandler);
                  canvas.removeEventListener("mouseup", mouseUpHandler);
                  canvas.removeEventListener("click", shape.canvasClick);
               };

               canvas.addEventListener("mousemove", mouseMoveHandler);
               canvas.addEventListener("mouseup", mouseUpHandler);
            }
         } else if (config.mode === "handsFree") {
            let { x, y } = shape.getTransformedMouseCoords(e);
            const MAX_SCROLL_CHANGE = 2;
            const handlermove = (event) => {
               const { x: moveX, y: moveY } =
                  shape.getTransformedMouseCoords(event);
               if (moveX > x) {
                  scrollBar.scrollPositionX =
                     scrollBar.scrollPositionX - (moveX - x);
               } else {
                  scrollBar.scrollPositionX =
                     scrollBar.scrollPositionX + (x - moveX);
               }

               if (moveY > y) {
                  scrollBar.scrollPositionY =
                     scrollBar.scrollPositionY - (moveY - y);
               } else {
                  scrollBar.scrollPositionY =
                     scrollBar.scrollPositionY + (y - moveY);
               }

               if (shape) shape.draw();
            };
            const handlerUp = () => {
               canvas.removeEventListener("mousemove", handlermove);
               canvas.removeEventListener("mouseup", handlerUp);
            };
            canvas.addEventListener("mousemove", handlermove);
            canvas.addEventListener("mouseup", handlerUp);
         }
      }

      function duplicateCtrl_D(e) {
         if (e.ctrlKey && e.key === "d") {
            const padding = 10;
            e.preventDefault();
            rectMap.forEach((rect) => {
               if (rect.isActive) {
                  let newRect = new Rect(
                     rect.x + padding,
                     rect.y + padding,
                     rect.width,
                     rect.height,
                     rect.text,
                     rect.textSize,
                     true
                  );
                  rectMap.set(newRect.id, newRect);
                  breakPoints.set(newRect.id, {
                     minX: rect.x,
                     minY: rect.y,
                     maxX: rect.x + rect.width,
                     maxY: rect.y + rect.height,
                  });
                  rect.isActive = false;
               }
            });
            circleMap.forEach((sphere) => {
               if (sphere.isActive) {
                  const newSphere = new Circle(
                     sphere.x + padding,
                     sphere.y + padding,
                     sphere.xRadius,
                     sphere.yRadius,
                     sphere.text,
                     sphere.textSize,
                     false
                  );
                  circleMap.set(newSphere.id, newSphere);
                  breakPoints.set(newSphere.id, {
                     minX: newSphere.x - newSphere.xRadius,
                     minY: newSphere.y - newSphere.yRadius,
                     maxX: newSphere.x + newSphere.xRadius,
                     maxY: newSphere.y + newSphere.xRadius,
                  });
                  sphere.isActive = false;
               }
            });
            textMap.forEach((text) => {
               if (text.isActive) {
                  const newText = new Text(
                     text.x + padding,
                     text.y + padding,
                     text.size,
                     text.content,
                     true
                  );
                  textMap.set(newText.id, newText);
                  text.isActive = false;
               }
            });
            lineMap.forEach((line) => {
               if (line.isActive) {
                  const newLine = new Line(
                     line.lineType,
                     line.minX,
                     line.minY,
                     line.maxX,
                     line.maxY,
                     line.curvePoints,
                     true
                  );
                  lineMap.set(newLine.id, newLine);
                  console.log(lineMap);
                  Line.isActive = false;
               }
            });
            if (shape) shape.draw();
         }
      }

      shape.initialize();
      canvas.addEventListener("click", canvasClick);
      canvas.addEventListener("mousedown", duplicate);
      window.addEventListener("wheel", canvasZoomInOutAndScroll, {
         passive: false,
      });
      canvas.addEventListener("dblclick", (e) => {
         newText(e, canvas);
      });
      window.addEventListener("keydown", duplicateCtrl_D, { passive: false });

      return () => {
         shape.cleanup();
         canvas.removeEventListener("click", canvasClick);
         canvas.removeEventListener("mousedown", duplicate);
         canvas.removeEventListener("dblclick", (e) => {
            newText(e, canvas);
         });
         window.removeEventListener("wheel", canvasZoomInOutAndScroll);
         window.removeEventListener("keydown", duplicateCtrl_D);
      };
   }, [
      rectMap,
      textMap,
      lineMap,
      circleMap,
      mode,
      breakPoints,
      currentActive,
      figure,
   ]);

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
            <div className="absolute top-[8%] left-2 border border-zinc-800 p-[4px] flex flex-col items-center">
               {buttons.map((button, i) => (
                  <Tooltip key={i}>
                     <TooltipTrigger>
                        <Button
                           onClick={() => {
                              config.mode = button.label;
                              setMode(button.label);
                           }}
                           variant="ghost"
                           size="icon"
                           className={`${
                              button.label === mode ? "bg-accent" : ""
                           } text-xs p-2 w-fit h-fit`}
                        >
                           {button.icon}
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>{button.label}</TooltipContent>
                  </Tooltip>
               ))}
               <Button
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
                        lineMap.set(Math.random() * 10, line);
                        config.mode = "free";
                        setMode(config.mode);
                        shape.draw();
                     };

                     canvas.addEventListener("click", onCanvasClick);
                     canvas.addEventListener("dblclick", onCanvasDblClick);
                  }}
                  variant="ghost"
                  size="icon"
                  className={`${
                     config.mode === "line" && "bg-accent"
                  } text-xs p-2 w-full h-fit`}
               >
                  <div className="w-[2px] h-[20px] bg-white rotate-[142deg]"></div>
               </Button>

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
               canvasRef={canvasRef}
            />
         )}
         <ZoomLabel scale={scale} />
      </>
   );
}
