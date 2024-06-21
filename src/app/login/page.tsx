"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { useLogin } from "@/requests/authRequests";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm, SubmitHandler } from "react-hook-form";
import { ReloadIcon } from "@radix-ui/react-icons";
import Link from "next/link";

interface FormData {
   username: string;
   password: string;
}
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/;

export default function Page() {
   const form = useForm<FormData>();
   const { userLogin, isPending, userData } = useLogin();

   const onSubmit: SubmitHandler<FormData> = (data) => {
      if (emailRegex.test(data.username)) {
         userLogin({ email: data.username, password: data.password });
      } else {
         userLogin({ username: data.username, password: data.password });
      }
   };

   return (
      <div className="background w-full h-[100dvh] flex flex-col items-center justify-center">
         <div className="space-y-2 w-fit">
            <h1 className=" text-center">LOGIN</h1>
            <Form {...form}>
               <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-2"
               >
                  <FormField
                     control={form.control}
                     name="username"
                     render={() => (
                        <FormItem>
                           <Input
                              type="text"
                              placeholder="Username or Email"
                              id="email"
                              {...form.register("username", {
                                 required: true,
                                 minLength: 6,
                                 maxLength: 26,
                              })}
                           />
                        </FormItem>
                     )}
                  />
                  <FormField
                     control={form.control}
                     name="password"
                     render={() => (
                        <FormItem>
                           <Input
                              type="password"
                              placeholder="password"
                              id="password"
                              className=""
                              {...form.register("password", {
                                 required: true,
                                 minLength: 6,
                              })}
                           />
                        </FormItem>
                     )}
                  />
                  <Button
                     disabled={isPending}
                     type="submit"
                     size="sm"
                     className={`w-full`}
                  >
                     {isPending ? (
                        <ReloadIcon className="animate-spin" />
                     ) : (
                        "Login"
                     )}
                  </Button>
                  <p className="text-sm text-zinc-400">
                     Don&apos;t have an acoount ?
                     <Link
                        href={"/sign_up"}
                        className={`${buttonVariants({
                           variant: "link",
                           size: "sm",
                        })} cursor-pointer`}
                     >
                        Sign Up
                     </Link>
                  </p>
               </form>
            </Form>
         </div>
      </div>
   );
}
