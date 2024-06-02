"use client";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Link1Icon } from "@radix-ui/react-icons";

const Copy = () => {
   const { toast } = useToast();

   return (
      <DropdownMenuItem
         className="flex gap-2"
         onClick={async () => {
            const link = "hello i am here";
            try {
               await navigator.clipboard.writeText(link);
               return toast({
                  title: "Copied to clipboard",
               });
            } catch (error: any) {
               alert(error.message);
            }
         }}
      >
         <Link1Icon /> Copy link
      </DropdownMenuItem>
   );
};
export default Copy;
