"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useIsMobile } from "@/components/ui/use-mobile";
import MobileFeatureCards from "@/components/landing/mobile/MobileFeatureCards";
import MobileHowItWorks from "@/components/landing/mobile/MobileHowItWorks";
import DesktopFeatureCards from "@/components/landing/desktop/DesktopFeatureCards";
import DesktopHowItWorks from "@/components/landing/desktop/DesktopHowItWorks";

// Simple loading spinner component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-16 w-full">
    <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
  </div>
);

function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </main>
  );
}

// Client component wrapper to handle mobile detection
function FeaturesSection() {
  const isMobile = useIsMobile();

  return (
    <section
      id="features"
      className="w-full py-12 md:py-16 px-4 md:px-8 bg-card"
    >
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8">
          Key Features
        </h2>
        <p className="text-center text-muted-foreground mb-8 md:mb-12 max-w-2xl mx-auto">
          Everything you need to stay connected with your group on the go
        </p>

        <div className="w-full max-w-7xl mx-auto">
          <Suspense fallback={<LoadingSpinner />}>
            {isMobile ? <MobileFeatureCards /> : <DesktopFeatureCards />}
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  "use client";
  const isMobile = useIsMobile();

  return (
    <section id="how-it-works" className="w-full py-16 px-4 md:px-8">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
          How It Works
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Get started with RiderConnect in just a few simple steps
        </p>
        <div className="w-full max-w-6xl mx-auto">
          <Suspense fallback={<LoadingSpinner />}>
            {isMobile ? <MobileHowItWorks /> : <DesktopHowItWorks />}
          </Suspense>
        </div>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className="w-full pt-24 pb-16 px-4 md:px-8 bg-gradient-to-r from-primary/10 to-accent/10 bg-grid-pattern">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            Stay Connected with Your Group
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Track, chat, and coordinate with your friends and family in
            real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="button-gradient text-primary-foreground min-touch-target font-medium rounded-md py-3 px-6 text-center shadow-md hover:shadow-lg transition-all"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="bg-card min-touch-target text-card-foreground font-medium rounded-md py-3 px-6 text-center border border-input hover:bg-primary/5 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
        <div className="animate-float">
          <div className="relative w-[300px] h-[400px] md:w-[400px] md:h-[500px] shadow-glow rounded-2xl overflow-hidden">
            <Image
              src="/images/hero-app-preview.png"
              alt="RiderConnect App Preview"
              fill
              sizes="(max-width: 768px) 300px, 400px"
              priority
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="w-full py-16 px-4 md:px-8 bg-primary text-primary-foreground">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Connect with Your Group?
        </h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
          Join thousands of users already simplifying their group coordination
        </p>
        <Link
          href="/signup"
          className="bg-primary-foreground min-touch-target text-primary font-medium rounded-md py-3 px-8 text-center shadow-md hover:shadow-lg transition-all inline-block"
        >
          Sign Up Now
        </Link>
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  MessageSquare,
  Bell,
  UserPlus,
  Send,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useUser } from "@clerk/nextjs";
import { TypeAnimation } from "react-type-animation";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useGroups } from "@/contexts/group-context";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay,
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
    transition={{ duration: 0.6 }}
  >
    <CardSpotlight className="transition-all p-2 duration-300 hover:scale-105">
      <div className="flex flex-col items-center space-y-1 sm:space-y-2 rounded-lg p-3 sm:p-6 shadow-sm relative group">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay }}
          className="relative text-xl sm:text-2xl"
        >
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-xl transition-all duration-300" />
          {icon}
        </motion.div>
        <h3 className="text-xs sm:text-sm font-semibold sm:font-bold z-20 text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300 whitespace-nowrap">
          {title}
        </h3>

        <p className="text-xs sm:text-sm text-gray-500 text-center dark:text-gray-400 z-20 group-hover:text-gray-300 transition-colors duration-300">
          {description}
        </p>
        <motion.div
          className="absolute inset-0 bg-primary/5 rounded-lg -z-10"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </CardSpotlight>
  </motion.div>
);

export default function App() {
  const userId = useUser().user?.id;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [reachDateTime, setReachDateTime] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    startTime?: string;
    reachTime?: string;
  }>({});
  const [suggestedSource, setSuggestedSource] = useState<Place[]>([]);
  interface Place {
    display_name: string;
  }

  const [suggestedDestination, setSuggestedDestination] = useState<Place[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { createGroup } = useGroups();
  const { toast } = useToast();

  const LOCATION_IO_API_KEY = "pk.c08d4617cedabff7deb664bf446142d6";

  const validateDateTimes = () => {
    const errors: { startTime?: string; reachTime?: string } = {};

    if (!startDateTime) {
      errors.startTime = "Start date and time is required";
    }

    if (!reachDateTime) {
      errors.reachTime = "Reach date and time is required";
    }

    if (startDateTime && reachDateTime) {
      const startDate = new Date(startDateTime);
      const reachDate = new Date(reachDateTime);

      if (startDate >= reachDate) {
        errors.reachTime = "Reach time must be after start time";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchSuggestion = async (place: string, sourceType: string) => {
    if (place.length < 2) {
      return;
    }
    try {
      const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATION_IO_API_KEY}&q=${place}`;
      const response = await axios.get(url);
      if (sourceType === "source") {
        setSuggestedSource(response.data);
      } else {
        setSuggestedDestination(response.data);
      }
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !source.trim() || !destination.trim()) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    if (!validateDateTimes()) {
      toast({
        title: "Error",
        description: "Please correct the date and time errors",
        variant: "destructive",
      });
      return;
    }
    setIsCreating(true);
    try {
      const group = await createGroup(
        newGroupName,
        source,
        destination,
        new Date(startDateTime).toISOString(),
        new Date(reachDateTime).toISOString()
      );
      toast({
        title: "Success",
        description: `Group "${group.name}" created with code ${group.code}!`,
      });
      setNewGroupName("");
      setSource("");
      setDestination("");
      setReachDateTime("");
      setStartDateTime("");
      setValidationErrors({});
      setCreateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    // Add gradient animation keyframes to the document
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col justify-center space-y-4"
              >
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 backdrop-blur-sm rounded-xl p-1"
                    style={{ perspective: "1000px" }}
                  >
                    <h1
                      className="text-3xl font-bold tracking-tighter sm:text-5xl pb-1"
                      style={{ lineHeight: 1.3 }}
                    >
                      <TypeAnimation
                        sequence={[
                          "Never Lose Track of Your Group Again",
                          2000,
                          "Real-Time Group Location Tracking",
                          2000,
                          "Stay Connected, Stay Together",
                          2000,
                          "Make Group Navigation Effortless",
                          2000,
                        ]}
                        repeat={Infinity}
                        cursor={true}
                        preRenderFirstString={true}
                        style={{
                          whiteSpace: "pre-line",
                          display: "block",
                          background:
                            "linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)",
                          backgroundSize: "200% 200%",
                          animation: "gradient 8s ease infinite",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          minHeight: "1.5em",
                          paddingBottom: "0.15em",
                          fontWeight: "700",
                        }}
                        speed={50}
                        deletionSpeed={80}
                      />
                    </h1>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.4 }}
                    className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400"
                  >
                    Track your friends and family in real-time, chat with your
                    group, and get alerts when someone strays too far.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="flex flex-col gap-2 min-[400px]:flex-row"
                >
                  {userId ? (
                    <Link href="/dashboard">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative inline-block"
                      >
                        <Button
                          size="lg"
                          className="px-8 relative z-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300"
                        >
                          Go to Dashboard
                          <motion.div
                            className="absolute inset-0 bg-white/20 rounded-lg"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Button>
                      </motion.div>
                    </Link>
                  ) : (
                    <Link href="/sign-up">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative inline-block"
                      >
                        <Button
                          size="lg"
                          className="px-8 relative z-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300"
                        >
                          Start Tracking Now
                          <motion.div
                            className="absolute inset-0 bg-white/20 rounded-lg"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          />
                        </Button>
                      </motion.div>
                    </Link>
                  )}
                  <Link href="#how-it-works">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative inline-block"
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="px-8 relative z-10  hover:bg-primary/50 transition-all duration-300"
                      >
                        Learn More
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="mx-auto lg:mx-0 relative w-full max-w-[500px] aspect-video rounded-xl overflow-hidden shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center backdrop-blur-sm">
                  <div className="relative w-full h-full bg-[url('/map-placeholder.png')] bg-cover bg-center">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center p-6 rounded-lg bg-background/80 backdrop-blur-md shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
                        </motion.div>
                        <p className="font-medium text-lg">
                          Real-time location tracking demo
                        </p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Add floating elements */}
          <motion.div
            className="absolute top-1/4 left-10 w-8 h-8 rounded-full bg-primary/20"
            animate={{
              y: [0, -20, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-10 w-12 h-12 rounded-full bg-primary/30"
            animate={{
              y: [0, 20, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </section>

        {/* Key Features Section */}
        <section
          id="features"
          className="w-full py-12 md:py-24 bg-muted/50 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-50" />

          <div className="container px-4 md:px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center space-y-4 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
                  Key Features
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Everything you need to stay connected with your group
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6"
            >
              {/* Real-Time Tracking */}
              <FeatureCard
                icon={
                  <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary z-20 relative" />
                }
                title="Real-Time Tracking"
                description="See everyone's real-time location updated in an interactive map on ride"
                delay={0}
              />

              {/* Distance Alerts */}
              <FeatureCard
                icon={
                  <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-primary z-20 relative" />
                }
                title="Distance Alerts"
                description="Get notified when someone exceeds a specified distance from the group"
                delay={0.2}
              />

              {/* Group Chat */}
              <FeatureCard
                icon={
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary z-20 relative" />
                }
                title="Group Chat"
                description="Communicate with your group without leaving the app"
                delay={0.4}
              />

              {/* Easy Group Creation */}
              <FeatureCard
                icon={
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary z-20 relative" />
                }
                title="Easy Group Creation"
                description="Create groups and invite friends with a simple link or code"
                delay={0.6}
              />

              {/* Network Loss Handling */}
              <FeatureCard
                icon={
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
                    className="h-6 w-6 sm:h-8 sm:w-8 text-primary z-20 relative"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                }
                title="Network Loss Handling"
                description="Automatically notify the group when someone loses connection"
                delay={0.8}
              />

              {/* Unique Avatars */}
              <FeatureCard
                icon={
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
                    className="h-6 w-6 sm:h-8 sm:w-8 text-primary z-20 relative"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </svg>
                }
                title="Unique Avatars"
                description="Easily identify group members with customizable avatars"
                delay={1.0}
              />
            </motion.div>
          </div>
        </section>

        {/* How It Works Section  */}
        <section id="how-it-works" className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center space-y-4 text-center"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Simple steps to stay connected with your group
                </p>
              </div>
            </motion.div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col items-center space-y-4 p-4"
              >
                <motion.div
                  className="relative h-20 w-20"
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: [0.8, 1.1, 0.8],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/40"
                    initial={{ scale: 0.85, opacity: 0.5 }}
                    animate={{
                      scale: [0.85, 1.05, 0.85],
                      opacity: [0.5, 0.7, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2,
                    }}
                  />
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                    <div className="font-bold text-xl">1</div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-md z-20"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                    >
                      <Users className="h-5 w-5 text-primary" />
                    </motion.div>
                  </div>
                </motion.div>
                <h3 className="text-xl font-bold">Create a Group</h3>
                <p className="text-sm text-gray-500 text-center dark:text-gray-400">
                  Sign up and create a new group for your trip or event
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col items-center space-y-4 p-4"
              >
                <motion.div
                  className="relative h-20 w-20"
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: [0.8, 1.1, 0.8],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.3,
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/40"
                    initial={{ scale: 0.85, opacity: 0.5 }}
                    animate={{
                      scale: [0.85, 1.05, 0.85],
                      opacity: [0.5, 0.7, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                    <div className="font-bold text-xl">2</div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-md z-20"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                    >
                      <UserPlus className="h-5 w-5 text-primary" />
                    </motion.div>
                  </div>
                </motion.div>
                <h3 className="text-xl font-bold">Invite Friends</h3>
                <p className="text-sm text-gray-500 text-center dark:text-gray-400">
                  Share the invite link or code with your friends and family
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col items-center space-y-4 p-4"
              >
                <motion.div
                  className="relative h-20 w-20"
                  whileHover={{ scale: 1.1 }}
                >
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{
                      scale: [0.8, 1.1, 0.8],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.6,
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/40"
                    initial={{ scale: 0.85, opacity: 0.5 }}
                    animate={{
                      scale: [0.85, 1.05, 0.85],
                      opacity: [0.5, 0.7, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.8,
                    }}
                  />
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                    <div className="font-bold text-xl">3</div>
                    <motion.div
                      className="absolute -bottom-1 -right-1 h-8 w-8 flex items-center justify-center rounded-full bg-white shadow-md z-20"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.8 }}
                    >
                      <MapPin className="h-5 w-5 text-primary" />
                    </motion.div>
                  </div>
                </motion.div>
                <h3 className="text-xl font-bold">Start Tracking</h3>
                <p className="text-sm text-gray-500 text-center dark:text-gray-400">
                  Everyone's location appears on the map in real-time
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
              className="flex justify-center mt-12"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 text-primary"
              >
                <Send className="h-4 w-4" />
                <Link
                  href="/sign-up"
                  className="text-sm font-medium hover:underline"
                >
                  Ready to get started? Create your account now
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faq" className="w-full py-12 md:py-24 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                  Frequently Asked Questions
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Common questions about our group tracking system
                </p>
              </div>

              <div className="mx-auto w-full max-w-3xl space-y-4 mt-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="faq-1">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Is my location data secure?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base text-left">
                      Yes, your location is only shared with members of your
                      group and is encrypted during transmission. We use
                      industry-standard encryption protocols to ensure your data
                      remains private and secure. Additionally, you can pause
                      location sharing at any time.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      How accurate is the location tracking?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base text-left">
                      Our system uses GPS data from your device, which is
                      typically accurate to within 5-10 meters in optimal
                      conditions. Accuracy may vary based on your device,
                      environment (urban areas, indoors, etc.), and satellite
                      availability. We also implement smoothing algorithms to
                      improve location reliability.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Does it work internationally?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base text-left">
                      Yes, our service works worldwide as long as you have an
                      internet connection. There are no geographical
                      restrictions, making it perfect for international travel,
                      events, and adventures. Data roaming charges from your
                      carrier may apply when traveling internationally.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-4">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      How much battery does it use?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base text-left">
                      We've optimized the app to use minimal battery while still
                      providing real-time updates. You can adjust the frequency
                      of location updates to balance between accuracy and
                      battery life. In typical usage, our app consumes similar
                      battery to other navigation apps. We also provide a
                      battery-saving mode for extended trips.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-5">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Can I use the app without data connection?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base text-left">
                      While an internet connection is required for real-time
                      location sharing, our app can store your group's last
                      known locations when offline. Once you reconnect, your
                      location will update automatically, and you'll receive any
                      missed updates from your group members.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-6">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Is there a limit to group size?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base text-left">
                      Our free plan supports groups of up to 10 members. For
                      larger groups or events, we offer premium plans that
                      support up to 100 members per group with additional
                      features like custom branding and enhanced analytics.
                      Contact us for special event requirements beyond these
                      limits.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </section>

        {/* Ready to  get started section */}
        <section className="w-full py-12 md:py-24 bg-gradient-to-b from-transparent via-muted/50 to-transparent">
          <div className="container px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center justify-center space-y-4 text-center"
            >
              <div className="space-y-2 relative">
                <div className="absolute inset-0 blur-3xl bg-primary/5 rounded-full" />
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl relative">
                  Ready to Get Started?
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  {userId
                    ? "Create your first group and start tracking together"
                    : "Join thousands of groups who stay connected with GroupTrack"}
                </p>
              </div>
              <motion.div
                className="flex flex-col gap-2 min-[400px]:flex-row"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {userId ? (
                  <Dialog
                    open={createDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="lg"
                        className="px-8 relative group overflow-hidden"
                      >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative">Create a Group</span>
                        <motion.div
                          className="absolute inset-0 rounded-lg ring-2 ring-primary/50"
                          initial={false}
                          whileHover={{ scale: 1.15 }}
                          transition={{ duration: 0.3 }}
                        />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create a New Group Ride</DialogTitle>
                        <DialogDescription>
                          Set up your ride and invite others.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="group-name">Group Name</Label>
                          <Input
                            id="group-name"
                            placeholder="e.g., Road Trip 2025"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="source">Source</Label>
                          <Input
                            id="source"
                            placeholder="e.g., New York"
                            value={source}
                            onChange={(e) => {
                              setSource(e.target.value);
                              fetchSuggestion(e.target.value, e.target.id);
                            }}
                            required
                          />
                          {suggestedSource.length > 0 && source.length > 0 && (
                            <div className="flex flex-col border border-border rounded-md max-h-200 overflow-y-auto z-10 bg-background">
                              {suggestedSource.map((place, index) => (
                                <div
                                  className="p-2 hover:bg-muted cursor-pointer"
                                  key={index}
                                  onClick={() => {
                                    setSource(place.display_name);
                                    setSuggestedSource([]);
                                  }}
                                >
                                  {place.display_name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="destination">Destination</Label>
                          <Input
                            id="destination"
                            placeholder="e.g., Boston"
                            value={destination}
                            onChange={(e) => {
                              setDestination(e.target.value);
                              fetchSuggestion(e.target.value, e.target.id);
                            }}
                            required
                          />
                          {suggestedDestination.length > 0 &&
                            destination.length > 0 && (
                              <div className="flex flex-col border border-border rounded-md max-h-200 overflow-y-auto z-10 bg-background">
                                {suggestedDestination.map((place, index) => (
                                  <div
                                    className="p-2 hover:bg-muted cursor-pointer"
                                    key={index}
                                    onClick={() => {
                                      setDestination(place.display_name);
                                      setSuggestedDestination([]);
                                    }}
                                  >
                                    {place.display_name}
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="startDateTime">
                            Start Date and Time
                          </Label>
                          <Input
                            id="startDateTime"
                            type="datetime-local"
                            value={startDateTime}
                            onChange={(e) => {
                              setStartDateTime(e.target.value);
                              // Clear validation error when user changes the input
                              if (validationErrors.startTime) {
                                setValidationErrors({
                                  ...validationErrors,
                                  startTime: undefined,
                                });
                              }
                            }}
                            className={
                              validationErrors.startTime ? "border-red-500" : ""
                            }
                            required
                          />
                          {validationErrors.startTime && (
                            <p className="text-sm text-red-500">
                              {validationErrors.startTime}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="reachDateTime">
                            Reach Date and Time
                          </Label>
                          <Input
                            id="reachDateTime"
                            type="datetime-local"
                            value={reachDateTime}
                            onChange={(e) => {
                              setReachDateTime(e.target.value);
                              // Clear validation error when user changes the input
                              if (validationErrors.reachTime) {
                                setValidationErrors({
                                  ...validationErrors,
                                  reachTime: undefined,
                                });
                              }
                            }}
                            className={
                              validationErrors.reachTime ? "border-red-500" : ""
                            }
                            required
                          />
                          {validationErrors.reachTime && (
                            <p className="text-sm text-red-500">
                              {validationErrors.reachTime}
                            </p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleCreateGroup}
                          disabled={isCreating}
                        >
                          {isCreating ? "Creating..." : "Create Group"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="px-8 relative group overflow-hidden"
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary via-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative">Sign Up Free</span>
                      <motion.div
                        className="absolute inset-0 rounded-lg ring-2 ring-primary/50"
                        initial={false}
                        whileHover={{ scale: 1.15 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:gap-8 md:py-12">
          <div className="flex flex-col gap-2 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">RiderConnect</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stay connected with your group, wherever you go.
            </p>
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="hover:underline">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Download
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Careers
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:underline">
                    Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t py-6">
          <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 RiderConnect. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
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
                  className="h-5 w-5"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                <span className="sr-only">Facebook</span>
              </Link>
              <Link
                href="#"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
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
                  className="h-5 w-5"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="#"
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
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
                  className="h-5 w-5"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
