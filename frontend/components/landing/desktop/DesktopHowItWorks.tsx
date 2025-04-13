import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type Step = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const steps: Step[] = [
  {
    id: "create-account",
    title: "Create Your Account",
    description: "Sign up for RiderConnect in seconds using your email or social accounts. Your data is always secure and private.",
    icon: "/icons/user-plus.svg"
  },
  {
    id: "create-group",
    title: "Create Your First Group",
    description: "Start a new group and invite your friends and family members via email, SMS, or by sharing an invite link.",
    icon: "/icons/users.svg"
  },
  {
    id: "enable-location",
    title: "Enable Location Sharing",
    description: "Allow location permissions when prompted. You control when your location is shared and with which groups.",
    icon: "/icons/map-pin.svg"
  },
  {
    id: "start-tracking",
    title: "Start Tracking & Communicating",
    description: "View your group on the map, chat, and get notifications when members arrive at destinations or leave areas.",
    icon: "/icons/compass.svg"
  }
];

export default function DesktopHowItWorks() {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 z-0" />
      
      <div className="relative z-10 space-y-24">
        {steps.map((step, index) => (
          <TimelineStep 
            key={step.id} 
            step={step} 
            index={index} 
            isLeft={index % 2 === 0} 
          />
        ))}
      </div>
    </div>
  );
}

const TimelineStep: React.FC<{
  step: Step;
  index: number;
  isLeft: boolean;
}> = ({ step, index, isLeft }) => {
  return (
    <div className={`flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Content side */}
      <motion.div 
        className={`w-5/12 ${isLeft ? 'pr-12 text-right' : 'pl-12 text-left'}`}
        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
        <p className="text-muted-foreground">{step.description}</p>
      </motion.div>
      
      {/* Center node */}
      <motion.div 
        className="relative w-2/12 flex justify-center"
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        viewport={{ once: true }}
      >
        <div className="relative">
          <motion.div 
            className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center z-10 shadow-glow"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse" />
            <Image 
              src={step.icon} 
              alt={`${step.title} icon`} 
              width={32} 
              height={32}
              className="icon-glow relative z-10"
              loading="lazy"
            />
          </motion.div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card rounded-full border-4 border-background w-8 h-8 flex items-center justify-center text-sm font-bold">
            {index + 1}
          </div>
        </div>
      </motion.div>
      
      {/* Empty side (or could have images here) */}
      <div className={`w-5/12 ${isLeft ? 'pl-12' : 'pr-12'}`}>
        {/* Could add illustrations here */}
      </div>
    </div>
  );
};

