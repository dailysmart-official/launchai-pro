export { auth as middleware } from "@/lib/auth"
export const config = {
  matcher: ["/dashboard/:path*", "/writer/:path*", "/billing/:path*", "/teams/:path*", "/settings/:path*"],
}