import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const session = await getKindeServerSession();
  const { isAuthenticated } = session;

  if (!(await isAuthenticated())) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next(); // Proceed to the requested page if authenticated
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/dashboard", "/teams/create"],
  //   matcher: ["/dashboard", "/teams/create", "/workspace/:path*"],
};

// email
// :
// "hootowldhrubo@gmail.com"
// family_name
// :
// "Hootowl"
// given_name
// :
// "Dhrubo"
// id
// :
// "kp_909cf2a9959f489a8aa3912249c7bf2c"
// picture
// :
// "https://lh3.googleusercontent.com/a/ACg8ocIVx8h_sW
