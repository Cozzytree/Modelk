"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";

interface FormData {
  email: string;
  password: string;
}

export default function Page() {
  const form = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log(data);
  };

  return (
    <div className="background w-full h-[100dvh] flex flex-col items-center justify-center">
      <div className="space-y-2 w-fit">
        <h1 className=" text-center">LOGIN</h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="email"
              render={() => (
                <FormItem>
                  <Input
                    type="text"
                    placeholder="Username or Email"
                    id="email"
                    {...form.register("email", {
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
            <Button type="submit" size="sm" className="w-full">
              Login
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
