"use client";

import { Button } from "@/components/ui/button.tsx";
import Canvas from "../_component/canvas.jsx";
import Doc from "../_component/Doc.jsx";
import { useEffect, useState } from "react";
import { useGetProjectAssets } from "@/requests/project.ts";
import { ReloadIcon } from "@radix-ui/react-icons";

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
            <h1 className="text-lg font-semibold">Project_Name</h1>
            <div className="">
               {boardView.map((view) => (
                  <Button
                     onClick={() => setWorksapceMode(view.name)}
                     key={view.name}
                     className={`${
                        view.name === workspaceMode
                           ? "bg-secondary"
                           : "bg-black"
                     } text-md h-3 py-3`}
                     variant="ghost"
                     size="sm"
                  >
                     {view.name}
                  </Button>
               ))}
            </div>
            <div>Settings</div>
         </div>
         <div
            className={`h-screen w-screen grid ${
               workspaceMode === "Both"
                  ? "grid-cols-[0.5fr_1fr]"
                  : "grid-cols-1"
            } overflow-hidden divide-x-2`}
         >
            {/* document */}
            <div
               className={`${
                  workspaceMode === "Canvas" ? "hidden" : "block"
               } flex justify-center w-full  mt-12`}
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
               {/* <Canvas shapes={projectData?.data[0]?.projectShapes} /> */}
               <Canvas />
            </div>
         </div>
      </div>
   );
}
