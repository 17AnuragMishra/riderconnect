"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { MapPin, MessageSquare, Bell, Calendar, WifiOff, Battery } from "lucide-react";
import { throttle } from "lodash";

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

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const features: FeatureCard[] = [
  {
    id: "real-time-tracking",
    title: "Real-Time Tracking",
    description: "See your group members' locations updated in real-time on an interactive map.",
    icon: <MapPin className="h-6 w-6 text-primary icon-glow" />
  },
  {
    id: "group-chat",
    title: "Group Chat",
    description: "Communicate with your entire group or send private messages to individual members.",
    icon: <MessageSquare className="h-6 w-6 text-primary icon-glow" />
  },
  {
    id: "custom-alerts",
    title: "Custom Alerts",
    description: "Get notified when group members arrive at a destination or leave designated areas.",
    icon: <Bell className="h-6 w-6 text-primary icon-glow" />
  },
  {
    id: "trip-planning",
    title: "Trip Planning",
    description: "Create and share routes, meeting points, and destinations with your group.",
    icon: <Calendar className="h-6 w-6 text-primary icon-glow" />
  },
  {
    id: "offline-mode",
    title: "Offline Mode", 
    description: "Access previously loaded maps and last known locations even without an internet connection.",
    icon: <WifiOff className="h-6 w-6 text-primary icon-glow" />
  },
  {
    id: "battery-optimization",
    title: "Battery Saver",
    description: "Intelligent tracking intervals that adjust based on movement to preserve battery life.",
    icon: <Battery className="h-6 w-6 text-primary icon-glow" />
  }
];

export default function MobileFeatureCards() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerOptions = {
    once: false,
    amount: 0.2,
    fallback: true
  };
  
  const isInView = useInView(containerRef, observerOptions);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeVelocity, setSwipeVelocity] = useState(0);
  const lastTouchX = useRef(0);
  const lastTouchTime = useRef(Date.now());

  const minSwipeDistance = 50;

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.clientWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < features.length) {
        setActiveIndex(newIndex);
      }
    }
  }, [activeIndex]);

  const scrollToCard = useCallback((index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.clientWidth;
      container.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const velocityDecay = useCallback((velocity: number) => {
    return velocity * 0.95; // Smooth out the velocity
  }, []);

  const onTouchMove = (e: React.TouchEvent) => {
    const touchX = e.targetTouches[0].clientX;
    setTouchEnd(touchX);
    
    const touchTime = Date.now();
    const deltaX = touchX - lastTouchX.current;
    const deltaTime = touchTime - lastTouchTime.current;
    
    if (deltaTime > 0) {
      const newVelocity = deltaX / deltaTime;
      setSwipeVelocity(prev => velocityDecay(prev) + newVelocity);
    }
    
    lastTouchX.current = touchX;
    lastTouchTime.current = touchTime;
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Factor in velocity for more responsive swiping
    const velocityFactor = Math.abs(swipeVelocity) > 0.5 ? 1 : 0;
    const swipeThreshold = minSwipeDistance - (velocityFactor * 15);
    
    // Use velocity to determine if swipe should happen
    if ((isLeftSwipe || (distance > swipeThreshold && swipeVelocity < -0.3)) && activeIndex < features.length - 1) {
      scrollToCard(activeIndex + 1);
    } else if ((isRightSwipe || (distance < -swipeThreshold && swipeVelocity > 0.3)) && activeIndex > 0) {
      scrollToCard(activeIndex - 1);
    }
    
    // Reset velocity
    setSwipeVelocity(0);
  };

  // Throttle the scroll handler to improve performance
  const throttledHandleScroll = useCallback(
    throttle(handleScroll, 100, { leading: true, trailing: true }),
    [handleScroll]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', throttledHandleScroll);
      return () => {
        container.removeEventListener('scroll', throttledHandleScroll);
        throttledHandleScroll.cancel();
      };
    }
  }, [throttledHandleScroll]);
  
  // Loading state management for smoother transitions
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className={`space-y-4 touch-optimized mobile-optimize ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      role="region" 
      aria-label="Feature highlights" 
      aria-roledescription="carousel"
    >
      <motion.div 
        ref={scrollContainerRef}
        className="flex touch-scroll-x overflow-x-auto gap-4 pb-4 -mx-4 px-4 scroll-optimize"
        style={{ scrollSnapType: 'x mandatory' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        {features.map((feature, index) => (
          <motion.div 
            key={feature.id}
            className="w-full flex-shrink-0 flex-grow-0 feature-card-hover mobile-touch-feedback"
            style={{ 
              scrollSnapAlign: 'center',
              flexBasis: '100%'
            }}
            role="group"
            aria-roledescription="slide"
            aria-label={`Feature: ${feature.title}`}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ 
              scale: 0.98,
              transition: { 
                duration: 0.1, 
                type: "spring", 
                stiffness: 400
              }
            }}
          >
            <div className="bg-card rounded-xl p-5 border border-border shadow-sm flex flex-col card-height-mobile md:card-height-tablet justify-between">
              <div className="mb-4 bg-primary/10 p-3 rounded-full w-14 h-14 flex items-center justify-center">
                <IconWithLoading>
                  {feature.icon}
                </IconWithLoading>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 mobile-text-balance">{feature.title}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3 mobile-content-compact">{feature.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <div 
        className="flex justify-center gap-2 py-2" 
        role="tablist" 
        aria-label="Feature slides navigation"
      >
        {features.map((feature, index) => (
          <motion.button
            key={index}
            className={`w-3 h-3 rounded-full min-touch-target flex items-center justify-center touch-scroll-indicator touch-feedback ${
              index === activeIndex ? 'bg-primary' : 'bg-muted'
            }`}
            onClick={() => scrollToCard(index)}
            aria-label={`View ${feature.title}`}
            aria-selected={index === activeIndex}
            role="tab"
            tabIndex={index === activeIndex ? 0 : -1}
            whileTap={{ 
              scale: 0.9,
              transition: { 
                duration: 0.1, 
                type: "spring", 
                stiffness: 400
              }
            }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
          >
            <span className="sr-only">{feature.title}</span>
          </motion.button>
        ))}
      </div>
      
      {/* Optional: Current feature caption for accessibility */}
      <div className="sr-only" aria-live="polite">
        Currently viewing: {features[activeIndex].title}
      </div>
    </div>
  );
}
