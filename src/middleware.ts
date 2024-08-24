import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
   const { isAuthenticated } = getKindeServerSession();
   const authenticated = await isAuthenticated();

   if (!authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
   }

   return NextResponse.next(); // Proceed to the requested page if authenticated
}

// See "Matching Paths" below to learn more
export const config = {
   matcher: ["/dashboard"],
   //   matcher: ["/dashboard", "/teams/create", "/workspace/:path*"],
};
