import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Share1Icon } from "@radix-ui/react-icons";

const Share = () => {
   return (
      <div
         role="menuitem"
         className="hover:bg-secondary text-md px-[0.8em] py-[0.4em] rounded-sm"
      >
         <Dialog>
            <DialogTrigger className="flex gap-2 items-center ">
               <Share1Icon /> Share
            </DialogTrigger>
            <DialogContent>
               <DialogHeader>Share</DialogHeader>
               <DialogDescription>
                Settings
               </DialogDescription>
            </DialogContent>
         </Dialog>
      </div>
   );
};

export default Share;
