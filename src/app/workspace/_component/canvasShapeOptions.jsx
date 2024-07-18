import ColorOptions from "./colorOptions.jsx";
import { Button } from "@/components/ui/button";
import {
   Menubar,
   MenubarContent,
   MenubarMenu,
   MenubarSub,
   MenubarSubContent,
   MenubarSubTrigger,
   MenubarTrigger,
} from "@/components/ui/menubar";
import { config, thickness, lineType, shapeProps } from "@/lib/utils.ts";
import {
   AlignCenterVerticallyIcon,
   ArrowLeftIcon,
   ArrowRightIcon,
   ArrowTopRightIcon,
   BoxIcon,
   FontBoldIcon,
   FontFamilyIcon,
   FontSizeIcon,
   FontStyleIcon,
   LetterCaseLowercaseIcon,
   LetterCaseUppercaseIcon,
   MinusIcon,
   PlusIcon,
   SquareIcon,
   TextAlignBottomIcon,
   TextAlignCenterIcon,
   TextAlignJustifyIcon,
   TextAlignLeftIcon,
   TextAlignMiddleIcon,
   TextAlignRightIcon,
   TextAlignTopIcon,
   WidthIcon,
} from "@radix-ui/react-icons";
import { useEffect, useRef, useState } from "react";

export default function CanvasShapeOptions({
   currentActive,
   setCurrent,
   shapeClassRef,
}) {
   const [inputText, setInputText] = useState(false);
   const [textContent, setTextContent] = useState("");
   const [fontSize, setFontSize] = useState(config.currentActive?.textSize);
   const inputTextRef = useRef(null);

   useEffect(() => {
      let text = "";
      if (!currentActive.text) return;

      currentActive.text.forEach((t) => {
         if (t.length) text += t + "\n";
      });

      setTextContent(text);
      setFontSize(currentActive?.textSize);
   }, [currentActive]);

   const handleRadius = (val) => {
      setInputText(false);
      if (config.currentActive) {
         config.currentActive.radius = val;
         setCurrent(config.currentActive);
         if (shapeClassRef) shapeClassRef.draw();
      }
   };

   const changeFontSizes = (value) => {
      setInputText(false);
      if (config.currentActive) {
         config.currentActive.textSize = value;
         setCurrent(config.currentActive);
         if (shapeClassRef) shapeClassRef.draw();
      }
   };

   const handleFillStyle = (color) => {
      setInputText(false);
      if (config.currentActive) {
         if (config.currentActive.type === "line") {
            config.currentActive.borderColor = color;
         } else config.currentActive.fillStyle = color;
         setCurrent(config.currentActive);
         if (shapeClassRef) shapeClassRef.draw();
      }
   };

   const lineColor = (color) => {
      setInputText(false);
      if (config.currentActive) {
         config.currentActive.borderColor = color;
         setCurrent(config.currentActive);
         if (shapeClassRef) shapeClassRef.draw();
      }
   };

   const alignText = (allign) => {
      if (config.currentActive) {
         config.currentActive.textPosition = allign;
         if (shapeClassRef) shapeClassRef.draw();
         setCurrent(config.currentActive);
      }
   };

   const changeFont = (font) => {
      if (config.currentActive) {
         config.currentActive.font = font;
         setCurrent(config.currentActive);
         if (shapeClassRef) shapeClassRef.draw();
      }
   };

   const changeFontWeight = (weight) => {
      if (config.currentActive) {
         config.currentActive.fontWeight = weight;
         setCurrent(config.currentActive);
         if (shapeClassRef) shapeClassRef.draw();
      }
   };

   const textAlignVertical = (position) => {
      if (config.currentActive) {
         config.currentActive.allignVertical = position;
         setCurrent(config.currentActive);
         if (shapeClassRef) shapeClassRef.draw();
      }
   };

   return (
      <>
         <div className="absolute bottom-5 left-[50%] z-[999] translate-x-[-50%] flex items-center divide-x-2 border border-zinc-800 gap-1">
            {currentActive.type !== "text" && (
               <div className="relative">
                  <Button
                     variant="ghost"
                     size="icon"
                     onClick={() => {
                        setInputText((o) => !o);
                        inputTextRef.current && inputTextRef.current.focus();
                     }}
                     className="p-2 h-fit font-extrabold"
                  >
                     T
                  </Button>
                  {inputText && (
                     <textarea
                        ref={inputTextRef}
                        placeholder="text"
                        className="text-xs absolute -top-[150%] left-0 p-1 bg-transparent outline-none focus:outline-none w-fit h-[5ch]"
                        defaultValue={textContent}
                        onBlur={(e) => {
                           const content = e.target.value.split("\n");
                           currentActive.text = content;
                           shapeClassRef.draw();
                        }}
                     />
                  )}
               </div>
            )}

            <Menubar>
               <MenubarMenu className="p-1">
                  <MenubarTrigger className="w-full h-full">
                     <BoxIcon
                        style={{
                           background:
                              currentActive.fillStyle ||
                              currentActive.borderColor,
                        }}
                     />
                  </MenubarTrigger>
                  <MenubarContent className="grid grid-cols-4 w-fit gap-[3px]">
                     <ColorOptions onClick={handleFillStyle} />
                  </MenubarContent>
               </MenubarMenu>

               {/* {text allign} */}
               {currentActive.type !== "text" && (
                  <>
                     <MenubarMenu>
                        <MenubarTrigger className="w-full h-full">
                           <TextAlignJustifyIcon />
                        </MenubarTrigger>
                        <MenubarContent className="flex gap-2 items-center">
                           <TextAlignLeftIcon
                              onClick={() => alignText("left")}
                              width={"30px"}
                              height={"30px"}
                              className=" hover:bg-accent transition-all duration-150 p-1 rounded-sm"
                              cursor={"pointer"}
                           />
                           <TextAlignCenterIcon
                              onClick={() => alignText("center")}
                              className=" hover:bg-accent transition-all duration-150 p-1 rounded-sm"
                              width={"30px"}
                              height={"30px"}
                              cursor={"pointer"}
                           />
                           <TextAlignRightIcon
                              onClick={() => alignText("right")}
                              className=" hover:bg-accent transition-all duration-150 p-1 rounded-sm"
                              width={"30px"}
                              height={"30px"}
                              cursor={"pointer"}
                           />
                        </MenubarContent>
                     </MenubarMenu>

                     <MenubarMenu>
                        <MenubarTrigger>
                           <AlignCenterVerticallyIcon />
                        </MenubarTrigger>
                        <MenubarContent className="flex gap-2 items-center">
                           <TextAlignTopIcon
                              onClick={() => textAlignVertical("top")}
                              width={"30px"}
                              height={"30px"}
                              className=" hover:bg-accent transition-all duration-150 p-1 rounded-sm"
                              cursor={"pointer"}
                           />
                           <TextAlignMiddleIcon
                              onClick={() => textAlignVertical("center")}
                              width={"30px"}
                              height={"30px"}
                              className=" hover:bg-accent transition-all duration-150 p-1 rounded-sm"
                              cursor={"pointer"}
                           />
                           <TextAlignBottomIcon
                              onClick={() => textAlignVertical("bottom")}
                              width={"30px"}
                              height={"30px"}
                              className=" hover:bg-accent transition-all duration-150 p-1 rounded-sm"
                              cursor={"pointer"}
                           />
                        </MenubarContent>
                     </MenubarMenu>

                     <MenubarMenu>
                        <MenubarTrigger className="h-full">
                           <WidthIcon />
                        </MenubarTrigger>
                        <MenubarContent className="w-[150px] space-y-1 px-2">
                           {currentActive?.type !== "line" && (
                              <MenubarSub>
                                 <MenubarSubTrigger className="w-full h-full border">
                                    <div
                                       className="w-[40px] h-full border-[2px] border-zinc-600/50 rounded-sm"
                                       style={{
                                          background: currentActive.borderColor,
                                       }}
                                    ></div>
                                 </MenubarSubTrigger>
                                 <MenubarSubContent className="grid grid-cols-4 w-fit gap-[3px]">
                                    <ColorOptions onClick={lineColor} />
                                 </MenubarSubContent>
                              </MenubarSub>
                           )}
                           {thickness.map((thick) => (
                              <div
                                 onClick={() => {
                                    if (config.currentActive) {
                                       config.currentActive.lineWidth = thick.q;
                                       setCurrent(config.currentActive);
                                       if (shapeClassRef) shapeClassRef.draw();
                                    }
                                 }}
                                 key={thick.size}
                                 className={`grid grid-cols-[0.6fr_1fr] items-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-100 px-[5px] rounded-sm ${
                                    currentActive?.lineWidth === thick.q &&
                                    "bg-secondary"
                                 }`}
                              >
                                 <h2 className="text-[18px] font-bold">
                                    {thick.size}
                                 </h2>
                                 <div
                                    style={{ height: `${thick.q}px` }}
                                    className={`bg-zinc-200`}
                                 ></div>
                              </div>
                           ))}
                        </MenubarContent>
                     </MenubarMenu>
                  </>
               )}

               {/* {font size} */}
               <MenubarMenu>
                  <MenubarTrigger className="h-full w-full">
                     <FontSizeIcon />
                  </MenubarTrigger>
                  <MenubarContent className="w-fit">
                     <div className="flex gap-1 items-center">
                        <Button
                           onClick={() => {
                              setFontSize((f) => f - 1);
                              changeFontSizes(fontSize);
                           }}
                           variant={"ghost"}
                           size={"icon"}
                        >
                           <MinusIcon />
                        </Button>
                        <p className="sm:text-xs md:text-sm">{fontSize}</p>
                        <Button
                           onClick={() => {
                              setFontSize((f) => f + 1);
                              changeFontSizes(fontSize);
                           }}
                           variant={"ghost"}
                           size={"icon"}
                        >
                           <PlusIcon />
                        </Button>
                     </div>
                     {shapeProps.fontsizes.map((font) => (
                        <div
                           onClick={() => changeFontSizes(font.q)}
                           key={font.size}
                           className={`text-center text-xs cursor-pointer hover:bg-secondary hover:text-secondary-foreground transition-all duration-150 p-1 rounded-md ${
                              currentActive?.textSize == font.q &&
                              "bg-secondary text-secondary-foreground"
                           }`}
                        >
                           {font.size}
                        </div>
                     ))}
                  </MenubarContent>
               </MenubarMenu>

               {/* font stye */}
               <MenubarMenu>
                  <MenubarTrigger className="h-full w-full">
                     <FontFamilyIcon />
                  </MenubarTrigger>
                  <MenubarContent className="w-fit">
                     <ul className="flex flex-col items-center justify-center divide-y-2">
                        {shapeProps.fonts.map((font) => (
                           <li
                              onClick={() => changeFont(font)}
                              key={font}
                              className={`${
                                 font === currentActive?.font &&
                                 "bg-secondary text-secondary-foreground"
                              } w-full rounded-sm p-[4px] text-xs hover:bg-secondary hover:text-secondary-foreground transition-all duration-150`}
                           >
                              {font}
                           </li>
                        ))}
                     </ul>
                  </MenubarContent>
               </MenubarMenu>

               {/* font weight */}
               <MenubarMenu>
                  <MenubarTrigger className="w-full h-full">
                     <FontBoldIcon />
                  </MenubarTrigger>
                  <MenubarContent>
                     <ul className="flex flex-col items-center divide-y-2">
                        {shapeProps.fontWeight.map((weight) => (
                           <li
                              onClick={() => changeFontWeight(weight)}
                              className={`${
                                 weight === currentActive?.fontWeight &&
                                 "bg-secondary text-secondary-foreground"
                              } w-full hover:bg-secondary hover:text-secondary-foreground transition-all text-xs duration-150 rounded-sm p-[4px]`}
                              key={weight}
                           >
                              {weight}
                           </li>
                        ))}
                     </ul>
                  </MenubarContent>
               </MenubarMenu>

               {/* font varient */}
               <MenubarMenu>
                  <MenubarTrigger className="h-full w-full">
                     <FontStyleIcon />
                  </MenubarTrigger>
                  <MenubarContent>
                     <ul className="flex flex-col items-center divide-y-2">
                        {shapeProps.fontVarient.map((varient) => (
                           <li
                              className="w-full hover:bg-secondary hover:text-secondary-foreground transition-all duration-150 rounded-sm p-[4px]"
                              key={varient}
                              onClick={() => {
                                 if (config.currentActive) {
                                    config.currentActive.fontVarient = varient;
                                    setCurrent(config.currentActive);
                                    if (shapeClassRef) shapeClassRef.draw();
                                 }
                              }}
                           >
                              {varient === "normal" ? (
                                 <LetterCaseLowercaseIcon
                                    width={"20px"}
                                    height={"30px"}
                                 />
                              ) : (
                                 <LetterCaseUppercaseIcon
                                    width={"20px"}
                                    height={"30px"}
                                 />
                              )}
                           </li>
                        ))}
                     </ul>
                  </MenubarContent>
               </MenubarMenu>

               {currentActive.type === "line" && (
                  <div className="flex gap-1 p-[1px] items-center justify-center h-full w-full">
                     <MenubarMenu>
                        <MenubarTrigger className="h-full w-full">
                           <ArrowTopRightIcon />
                        </MenubarTrigger>
                        <MenubarContent>
                           {lineType.map((line) => (
                              <p
                                 onClick={() => {
                                    if (config.currentActive) {
                                       const { curvePoints } =
                                          config.currentActive;
                                       if (line === "straight") {
                                          config.currentActive.lineType =
                                             "straight";
                                          config.currentActive.curvePoints = [
                                             curvePoints[0],
                                             curvePoints[
                                                curvePoints.length - 1
                                             ],
                                          ];
                                       } else if (line === "elbow") {
                                          config.currentActive.lineType =
                                             "elbow";
                                          let first = curvePoints[0];
                                          let last =
                                             curvePoints[
                                                curvePoints.length - 1
                                             ];

                                          config.currentActive.curvePoints = [
                                             first,
                                             last,
                                          ];
                                       } else {
                                          config.currentActive.lineType = line;
                                          let first = curvePoints[0];
                                          let last =
                                             curvePoints[
                                                curvePoints.length - 1
                                             ];
                                          let mid = {
                                             x: (first.x + last.x) / 2,
                                             y: (last.y + first.y) / 2,
                                          };

                                          config.currentActive.curvePoints = [
                                             first,
                                             mid,
                                             last,
                                          ];
                                       }

                                       setCurrent(config.currentActive);
                                       if (shapeClassRef) shapeClassRef.draw();
                                    }
                                 }}
                                 key={line}
                                 className="text-center text-xs cursor-pointer hover:bg-secondary transition-all duration-150 p-1 rounded-md"
                              >
                                 {line}
                              </p>
                           ))}
                        </MenubarContent>
                     </MenubarMenu>

                     <Button
                        variant={"ghost"}
                        size={"icon"}
                        className="px-3 h-full"
                        onClick={() => {
                           if (config.currentActive) {
                              config.currentActive.arrowLeft =
                                 !config.currentActive.arrowLeft;
                              if (shapeClassRef) shapeClassRef.draw();
                              setCurrent(config.currentActive);
                           }
                        }}
                     >
                        <ArrowLeftIcon className="text-primary scale-[1.5]" />
                     </Button>

                     <Button
                        variant={"ghost"}
                        size={"icon"}
                        className="px-3 h-full"
                        onClick={() => {
                           if (config.currentActive) {
                              config.currentActive.arrowRight =
                                 !config.currentActive.arrowRight;
                              if (shapeClassRef) shapeClassRef.draw();
                              setCurrent(config.currentActive);
                           }
                        }}
                     >
                        <ArrowRightIcon className="text-primary scale-[1.5]" />
                     </Button>
                  </div>
               )}

               {currentActive.type === "rect" && (
                  <MenubarMenu>
                     <MenubarTrigger className="w-full h-full">
                        <SquareIcon className="h-full" />
                     </MenubarTrigger>
                     <MenubarContent className="flex flex-col items-center divide-y-2 gap-2">
                        <div
                           onClick={() => handleRadius(10)}
                           className="w-[25px] h-[25px] bg-secondary rounded-md"
                        ></div>
                        <div
                           onClick={() => handleRadius(0)}
                           className="w-[25px] h-[25px] bg-secondary rounded-none"
                        ></div>
                     </MenubarContent>
                  </MenubarMenu>
               )}
            </Menubar>
         </div>
      </>
   );
}
