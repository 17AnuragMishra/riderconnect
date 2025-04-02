"use client";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MapPin, Users, MessageSquare, Bell, UserPlus, Send } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useUser } from "@clerk/nextjs"
import { TypeAnimation } from 'react-type-animation';
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    transition={{ duration: 0.6 }}>
    <CardSpotlight className="transition-all duration-300 hover:scale-105">
      <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm relative group">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay }}
          className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
          {icon}
        </motion.div>
        <h3 className="text-xl font-bold z-20 text-white group-hover:text-primary transition-colors duration-300 whitespace-nowrap">
          {title}
        </h3>
        <p className="text-sm text-gray-500 text-center dark:text-gray-400 z-20 group-hover:text-gray-300 transition-colors duration-300">
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

export default function Home() {
  const userId = useUser().user?.id;
  
  useEffect(() => {
    // Add gradient animation keyframes to the document
    const style = document.createElement('style');
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
                className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-20 backdrop-blur-sm rounded-xl p-1"
                    style={{ perspective: "1000px" }}>
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl pb-1" 
                        style={{ lineHeight: 1.3 }}>
                      <TypeAnimation 
                        sequence={[
                          "Never Lose Track of Your Group Again", 2000,
                          "Real-Time Group Location Tracking", 2000,
                          "Stay Connected, Stay Together", 2000,
                          "Make Group Navigation Effortless", 2000
                        ]}
                        repeat={Infinity} 
                        cursor={true}
                        preRenderFirstString={true}
                        style={{
                          whiteSpace: "pre-line",
                          display: "block",
                          background: "linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)",
                          backgroundSize: "200% 200%",
                          animation: "gradient 8s ease infinite",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          minHeight: "1.5em",
                          paddingBottom: "0.15em",
                          fontWeight: "700"
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
                    className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Track your friends and family in real-time, chat with your group, and get alerts when someone strays
                    too far.
                  </motion.p>
                </div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="flex flex-col gap-2 min-[400px]:flex-row">
                  {userId ? (
                    <Link href="/dashboard">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative inline-block">
                        <Button size="lg" className="px-8 relative z-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300">
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
                        className="relative inline-block">
                        <Button size="lg" className="px-8 relative z-10 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300">
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
                      className="relative inline-block">
                      <Button size="lg" variant="outline" className="px-8 relative z-10  hover:bg-primary/50 transition-all duration-300">
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
                className="mx-auto lg:mx-0 relative w-full max-w-[500px] aspect-video rounded-xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center backdrop-blur-sm">
                  <div className="relative w-full h-full bg-[url('/map-placeholder.png')] bg-cover bg-center">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center p-6 rounded-lg bg-background/80 backdrop-blur-md shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}>
                          <MapPin className="h-12 w-12 text-primary mx-auto mb-3" />
                        </motion.div>
                        <p className="font-medium text-lg">Real-time location tracking demo</p>
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
              ease: "easeInOut"
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
              ease: "easeInOut"
            }}
          />
        </section>

        {/* Key Features Section */}
        <section id="features" className="w-full py-12 md:py-24 bg-muted/50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-pattern opacity-50" />
          
          <div className="container px-4 md:px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col items-center justify-center space-y-4 text-center">
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
                    staggerChildren: 0.1
                  }
                }
              }}
              className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
              
              {/* Real-Time Tracking */}
              <FeatureCard
                icon={<MapPin className="h-10 w-10 text-primary z-20 relative" />}
                title="Real-Time Tracking"
                description="See everyone's location updated in real-time on an interactive map"
                delay={0}
              />

              {/* Distance Alerts */}
              <FeatureCard
                icon={<Bell className="h-10 w-10 text-primary z-20 relative" />}
                title="Distance Alerts"
                description="Get notified when someone exceeds a specified distance from the group"
                delay={0.2}
              />

              {/* Group Chat */}
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10 text-primary z-20 relative" />}
                title="Group Chat"
                description="Communicate with your group without leaving the app"
                delay={0.4}
              />

              {/* Easy Group Creation */}
              <FeatureCard
                icon={<Users className="h-10 w-10 text-primary z-20 relative" />}
                title="Easy Group Creation"
                description="Create groups and invite friends with a simple link or code"
                delay={0.6}
              />

              {/* Network Loss Handling */}
              <FeatureCard
                icon={(
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
                    className="h-10 w-10 text-primary z-20 relative"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                )}
                title="Network Loss Handling"
                description="Automatically notify the group when someone loses connection"
                delay={0.8}
              />

              {/* Unique Avatars */}
              <FeatureCard
                icon={(
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
                    className="h-10 w-10 text-primary z-20 relative"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                  </svg>
                )}
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
              className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">How It Works</h2>
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
                className="flex flex-col items-center space-y-4 p-4">
                <motion.div 
                  className="relative h-20 w-20"
                  whileHover={{ scale: 1.1 }}>
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/40"
                    initial={{ scale: 0.85, opacity: 0.5 }}
                    animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.5, 0.7, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
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
                className="flex flex-col items-center space-y-4 p-4">
                <motion.div 
                  className="relative h-20 w-20"
                  whileHover={{ scale: 1.1 }}>
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  />
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/40"
                    initial={{ scale: 0.85, opacity: 0.5 }}
                    animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.5, 0.7, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
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
                className="flex flex-col items-center space-y-4 p-4">
                <motion.div 
                  className="relative h-20 w-20"
                  whileHover={{ scale: 1.1 }}>
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                  />
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/40"
                    initial={{ scale: 0.85, opacity: 0.5 }}
                    animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.5, 0.7, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
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
              className="flex justify-center mt-12">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 text-primary">
                <Send className="h-4 w-4" />
                <Link href="/sign-up" className="text-sm font-medium hover:underline">
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
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Frequently Asked Questions</h2>
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
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base">
                      Yes, your location is only shared with members of your group and is encrypted during transmission. 
                      We use industry-standard encryption protocols to ensure your data remains private and secure. 
                      Additionally, you can pause location sharing at any time.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-2">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      How accurate is the location tracking?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base">
                      Our system uses GPS data from your device, which is typically accurate to within 5-10 meters in 
                      optimal conditions. Accuracy may vary based on your device, environment (urban areas, indoors, etc.), 
                      and satellite availability. We also implement smoothing algorithms to improve location reliability.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-3">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Does it work internationally?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base">
                      Yes, our service works worldwide as long as you have an internet connection. There are no geographical 
                      restrictions, making it perfect for international travel, events, and adventures. Data roaming charges 
                      from your carrier may apply when traveling internationally.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-4">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      How much battery does it use?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base">
                      We've optimized the app to use minimal battery while still providing real-time updates. You can 
                      adjust the frequency of location updates to balance between accuracy and battery life. In typical usage, 
                      our app consumes similar battery to other navigation apps. We also provide a battery-saving mode for 
                      extended trips.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-5">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Can I use the app without data connection?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base">
                      While an internet connection is required for real-time location sharing, our app can store your 
                      group's last known locations when offline. Once you reconnect, your location will update automatically, 
                      and you'll receive any missed updates from your group members.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="faq-6">
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      Is there a limit to group size?
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-500 dark:text-gray-400 pt-2 pb-4 text-base">
                      Our free plan supports groups of up to 10 members. For larger groups or events, we offer premium plans 
                      that support up to 100 members per group with additional features like custom branding and enhanced 
                      analytics. Contact us for special event requirements beyond these limits.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Ready to Get Started?</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Join thousands of groups who stay connected with GroupTrack
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/sign-up">
                  <Button size="lg" className="px-8">
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:gap-8 md:py-12">
          <div className="flex flex-col gap-2 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">GroupTrack</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Stay connected with your group, wherever you go.</p>
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
            <p className="text-sm text-gray-500 dark:text-gray-400">© 2025 GroupTrack. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
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
              <Link href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
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
              <Link href="#" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
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
  )
}
