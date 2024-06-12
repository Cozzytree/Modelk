"use client";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z
    .string()
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/,
      "Invalid email format"
    ),
  password: z.string().min(6, "Minimum 6 characters"),
});

export default function Page() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: {
    username: String;
    password: String;
    email: String;
  }) => {
    console.log(data);
  };

  return (
    <div className="background w-full h-[100dvh] flex justify-center items-center">
      <div className="space-y-2">
        <h1 className="text-center">SIGN-UP</h1>
        <Form {...form}>
          <form className="space-y-2" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="text" placeholder="Username" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="Email" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className="w-full font-bold cursor-pointer"
              size="sm"
              type="submit"
            >
              SIGN-UP
            </Button>
            <p className="text-sm text-zinc-400">
              Already have an account ?{" "}
              <Link
                href={"/login"}
                className={`${buttonVariants({
                  variant: "link",
                  size: "sm",
                })} cursor-pointer`}
              >
                Login
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
