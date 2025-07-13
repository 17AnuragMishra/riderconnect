// import { authMiddleware } from "@clerk/nextjs"
import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api(.*)", "/join/(.*)"],
  // Ignore static files and API routes
  ignoredRoutes: [
    "/((?!api|trpc))(_next.*|.+\.[\\w]+$)",
    "/api/(.*)",
    "/_next/(.*)",
    "/favicon.ico",
    "/manifest.json",
    "/robots.txt",
    "/sitemap.xml"
  ],
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}

