import { colors } from "@/lib/utils";
import { useState } from "react";

export default function ColorOptions({ onClick }) {
   const [customColor, setCustomColor] = useState("");

   return (
      <>
         {colors.map((color) => (
            <div
               onClick={() => onClick(color)}
               key={color}
               style={{ background: color }}
               className="w-[30px] h-[30px] rounded-sm border border-zinc-300 shadow-sm shadow-zinc-700 cursor-pointer"
            ></div>
         ))}
         <div
            onClick={() => {
               onClick("#00000000");
            }}
            className="w-[30px] h-[30px] rounded-sm border border-zinc-300 shadow-sm shadow-zinc-700 cursor-pointer relative"
         >
            <div className="absolute top-[50%] left-0 w-full h-[2px] border border-zinc-200 rotate-[50deg]"></div>
         </div>

         <div className="w-[30px] h-[30px] rounded-sm border border-zinc-300 shadow-sm shadow-zinc-700 cursor-pointer relative gradient-background">
            <label
               htmlFor="customColor"
               className="w-full h-full block"
            ></label>
            <input
               type="color"
               id="customColor"
               className="hidden"
               onChange={(e) => {
                  onClick(e.target.value);
               }}
            />
         </div>
      </>
   );
}
