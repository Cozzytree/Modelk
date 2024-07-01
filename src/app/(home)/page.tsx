import { Roboto } from "next/font/google";
import { buttonVariants } from "@/components/ui/button";
import {
  RegisterLink,
  LoginLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { ArrowRightIcon } from "@radix-ui/react-icons";

const roboto = Roboto({ subsets: ["latin"], weight: "900" });

export default function Page() {
  return (
    <div className="h-screen w-full flex justify-center items-center relative">
      <div className="absolute w-72 h-72 bg-radial-gradient"></div>
      <div className="grid grid-rows-[0.5fr_1fr] h-full w-full z-[10]">
        <div className="w-full flex justify-between px-7 py-4">
          <h3>Logo</h3>
          <div className="flex gap-2">
            <LoginLink
              className={`${buttonVariants({
                variant: "ghost",
                size: "sm",
              })} text-xs`}
            >
              Sign in
            </LoginLink>
            <RegisterLink
              className={`${buttonVariants({
                variant: "default",
                size: "sm",
              })} text-primary border border-primary flex items-center gap-1 text-xs`}
            >
              Sign up <ArrowRightIcon />
            </RegisterLink>
          </div>
        </div>
        <div className="flex justify-center">
          <h1
            className={`${roboto.className} text-3xl sm:text-7xl font-bold text-shadow text-center bg-gradient-to-r from-emerald-100 to-green-900 bg-clip-text text-transparent`}
          >
            Make your Diagram <br /> and <br /> Docs.
          </h1>
        </div>
      </div>
    </div>
  );
}
