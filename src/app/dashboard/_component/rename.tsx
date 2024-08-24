import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Rename = ({
   handler,
   isLoading,
   defaultV,
}: {
   handler: Function;
   isLoading: boolean;
   defaultV: string;
}) => {
   const [name, setName] = useState("");
   return (
      <div
         role="menuitem"
         className="hover:bg-secondary text-md px-[0.8em] py-[0.4em] rounded-sm"
      >
         <AlertDialog>
            <AlertDialogTrigger>
               <Pencil1Icon /> Rename{" "}
            </AlertDialogTrigger>
            <AlertDialogContent>
               <AlertDialogTitle>Rename</AlertDialogTitle>
               <Input
                  placeholder="New Name"
                  defaultValue={defaultV}
                  onChange={(e) => setName(e.target.value)}
                  min={6}
                  max={26}
               />
               <Button variant={"secondary"} size="sm">
                  Save
               </Button>
               <div className="w-full flex gap-2 justify-end">
                  <AlertDialogCancel>cancel</AlertDialogCancel>
                  <AlertDialogAction
                     disabled={isLoading}
                     className={`${buttonVariants({
                        variant: "ghost",
                        size: "sm",
                     })}`}
                     onClick={() => handler(name)}
                  >
                     Save
                  </AlertDialogAction>
               </div>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
};

export default Rename;
