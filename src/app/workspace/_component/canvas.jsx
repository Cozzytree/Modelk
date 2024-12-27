"use client";

import EmojiPicker from "emoji-picker-react";
import { Button, buttonVariants } from "@/components/ui/button.tsx";
import { RedoUndo } from "../_canvas/redoundo.js";
import {
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { config, Scale } from "@/lib/utils.ts";
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
   TextIcon,
} from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";
import { canvasRecord } from "../_canvas/canvasRecord.js";
import Shape from "../_canvas/shape.js";
import CanvasShapeOptions from "../_component/canvasShapeOptions.jsx";
import Polygon from "../_component/polygon.jsx";
import ZoomLabel from "./ZoomLabel.tsx";
import { ImageShape } from "./stylesClass.js";
import {
   useDeleteSHapes,
   useGetShapes,
   useInsertShapes,
   useUpdateShapes,
} from "@/requests/shapeRequests.ts";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import {
   Menubar,
   MenubarContent,
   MenubarMenu,
   MenubarTrigger,
} from "@/components/ui/menubar.tsx";
import {
   Dialog,
   DialogContent,
   DialogTrigger,
} from "@/components/ui/dialog.tsx";

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

const startupData = [
   {
      Params: {
         dash: [0, 0],
         allignVertical: "center",
         angle: 0,
         borderColor: "#33FFF5",
         containerId: null,
         fillStyle: "transparent",
         fillType: "full",
         font: "Verdana",
         fontVarient: "normal",
         fontWeight: "bold",
         height: 169,
         id: 1723987825532,
         isActive: false,
         lineWidth: 5,
         offsetX: -191.5,
         offsetY: -182,
         pointTo: [1724326688219, 1724326699169],
         radius: 10,
         text: ["LET'S BEGIN", ""],
         textPosition: "center",
         textSize: 35,
         type: "rect",
         width: 285.5,
         x: 526.5,
         y: 213,
      },
   },
   {
      Params: {
         dash: [0, 0],
         allignVertical: "center",
         angle: 0,
         borderColor: "white",
         containerId: null,
         fillStyle: "#FF33A180",
         fillType: "full",
         font: "sans-serif",
         fontVarient: "normal",
         fontWeight: "bold",
         height: 89,
         id: 1724326685079,
         isActive: false,
         lineWidth: 1.7,
         offsetX: -395,
         offsetY: 4,
         pointTo: [1724326688219],
         radius: 10,
         text: ["DRAW"],
         textPosition: "center",
         textSize: 20,
         type: "rect",
         width: 136,
         x: 323,
         y: 399,
      },
   },
   {
      Params: {
         dash: [0, 0],
         allignVertical: "top",
         angle: 0,
         arrowLeft: false,
         arrowRight: true,
         borderColor: "white",
         containerId: null,
         curvePoints: [
            { offsetX: -327, offsetY: 4, x: 391, y: 399 },
            { offsetX: -327, offsetY: -97.5, x: 391, y: 297.5 },
            { offsetX: -191.5, offsetY: -97.5, x: 526.5, y: 297.5 },
         ],
         endTo: 1723987825532,
         fillStyle: "transparent",
         fillType: "full",
         font: "Arial",
         fontVarient: "normal",
         fontWeight: "normal",
         height: 100,
         id: 1724326688219,
         isActive: false,
         lineType: "elbow",
         lineWidth: 1,
         maxX: 526.5,
         maxY: 399,
         minX: 391,
         minY: 297.5,
         radius: 10,
         startTo: 1724326685079,
         text: [],
         textPosition: "center",
         textSize: 15,
         type: "line",
         width: 100,
      },
   },
   {
      Params: {
         dash: [0, 0],
         allignVertical: "top",
         angle: 0,
         arrowLeft: false,
         arrowRight: true,
         borderColor: "white",
         containerId: null,
         curvePoints: [
            { offsetX: 94, offsetY: -97.5, x: 812, y: 297.5 },
            { offsetX: 236, offsetY: -97.5, x: 954, y: 297.5 },
            { offsetX: 236, offsetY: -183, x: 954, y: 212 },
         ],
         endTo: 1724326695660,
         fillStyle: "transparent",
         fillType: "full",
         font: "Arial",
         fontVarient: "normal",
         fontWeight: "normal",
         height: 100,
         id: 1724326699169,
         isActive: false,
         lineType: "elbow",
         lineWidth: 1,
         maxX: 954,
         maxY: 297.5,
         minX: 812,
         minY: 212,
         radius: 10,
         startTo: 1723987825532,
         text: [],
         dash: [0, 0],
         textPosition: "center",
         textSize: 15,
         type: "line",
         width: 100,
      },
   },
   {
      Params: {
         dash: [0, 0],
         allignVertical: "top",
         angle: 0,
         borderColor: "white",
         containerId: null,
         content: ["Hello", "World"],
         fillStyle: "white",
         fillType: "full",
         font: "Monoscope",
         fontVarient: "normal",
         fontWeight: "normal",
         height: 5,
         id: 1724326701959,
         isActive: false,
         lineWidth: 1.7,
         offsetX: 241,
         offsetY: -232,
         pointTo: [],
         radius: 10,
         text: ["Hello", "World"],
         textPosition: "center",
         textSize: 15,
         type: "text",
         width: 0,
         x: 959,
         y: 163,
      },
   },
];

export default function Canvas({ id }) {
   const {
      data: shapesfromDB,
      isLoading,
      refetch: fetchShapes,
   } = useGetShapes(id);
   const { mutate: insertShape } = useInsertShapes();
   const { mutate: updateShapes } = useUpdateShapes();
   const { mutate: deleteShapes } = useDeleteSHapes();
   // const { user } = useKindeBrowserClient();

   const initialData = useRef(startupData);
   const [mode, setMode] = useState("free");
   const [currentActive, setCurrentActive] = useState([]);
   const [scale, setScale] = useState(Scale.scale);
   const [shapeInitialized, setShapeInitialized] = useState(false);

   const canvasRef = useRef(null);
   const canvasR = useRef(canvasRecord);
   const breakPointsRef = useRef(null);
   const shapeClassRef = useRef();
   const renderCanvasRef = useRef(null);
   const socketRef = useRef(null);

   useEffect(() => {
      if (isLoading) return;
      const canvas = canvasRef.current;
      const breakPointsCanvas = breakPointsRef.current;
      const renderCanvas = renderCanvasRef.current;

      const socket = new WebSocket("ws://localhost:4000/ws");
      socket.onopen = function (e) {
         console.log(e);
      };
      socketRef.current = socket;

      socket.onmessage = function (data) {
         console.log("returned :", data.data);
      };

      canvas.width = width;
      canvas.height = height;
      breakPointsCanvas.width = width;
      breakPointsCanvas.height = height;
      renderCanvas.width = width;
      renderCanvas.height = height;

      if (shapesfromDB && shapesfromDB?.length !== 0 && user) {
         initialData.current = shapesfromDB;
      }

      // store initial data;
      // if (canvasR.current) {
      //    if (!shapesfromDB) {
      //       canvasR.current.setInitialState(JSON.parse(JSON.stringify([])));
      //    } else {
      //       canvasR.current.setInitialState(
      //          JSON.parse(JSON.stringify(initialData.current)),
      //       );
      //    }
      // }

      const onChange = (data) => {
         if (data) {
            setCurrentActive(data);
         } else setCurrentActive(() => config.currentActive);
      };

      const shape = new Shape(
         canvas,
         breakPointsCanvas,
         renderCanvas,
         initialData.current,
         onChange,
      );
      shapeClassRef.current = shape;

      setShapeInitialized(true);
      shape.initializeShapeArray();
      shape.initialize();
      shape.draw();

      const keyDownHandler = (e) => {
         if (!shape) return;
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
      return () => {
         shape.drawImage();
         shape.draw();
         shape.cleanup();
         document.removeEventListener("keydown", keyDownHandler);
      };
   }, [isLoading, shapesfromDB]);

   useEffect(() => {
      const canvas = canvasRef.current;
      const shape = shapeClassRef.current;
      if (!shape) return;

      const zoomInOut = (e) => {
         if (e.target.tagName !== "CANVAS") return;

         if (shape) {
            shape.canvasZoomInOutAndScroll(e, setScale);
         }
      };

      const handler = (e) => {
         if (config.mode === "pencil") return;

         if (config.mode !== mode) {
            setMode(config.mode);
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

      canvas.addEventListener("click", handler);
      window.addEventListener("wheel", zoomInOut, {
         passive: false,
      });

      return () => {
         canvas.removeEventListener("click", handler);
         window.removeEventListener("wheel", zoomInOut);
      };
   }, [currentActive, mode]);

   useEffect(() => {
      // if (!shapeClassRef.current || !shapeInitialized || !user) return;
      if (!shapeClassRef.current) return;
      const shape = shapeClassRef.current;
      const record = canvasR.current;
      let interval;
      interval = setInterval(() => {
         record.updateCurrentState(shape.canvasShapes);
         const { newShape, updated } = record.pushRecords();
         if (
            newShape.length > 0 ||
            updated.length > 0 ||
            record.deletedShapes.size > 0
         ) {
            // insert
            // if (newShape.length > 0) {
            //    insertShape({ shapes: newShape, projectId: id });
            // }

            // if (updated.length > 0) {
            //    updateShapes({ projectId: id, shapes: updated });
            // }

            // if (record.deletedShapes.size > 0) {
            //    deleteShapes({
            //       shapes: Array.from(record.deletedShapes.values()),
            //       projectId: id,
            //    });
            // }
            record.initialState = new Map(record.currentState);
         }
      }, 10000);
      return () => {
         clearInterval(interval);
      };
   }, [id, shapeInitialized, insertShape, updateShapes, deleteShapes]);

   function checkCurrentShape() {
      setCurrentActive(config.currentActive);
   }

   if (isLoading) {
      return (
         <div className="w-full h-screen flex justify-center items-center">
            Loading
         </div>
      );
   }

   return (
      <>
         <div className="fixed top-10 right-10 z-[100]">
            {shapeClassRef.current &&
               shapeClassRef.current?.canvasShapes.length - 1}
         </div>
         <Button
            onClick={() => {
               if (socketRef.current) {
                  socketRef.current.send(
                     JSON.stringify({
                        userId: "Hootowl",
                        shapeId: "i am here",
                        params: { x: 10, y: 10, width: 100, height: 100 },
                     }),
                  );
               }
            }}
            className="absolute top-10 left-10 z-[9999]"
         >
            Send
         </Button>
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
               <Dialog>
                  <DialogTrigger>
                     <ImageIcon />
                  </DialogTrigger>
                  <DialogContent className="w-fit h-fit">
                     <EmojiPicker
                        onEmojiClick={(e) => {
                           const url = e.getImageUrl();
                           const img = document.createElement("img");
                           img.src = url;
                           img.style.width = "100px";
                           img.style.height = "100px";
                           img.classList.add(
                              "fixed",
                              "top-10",
                              "left-10",
                              "z-[100]",
                           );
                        }}
                     />
                  </DialogContent>
               </Dialog>

               {buttons.map((button, index) => (
                  <Tooltip key={index}>
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

         {(currentActive?.length || config.currentActive.length) && (
            <CanvasShapeOptions
               shapeClassRef={shapeClassRef.current}
               currentActive={currentActive}
               setCurrent={setCurrentActive}
            />
         )}
         <div className="absolute right-4 top-14 z-20">
            <Menubar className="h-fit p-0">
               <MenubarMenu>
                  <MenubarTrigger
                     className={`${buttonVariants({ variant: "ghost", size: "sm" })} p-1 h-fit `}
                  >
                     {(scale * 100).toFixed(0)}
                  </MenubarTrigger>
                  <MenubarContent side="left">
                     <ZoomLabel
                        setScale={setScale}
                        scale={scale}
                        canvas={shapeClassRef.current}
                     />
                  </MenubarContent>
               </MenubarMenu>
            </Menubar>
         </div>
      </>
   );
}
