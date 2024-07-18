import { PlusIcon, StarIcon, TriangleUpIcon } from "@radix-ui/react-icons";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@/components/ui/tooltip";
import { config } from "@/lib/utils.ts";

const shapes = [
   {
      s: (
         <svg
            fill="white"
            height="20px"
            width="20px"
            version="1.1"
            id="Capa_1"
            viewBox="-40.65 -40.65 266.05 266.05"
            stroke="white"
            transform="matrix(1, 0, 0, 1, 0, 0)"
            strokeWidth="2"
         >
            <g>
               <path d="M0,92.375l46.188-80h92.378l46.185,80l-46.185,80H46.188L0,92.375z" />
            </g>
         </svg>
      ),
      label: "hexagon",
   },
   {
      s: <StarIcon width={"20px"} height={"20px"} />,
      label: "star",
   },
   {
      s: (
         <svg
            width="20px"
            height="20px"
            viewBox="0 0 21 21"
            version="1.1"
            fill="transparent"
            stroke="white"
            strokeWidth="2"
         >
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g
               id="SVGRepo_tracerCarrier"
               strokeLinecap="round"
               strokeLinejoin="round"
            ></g>
            <g id="SVGRepo_iconCarrier">
               <path
                  d="M10.5,3 L5,9 L10.5,15 L16,9 L10.5,3 Z"
                  id="diamond_round"
               ></path>
            </g>
         </svg>
      ),
      label: "diamond",
   },
   {
      s: (
         <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
         >
            <g id="SVGRepo_iconCarrier">
               <g id="System / Cylinder">
                  <path
                     id="Vector"
                     d="M18 7V17C18 18.6569 15.3137 20 12 20C8.68629 20 6 18.6569 6 17V7M18 7C18 5.34315 15.3137 4 12 4C8.68629 4 6 5.34315 6 7M18 7C18 8.65685 15.3137 10 12 10C8.68629 10 6 8.65685 6 7"
                  ></path>
               </g>
            </g>
         </svg>
      ),
      label: "cylinder",
   },
   {
      s: <TriangleUpIcon />,
      label: "triangle",
   },
];

export default function Polygon({ setMode }) {
   return (
      <DropdownMenu>
         <DropdownMenuTrigger className="p-2 border border-zinc-600 rounded-sm focus:bg-none">
            <PlusIcon />
         </DropdownMenuTrigger>
         <DropdownMenuContent
            side="right"
            sideOffset={20}
            className="grid grid-cols-4 w-fit"
         >
            {shapes.map((shape, index) => (
               <DropdownMenuItem
                  key={index}
                  onClick={() => {
                     config.mode = shape.label;
                     setMode(config.mode);
                  }}
               >
                  <Tooltip>
                     <TooltipTrigger>{shape.s}</TooltipTrigger>
                     <TooltipContent>{shape.label}</TooltipContent>
                  </Tooltip>
               </DropdownMenuItem>
            ))}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
