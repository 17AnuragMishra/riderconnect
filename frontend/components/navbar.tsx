"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Users, Bell, Navigation, Menu } from "lucide-react";
import { useUser, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/ui/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Don't show navbar on sign-in or sign-up pages
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return null;
  }

  const isLanding = pathname === "/";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${scrolled
          ? "glass border-b border-border/50 shadow-sm"
          : isLanding
            ? "bg-transparent"
            : "bg-background/90 backdrop-blur-sm border-b border-border/50"
        }`}
    >
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center group-hover:bg-teal/20 transition-colors duration-300">
            <Navigation size={16} className="text-teal" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            RIDER<span className="text-teal">CONNECT</span>
          </span>
        </Link>

        {/* Desktop signed-in navigation */}
        <SignedIn>
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" },
              { label: "Groups", href: "/groups", icon: Users, active: pathname.startsWith("/groups") },
              { label: "Notifications", href: "/notifications", icon: Bell, active: pathname === "/notifications" },
            ].map(({ label, href, icon: Icon, active }) => (
              <Link key={href} href={href}>
                <Button
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  className={`transition-all duration-200 text-sm font-medium ${active
                      ? "bg-teal text-teal-foreground hover:bg-teal/90"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </SignedIn>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SignedIn>
            <div className="flex items-center gap-2">
              <div className="transition-transform hover:scale-110">
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-8 w-8 border-2 border-teal/20 shadow-sm",
                      userButtonTrigger: "hover:shadow-md transition-all duration-300",
                    },
                  }}
                />
              </div>
              <ThemeToggle />
            </div>

            {/* Mobile menu */}
            <div className="md:hidden ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-border/50 hover:border-teal/40 hover:text-teal h-9 w-9"
                  >
                    <Menu size={18} />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="glass border-border/50 shadow-lg rounded-xl p-2 min-w-[200px] animate-in zoom-in-90 duration-200"
                >
                  {[
                    { label: "Dashboard", href: "/dashboard", active: pathname === "/dashboard" },
                    { label: "Groups", href: "/groups", icon: Users, active: pathname.startsWith("/groups") },
                    { label: "Notifications", href: "/notifications", icon: Bell, active: pathname === "/notifications" },
                  ].map(({ label, href, icon: Icon, active }) => (
                    <DropdownMenuItem
                      key={href}
                      asChild
                      className={`my-1 rounded-lg transition-colors ${active ? "bg-teal/10 text-teal font-medium" : "hover:bg-teal/5 hover:text-teal"
                        }`}
                    >
                      <Link href={href} className="flex items-center py-2.5 px-2 text-sm">
                        {Icon && <Icon className="mr-2 h-4 w-4" />}
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />

              {/* Desktop auth */}
              <div className="hidden md:flex items-center gap-2">
                {isLanding && (
                  <div className="hidden md:flex items-center gap-5 mr-4">
                    {["Features", "How It Works", "FAQ"].map(item => (
                      <a
                        key={item}
                        href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                        className="text-sm text-muted-foreground hover:text-teal transition-colors duration-200"
                      >
                        {item}
                      </a>
                    ))}
                  </div>
                )}
                <Link href="/sign-in">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border/50 hover:border-teal/40 hover:text-teal font-medium text-sm"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="sm"
                    className="bg-teal text-teal-foreground hover:bg-teal/90 font-medium shadow-glow-teal text-sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>

              {/* Mobile auth menu */}
              <div className="md:hidden ml-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-border/50 hover:border-teal/40 hover:text-teal h-9 w-9"
                    >
                      <Menu size={18} />
                      <span className="sr-only">Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="glass border-border/50 shadow-lg rounded-xl p-2 min-w-[200px] animate-in zoom-in-90 duration-200"
                  >
                    {isLanding && ["Features", "How It Works", "FAQ"].map(item => (
                      <DropdownMenuItem key={item} asChild className="my-1 rounded-lg hover:bg-teal/5 hover:text-teal">
                        <a href={`#${item.toLowerCase().replace(/\s+/g, "-")}`} className="py-2.5 px-2 text-sm">
                          {item}
                        </a>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem asChild className="my-1 rounded-lg hover:bg-teal/5 hover:text-teal">
                      <Link href="/sign-in" className="py-2.5 px-2 text-sm">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="my-1 rounded-lg hover:bg-teal/5 hover:text-teal">
                      <Link href="/sign-up" className="py-2.5 px-2 text-sm font-medium">Sign Up</Link>
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
