"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MapPin, Users, Bell } from "lucide-react"
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs"

export default function Navbar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()

  // Don't show navbar on sign-in or sign-up pages
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return null
  }

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <Link href="/" className="text-xl font-bold">
            RiderConnect
          </Link>
        </div>

        <SignedIn>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant={pathname === "/dashboard" ? "default" : "ghost"}>Dashboard</Button>
            </Link>
            <Link href="/groups">
              <Button variant={pathname.startsWith("/groups") ? "default" : "ghost"}>
                <Users className="mr-2 h-4 w-4" />
                Groups
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant={pathname === "/notifications" ? "default" : "ghost"}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Button>
            </Link>
          </div>
        </SignedIn>

        <div className="flex items-center gap-2">
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "h-8 w-8",
                },
              }}
            />

            {/* Mobile menu for smaller screens */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[1.2rem] w-[1.2rem]"
                    >
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/groups">Groups</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/notifications">Notifications</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </SignedOut>
        </div>
      </div>
    </nav>
  )
}

