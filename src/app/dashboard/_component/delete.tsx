import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogHeader,
   AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { ArchiveIcon } from "@radix-ui/react-icons";

const Delete = ({ handler }: { handler: Function }) => {
   return (
      <div
         role="menuitem"
         className="hover:bg-secondary text-md px-[0.8em] py-[0.4em] rounded-sm"
      >
         <AlertDialog>
            <AlertDialogTrigger className="flex gap-2 items-center">
               <ArchiveIcon /> Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
               <AlertDialogHeader>Delete</AlertDialogHeader>
               <AlertDialogDescription>
                  Are you sure you want to delete?
               </AlertDialogDescription>
               <div className="w-full flex gap-2 justify-end">
                  <AlertDialogCancel
                     className={`${buttonVariants({
                        variant: "ghost",
                        size: "sm",
                     })}`}
                  >
                     Cancel
                  </AlertDialogCancel>

                  <AlertDialogAction
                     onClick={() => handler()}
                     className={`${buttonVariants({
                        variant: "destructive",
                        size: "sm",
                     })}`}
                  >
                     Delete
                  </AlertDialogAction>
               </div>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
};

export default Delete;
