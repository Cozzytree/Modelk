import { Roboto } from "next/font/google";
import { buttonVariants } from "@/components/ui/button";
import {
  RegisterLink,
  LoginLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { ArrowRightIcon, Pencil2Icon } from "@radix-ui/react-icons";

const roboto = Roboto({ subsets: ["latin"], weight: "900" });

export default function Page() {
  return (
    <div className="min-h-screen w-full relative">
      <div className="w-full flex flex-col justify-center items-center">
        <div className="w-full flex justify-between px-7 py-4 backdrop-blur-sm">
          <h3 className="flex gap-1 items-center cursor-pointer font-bold">
            <Pencil2Icon /> Modelk
          </h3>
          <ul className="flex gap-2">
            <li>
              <LoginLink
                className={`${buttonVariants({
                  variant: "ghost",
                  size: "sm",
                })} font-bold text-xs`}
              >
                Sign in
              </LoginLink>
            </li>
            <li>
              <RegisterLink
                className={`${buttonVariants({
                  variant: "secondary",
                  size: "sm",
                })} text-xs font-bold rounded-tr-[30%]`}
              >
                Sign up <ArrowRightIcon />
              </RegisterLink>
            </li>
          </ul>
        </div>
        <div className="flex justify-center mt-20">
          <h1 className="text-center text-xl md:text-5xl tracking-wide font-bold">
            Make your&nbsp; <br />
            <span className="bg-gradient-to-tr from-orange-500 to-red-800 bg-clip-text text-transparent font-[900]">
              Diagram and Docs
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}
