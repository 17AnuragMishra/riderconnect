"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Users, UserPlus, MapPin, MessageSquare } from "lucide-react";

type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

// Define steps with Lucide icons for better performance
const steps: Step[] = [
  {
    id: "create",
    title: "Create or Join a Group",
    description: "Start by creating a new group or joining an existing one with a simple invite code.",
    icon: <Users className="h-6 w-6 text-primary icon-glow" />
  },
  {
    id: "invite",
    title: "Invite Members",
    description: "Add friends and family to your group using email invites or shareable links.",
    icon: <UserPlus className="h-6 w-6 text-primary icon-glow" />
  },
  {
    id: "track",
    title: "Enable Location Sharing",
    description: "Turn on location sharing to start tracking group members in real-time.",
    icon: <MapPin className="h-6 w-6 text-primary icon-glow" />
  },
  {
    id: "monitor",
    title: "Monitor and Communicate",
    description: "View locations, chat with the group, and receive important notifications.",
    icon: <MessageSquare className="h-6 w-6 text-primary icon-glow" />
  }
];

// Progressive loading component for icons
const IconWithLoading = ({ children }: { children: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    setIsLoaded(true);
  }, []);
  
  return (
    <div className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      {children}
    </div>
  );
};

export default function MobileHowItWorks() {
  const [activeStep, setActiveStep] = useState<string | null>("create");
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Define reusable observer options
  const observerOptions = {
    once: false,
    amount: 0.2,
    fallback: true
  };
  
  // Optimize animation performance
  const animationConfig = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  };
  
  const isInView = useInView(containerRef, observerOptions);

  // Toggle step open/closed state
  const toggleStep = useCallback((stepId: string) => {
    setActiveStep(currentActiveStep => currentActiveStep === stepId ? null : stepId);
  }, []);

  // Loading state management for smoother transitions
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={`space-y-4 touch-optimized mobile-optimize ${
        isLoading ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-300`}
      role="tablist"
      aria-label="How it works"
      aria-orientation="vertical"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          className="border border-border rounded-lg overflow-hidden bg-card shadow-sm"
          role="tab"
          aria-selected={activeStep === step.id}
          {...animationConfig}
          initial={{ ...animationConfig.initial }}
          animate={isInView ? { ...animationConfig.animate } : { ...animationConfig.initial }}
          transition={{
            ...animationConfig.transition,
            delay: index * 0.1
          }}
          whileHover={{ scale: 1.01 }}
        >
          <motion.button
            className="w-full min-touch-target flex items-center justify-between p-4 text-left mobile-touch-feedback touch-feedback"
            onClick={() => toggleStep(step.id)}
            aria-expanded={activeStep === step.id}
            aria-controls={`content-${step.id}`}
            id={`tab-${step.id}`}
            whileTap={{ 
              backgroundColor: "rgba(var(--primary), 0.05)", 
              scale: 0.98,
              transition: { 
                duration: 0.1, 
                type: "spring", 
                stiffness: 400
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-primary/10 p-2.5 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <IconWithLoading>
                    {step.icon}
                  </IconWithLoading>
                </div>
                <div className="absolute -top-1 -right-1 bg-muted w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-foreground border border-border">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-semibold text-base mobile-text-balance">{step.title}</h3>
            </div>
            <motion.div 
              animate={{ rotate: activeStep === step.id ? 180 : 0 }} 
              transition={{ 
                duration: 0.2,
                type: "spring",
                stiffness: 200
              }}
              className="text-muted-foreground"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </motion.div>
          </motion.button>
          
          <AnimatePresence mode="wait">
            {activeStep === step.id && (
              <motion.div
                id={`content-${step.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${step.id}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  opacity: { duration: 0.2 },
                  height: { duration: 0.3, type: "spring" },
                  exit: { duration: 0.15 }
                }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-0 pl-[4.5rem]">
                  <p className="text-muted-foreground text-sm mobile-content-compact">{step.description}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
      
      {/* Progressive enhancement hint */}
      <div className="text-center text-xs text-muted-foreground mt-4 px-4">
        <p>Tap each step to learn more</p>
      </div>
    </motion.div>
  );
}
