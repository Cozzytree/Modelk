"use client";

import { Button } from "@/components/ui/button.tsx";
import { GearIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import Doc from "../_component/Doc.jsx";
import Canvas from "../_component/canvas.jsx";

const boardView = [{ name: "Document" }, { name: "Both" }, { name: "Canvas" }];

export default function Workspace() {
   const [workspaceMode, setWorksapceMode] = useState("Both");
   //   const { projectData, isLoading, error } = useGetProjectAssets();

   return (
      // <div className="w-screen h-screen overflow-hidden">
      //   {isLoading ? (
      //     <div className="w-full flex justify-center items-center">
      //       <ReloadIcon className=" animate-spin" />
      //     </div>
      //   ) : (
      //     <>
      //       {/* {top bar} */}
      //       <div className="fixed top-0 left-0 w-screen flex justify-between items-center border-b py-1 bg-background border-b-zinc-800 z-[999] px-4">
      //         <h1 className="text-lg font-semibold">Project_Name</h1>
      //         <div className="">
      //           {boardView.map((view) => (
      //             <Button
      //               onClick={() => setWorksapceMode(view.name)}
      //               key={view.name}
      //               className={`${
      //                 view.name === workspaceMode ? "bg-secondary" : "bg-black"
      //               } text-md h-3 py-3`}
      //               variant="ghost"
      //               size="sm"
      //             >
      //               {view.name}
      //             </Button>
      //           ))}
      //         </div>
      //         <div>Settings</div>
      //       </div>
      //       <div
      //         className={`h-screen w-screen grid ${
      //           workspaceMode === "Both" ? "grid-cols-[0.5fr_1fr]" : "grid-cols-1"
      //         } overflow-hidden divide-x-2`}
      //       >
      //         {/* document */}
      //         <div
      //           className={`${
      //             workspaceMode === "Canvas" ? "hidden" : "block"
      //           } flex justify-center w-full  mt-12`}
      //         >
      //           <Doc />
      //         </div>

      //         {/* canvas */}
      //         <div
      //           className={`relative w-full ${
      //             workspaceMode === "Document" ? "hidden" : "block"
      //           } h-screen`}
      //         >
      //           <Canvas shapes={projectData?.data[0]?.projectShapes} />
      //         </div>
      //       </div>
      //     </>
      //   )}
      // </div>

      <div className="w-screen h-screen overflow-hidden">
         <div className="fixed top-0 left-0 w-screen flex justify-between items-center border-b py-1 bg-background border-b-zinc-800 z-[999] px-4">
            <h1 className="text-sm font-semibold">Project_Name</h1>
            <div className="h-fir p-[2px] gap-[2px] flex items-center justify-center divide-x-2 border border-zinc-800 rounded-sm bg-background">
               {boardView.map((view) => (
                  <Button
                     onClick={() => setWorksapceMode(view.name)}
                     key={view.name}
                     className={`${
                        view.name === workspaceMode &&
                        "bg-secondary/80 text-secondary-foreground"
                     } text-sm h-3 py-3`}
                     variant="ghost"
                     size="sm"
                  >
                     {view.name}
                  </Button>
               ))}
            </div>
            <div>
               <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs flex items-center gap-1"
               >
                  <GearIcon />
                  Settings
               </Button>
            </div>
         </div>

         <div
            className={`h-screen w-screen grid ${
               workspaceMode === "Both"
                  ? "grid-cols-[0.6fr_1fr]"
                  : "grid-cols-1"
            } overflow-hidden divide-x`}
         >
            {/* document */}
            <div
               className={`${
                  workspaceMode === "Canvas" ? "hidden" : "block"
               } flex justify-center w-full mt-12`}
            >
               <Doc />
            </div>

            {/* canvas */}
            <div
               id="canvas-div"
               className={`relative w-full ${
                  workspaceMode === "Document" ? "hidden" : "block"
               } h-screen`}
            >
               <main className="w-full h-full">
                  {/* <Canvas shapes={projectData?.data[0]?.projectShapes} /> */}
                  <Canvas />
               </main>
            </div>
         </div>
      </div>
   );
}
