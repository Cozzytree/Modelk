import { Kalam } from "next/font/google";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import clsx from "clsx";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTrigger,
} from "@/components/ui/dialog";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogHeader,
   AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const kalam = Kalam({ subsets: ["latin"], weight: "400" });

const Sidebar = () => {
   return (
      <div className="grid grid-rows-2 w-[250px] h-[100dvh] py-5 px-5 border-r">
         <Dialog>
            <DropdownMenu>
               <DropdownMenuTrigger
                  className={`font-extrabold ${kalam.className} w-full hover:bg-secondary text-start px-2 rounded-sm py-[2px] h-fit`}
               >
                  Modlk
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  className={clsx(`flex flex-col items-center px-1 w-full`)}
               >
                  <DropdownMenuLabel
                     className={` bg-primary p-1 text-sm text-primary-foreground font-normal rounded-xs w-full rounded-sm`}
                  >
                     Username
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Dialog>
                     <DialogTrigger className="text-sm w-full text-start p-1 hover:bg-primary-foreground">
                        Settings
                     </DialogTrigger>
                     <DialogContent>
                        <DialogHeader>Settings</DialogHeader>
                        <div className="w-full grid grid-cols-[0.3fr_1fr] gap-3">
                           <nav className="flex flex-col items-start gap-1 w-full">
                              <p className=" capitalize font-bold text-md py-2">
                                 PERSONAL
                              </p>
                              <button className="text-md px-1 py-[2px] hover:bg-secondary w-full text-start rounded-sm">
                                 Account
                              </button>
                              <button className="text-md px-1 py-[2px] hover:bg-secondary w-full text-start rounded-sm">
                                 Apperance
                              </button>
                           </nav>

                           <div>Username</div>
                        </div>
                     </DialogContent>
                  </Dialog>
                  <AlertDialog>
                     <AlertDialogTrigger className="text-sm w-full text-start p-1 hover:bg-primary-foreground">
                        Logout
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>Logout !</AlertDialogHeader>
                        <div className="w-full flex gap-2 items-center justify-end">
                           <AlertDialogCancel
                              className={`${buttonVariants({
                                 variant: "ghost",
                                 size: "sm",
                              })}`}
                           >
                              Cancel
                           </AlertDialogCancel>
                           <AlertDialogAction
                              className={`${buttonVariants({
                                 variant: "destructive",
                                 size: "sm",
                              })}`}
                           >
                              Logout
                           </AlertDialogAction>
                        </div>
                     </AlertDialogContent>
                  </AlertDialog>
               </DropdownMenuContent>
            </DropdownMenu>
         </Dialog>

         <div className="w-full flex flex-col justify-end">
            <Button size="sm" className="h-fit w-full py-1 text-start">
               New file
            </Button>
         </div>
      </div>
   );
};

export default Sidebar;
