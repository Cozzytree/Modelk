import Head from "next/head";
import { ShapeParams } from "./canvasTypes";
import { ChangeEvent } from "react";
import { scrollBar } from "@/lib/utils";

const html = `<div class="w-fit absolute px-[3px] min-w-[10ch] text-[14px] outline-none z-[999] h-fit shadow-sm bg-transparent" id="input" contenteditable="true"></div>`;

const updateCanvasText = ({
   shapes,
   mouseX,
   mouseY,
}: {
   shapes: ShapeParams[];
   mouseY: number;
   mouseX: number;
}) => {
   let smallestShape: number | null = null;

   shapes.forEach((shape, i) => {
      if (!shape || shape.type === "pencil" || shape.type === "image") return;
      let x: number, y: number, width: number, height: number;

      switch (shape.type) {
         case "sphere":
            x = shape.x - (shape.xRadius as number);
            y = shape.y - (shape.yRadius as number);
            width = shape.width;
            height = shape.height;
            break;
         default:
            x = shape.x;
            y = shape.y;
            width = shape.width;
            height = shape.height;
            break;
      }

      if (
         mouseX > x &&
         mouseX < x + width &&
         mouseY > y &&
         mouseY < y + height
      ) {
         if (smallestShape == null || shapes[smallestShape]?.width > width) {
            smallestShape = i;
         }
      }
   });

   /* update */
   if (smallestShape != null) {
      const theShape = shapes[smallestShape];

      let content = "";
      if (theShape.type === "text" && theShape.content) {
         theShape.content.forEach((c) => {
            content += c + "\n";
         });
      } else if (theShape.text) {
         theShape.text.forEach((c) => {
            content += c + "\n";
         });
      }

      insertElement(theShape.x, theShape.y, content, theShape);
      return true;
   }
   return false;
};

const insertElement = (
   x: number,
   y: number,
   content: string,
   theShape: ShapeParams,
) => {
   const canvasDiv = document.getElementById("canvas-div");
   if (!canvasDiv) return;
   canvasDiv.insertAdjacentHTML("afterbegin", html);
   const input = document.getElementById("input");
   if (!input) return;
   input.style.left = x - scrollBar.scrollPositionX + "px";
   input.style.top = y - scrollBar.scrollPositionY + "px";
   input.style.fontSize = "18px";

   input.innerText = content;
   // Move the caret to the end of the content
   const range = document.createRange();
   const selection = window.getSelection();

   if (selection) {
      range.selectNodeContents(input); // Select the entire content
      range.collapse(false); // Collapse the range to the end (false means end of the node)
      selection.removeAllRanges(); // Clear any existing selections
      selection.addRange(range); // Add the new range (caret at the end)
   }

   input.focus();
   let isRemoved = false;

   const blurEvent = () => {
      if (isRemoved) return;
      const content = input.innerText.split("\n");
      if (theShape.type === "text") {
         theShape.content = content;
      } else {
         theShape.text = content;
      }

      isRemoved = true;
      input.remove();
   };

   input.addEventListener("blur", blurEvent);
   document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
         blurEvent();
      }
   });
};

export { updateCanvasText };
