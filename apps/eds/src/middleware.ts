import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn:
        process.env.NODE_ENV === "production"
          ? "https://manager.eggisatria.dev/login"
          : "/login",
    },
  },
);

export const config = {
  matcher: [
    // Protect all routes except:
    // - /api/auth (NextAuth routes)
    // - /api/drive (public API with API key auth)
    // - /_next (Next.js internals)
    // - /favicon.ico, /robots.txt, etc.
    "/((?!api/auth|api/drive|_next|favicon.ico|robots.txt).*)",
  ],
};
