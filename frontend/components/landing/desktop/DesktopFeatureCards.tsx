import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

const features: FeatureCard[] = [
  {
    id: "real-time-tracking",
    title: "Real-Time Tracking",
    description: "See your group members' locations updated in real-time on an interactive map.",
    icon: "/icons/map-marker.svg"
  },
  {
    id: "group-chat",
    title: "Group Chat",
    description: "Communicate with your entire group or send private messages to individual members.",
    icon: "/icons/chat-bubble.svg"
  },
  {
    id: "custom-alerts",
    title: "Custom Alerts",
    description: "Get notified when group members arrive at a destination or leave designated areas.",
    icon: "/icons/bell.svg"
  },
  {
    id: "trip-planning",
    title: "Trip Planning",
    description: "Create and share routes, meeting points, and destinations with your group.",
    icon: "/icons/calendar.svg"
  },
  {
    id: "offline-mode",
    title: "Offline Mode",
    description: "Access previously loaded maps and last known locations even without an internet connection.",
    icon: "/icons/wifi-off.svg"
  },
  {
    id: "battery-optimization",
    title: "Battery Optimization",
    description: "Intelligent tracking intervals that adjust based on movement to preserve battery life.",
    icon: "/icons/battery.svg"
  }
];

const FeatureCard: React.FC<{
  feature: FeatureCard;
  index: number;
}> = ({ feature, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="feature-card-hover"
    >
      <div className="bg-card rounded-xl p-6 h-full border border-border shadow-sm flex flex-col">
        <div className="mb-4 bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center">
          <Image 
            src={feature.icon} 
            alt={`${feature.title} icon`} 
            width={32} 
            height={32}
            className="icon-glow"
            loading="lazy"
          />
        </div>
        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
        <p className="text-muted-foreground">{feature.description}</p>
      </div>
    </motion.div>
  );
};

export default function DesktopFeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => (
        <FeatureCard key={feature.id} feature={feature} index={index} />
      ))}
    </div>
  );
}
