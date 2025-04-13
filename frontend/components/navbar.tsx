"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Users, Bell } from "lucide-react";
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // Don't show navbar on sign-in or sign-up pages
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return null;
  }

  return (
    <nav className="border-b bg-gradient-to-r from-primary/10 via-background to-primary/10 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="bg-primary/10 p-2 rounded-full shadow-sm">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 hover:from-primary/80 hover:to-primary transition-colors duration-300">
            RiderConnect
          </Link>
        </div>

        <SignedIn>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard">
              <Button 
                variant={pathname === "/dashboard" ? "default" : "ghost"} 
                className={`transition-all duration-300 hover:scale-105 hover:shadow-md ${
                  pathname === "/dashboard" 
                    ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90" 
                    : "hover:bg-primary/20 hover:text-primary font-medium"
                }`}
              >
                Dashboard
              </Button>
            </Link>
            <Link href="/groups">
              <Button 
                variant={pathname.startsWith("/groups") ? "default" : "ghost"}
                className={`transition-all duration-300 hover:scale-105 hover:shadow-md ${
                  pathname.startsWith("/groups") 
                    ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90" 
                    : "hover:bg-primary/20 hover:text-primary font-medium"
                }`}
              >
                <Users className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                Groups
              </Button>
            </Link>
            <Link href="/notifications">
              <Button 
                variant={pathname === "/notifications" ? "default" : "ghost"}
                className={`transition-all duration-300 hover:scale-105 hover:shadow-md ${
                  pathname === "/notifications" 
                    ? "bg-primary text-primary-foreground font-medium hover:bg-primary/90" 
                    : "hover:bg-primary/20 hover:text-primary font-medium"
                }`}
              >
                <Bell className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                Notifications
              </Button>
            </Link>
          </div>
        </SignedIn>

        <div className="flex items-center gap-2 sm:gap-3">
          <SignedIn>
            <div className="flex items-center gap-2">
              <div className="transition-transform hover:scale-110">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-8 w-8 border-2 border-primary/30 shadow-sm",
                      userButtonTrigger: "hover:shadow-md transition-all duration-300",
                    },
                  }}
                />
              </div>
              
              {/* ThemeToggle - visible on all screen sizes */}
              <div className="flex">
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile menu for smaller screens */}
            <div className="md:hidden ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="transition-all duration-300 hover:scale-110 hover:shadow-md hover:bg-primary/20 hover:text-primary border-primary/20"
                  >
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
                      className="h-[1.2rem] w-[1.2rem] text-primary"
                    >
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-gradient-to-b from-background to-background/95 backdrop-blur-sm border-primary/20 shadow-lg rounded-xl p-2 min-w-[200px] animate-in zoom-in-90 duration-200"
                >
                  <DropdownMenuItem 
                    asChild 
                    className={`my-1.5 rounded-lg transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary ${pathname === "/dashboard" ? "bg-primary/30 text-primary font-medium" : ""}`}
                  >
                    <Link href="/dashboard" className="flex items-center py-2.5 px-2 text-base">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    asChild 
                    className={`my-1.5 rounded-lg transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary ${pathname.startsWith("/groups") ? "bg-primary/30 text-primary font-medium" : ""}`}
                  >
                    <Link href="/groups" className="flex items-center py-2.5 px-2 text-base">
                      <Users className="mr-2 h-5 w-5" />
                      Groups
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    asChild 
                    className={`my-1.5 rounded-lg transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary ${pathname === "/notifications" ? "bg-primary/30 text-primary font-medium" : ""}`}
                  >
                    <Link href="/notifications" className="flex items-center py-2.5 px-2 text-base">
                      <Bell className="mr-2 h-5 w-5" />
                      Notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme toggle - always visible */}
              <div className="flex items-center">
                <ThemeToggle />
              </div>
              
              {/* Auth buttons - visible on medium screens and up */}
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
                <Link href="/sign-in">
                  <Button 
                    variant="outline" 
                    className="transition-all duration-300 hover:scale-105 hover:shadow-md border-primary/30 hover:border-primary hover:bg-primary/10 hover:text-primary font-medium"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button 
                    className="transition-all duration-300 hover:scale-105 hover:shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary font-medium text-primary-foreground"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
              
              {/* Mobile menu for smaller screens */}
              <div className="md:hidden ml-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="transition-all duration-300 hover:scale-110 hover:shadow-md hover:bg-primary/20 hover:text-primary border-primary/20"
                    >
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
                        className="h-[1.2rem] w-[1.2rem] text-primary"
                      >
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                      <span className="sr-only">Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="bg-gradient-to-b from-background to-background/95 backdrop-blur-sm border-primary/20 shadow-lg rounded-xl p-2 min-w-[200px] animate-in zoom-in-90 duration-200"
                  >
                    <DropdownMenuItem asChild className="my-1.5 rounded-lg transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary">
                      <Link href="/sign-in" className="flex items-center py-2.5 px-2 text-base">
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="my-1.5 rounded-lg transition-colors hover:bg-primary/20 hover:text-primary focus:bg-primary/20 focus:text-primary">
                      <Link href="/sign-up" className="flex items-center py-2.5 px-2 text-base font-medium">
                        Sign Up
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
