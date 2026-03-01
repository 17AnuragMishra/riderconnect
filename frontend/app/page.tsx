"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  MapPin, Users, MessageSquare, Bell, UserPlus, Send,
  Shield, Wifi, WifiOff, Navigation, ChevronDown, Menu, X, Zap
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// ═══════════════════════════════════════════════════════════════
// ANIMATED MAP BACKGROUND
// ═══════════════════════════════════════════════════════════════

function MapBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.08] dark:opacity-[0.12]">
      <svg width="100%" height="100%" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hero-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-teal" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
        <path d="M0,350 Q300,200 600,350 Q900,500 1200,350" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20,10" opacity="0.6" className="text-teal" />
        <path d="M0,400 Q300,250 600,400 Q900,550 1200,400" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10,20" opacity="0.3" className="text-teal" />
        {[[150, 280], [600, 320], [1050, 370]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6" fill="currentColor" opacity="0.9" className="text-teal" />
            <circle cx={x} cy={y} r="12" fill="none" stroke="currentColor" opacity="0.4" className="text-teal">
              <animate attributeName="r" values="6;20;6" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0;0.4" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LIVE ALERT DEMO WIDGET
// ═══════════════════════════════════════════════════════════════

function LiveAlertDemo() {
  const riders = [
    { name: "You", lat: 50, lng: 50, color: "text-teal", bgColor: "bg-teal/20", borderColor: "border-teal", status: "online" },
    { name: "Rahul", lat: 72, lng: 38, color: "text-amber", bgColor: "bg-amber/20", borderColor: "border-amber", status: "warn" },
    { name: "Priya", lat: 45, lng: 65, color: "text-violet-400", bgColor: "bg-violet-400/20", borderColor: "border-violet-400", status: "online" },
    { name: "Dev", lat: 58, lng: 28, color: "text-pink-400", bgColor: "bg-pink-400/20", borderColor: "border-pink-400", status: "online" },
  ];

  return (
    <div className="glass-card overflow-hidden relative">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal animate-blink" />
          <span className="font-mono text-xs text-teal tracking-wider">LIVE TRACKING</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">4 RIDERS · GROUP: NH48</span>
      </div>

      {/* Map area */}
      <div className="relative h-[220px] bg-teal/[0.03]">
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-15">
          <defs>
            <pattern id="mapgrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-teal" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapgrid)" />
          <path d="M 30,160 Q 150,80 280,110 Q 380,130 450,80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" className="text-teal" />
          <path d="M 280,110 Q 310,145 340,170" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.7" className="text-amber" />
        </svg>

        {/* Threshold radius */}
        <div className="absolute left-[57%] top-[45%] w-20 h-20 rounded-full border border-dashed border-amber/40 -translate-x-1/2 -translate-y-1/2 bg-amber/5" />

        {/* Riders */}
        {riders.map((r, i) => (
          <motion.div key={r.name}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: i * 0.15 }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${r.lat}%`, top: `${r.lng}%` }}
          >
            {r.status === "warn" && (
              <div className={`absolute -inset-2 rounded-full border-2 ${r.borderColor} opacity-50`}
                style={{ animation: "pulse-ring 1.5s ease-out infinite" }}
              />
            )}
            <div className={`w-7 h-7 rounded-full ${r.bgColor} border-2 ${r.borderColor} flex items-center justify-center`}>
              <span className={`text-[10px] font-bold font-mono ${r.color}`}>{r.name[0]}</span>
            </div>
            <div className={`absolute top-[30px] left-1/2 -translate-x-1/2 bg-background/90 border ${r.borderColor}/30 rounded px-1.5 py-0.5`}>
              <span className={`text-[9px] font-mono ${r.color} whitespace-nowrap`}>{r.name}</span>
            </div>
          </motion.div>
        ))}

        {/* Scan line */}
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal to-transparent opacity-30" style={{ animation: "scanLine 3s linear infinite" }} />
      </div>

      {/* Alert */}
      <motion.div
        initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1 }}
        className="mx-3.5 my-3 px-3.5 py-2.5 bg-amber/10 border border-amber/30 rounded-lg flex items-center gap-2.5"
      >
        <Bell size={14} className="text-amber flex-shrink-0" />
        <span className="text-xs font-mono text-amber">⚠ Rahul is 2.3 km away — exceeded threshold</span>
      </motion.div>

      {/* Footer stats */}
      <div className="px-4 pb-3.5 pt-1 flex gap-5">
        {[["4", "RIDERS"], ["~2km", "RADIUS"], ["12ms", "LATENCY"]].map(([v, l]) => (
          <div key={l}>
            <div className="font-mono text-[15px] text-teal font-semibold">{v}</div>
            <div className="font-mono text-[9px] text-muted-foreground tracking-widest">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FEATURE CARD
// ═══════════════════════════════════════════════════════════════

interface FeatureCardData {
  icon: React.ElementType;
  title: string;
  desc: string;
  color?: string;
  badge?: string;
}

function FeatureCard({ icon: Icon, title, desc, color = "teal", badge }: FeatureCardData) {
  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    teal: { text: "text-teal", bg: "bg-teal/10", border: "border-teal/30" },
    amber: { text: "text-amber", bg: "bg-amber/10", border: "border-amber/30" },
    violet: { text: "text-violet-400", bg: "bg-violet-400/10", border: "border-violet-400/30" },
    pink: { text: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/30" },
  };
  const c = colorMap[color] || colorMap.teal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="glass-card p-7 relative overflow-hidden group cursor-default"
    >
      {badge && (
        <div className={`absolute top-4 right-4 ${c.bg} border ${c.border} rounded-full px-2.5 py-0.5`}>
          <span className={`text-[10px] font-mono ${c.text} tracking-widest`}>{badge}</span>
        </div>
      )}
      <div className={`w-11 h-11 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center mb-4`}>
        <Icon size={20} className={c.text} />
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${c.text.replace('text-', 'via-')} to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-300`} />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOW IT WORKS STEP
// ═══════════════════════════════════════════════════════════════

function Step({ num, icon: Icon, title, desc, delay = 0 }: {
  num: number; icon: React.ElementType; title: string; desc: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="flex flex-col items-center text-center gap-4"
    >
      <div className="relative">
        <div className="w-[72px] h-[72px] rounded-full bg-teal/[0.08] border-[1.5px] border-teal/30 flex items-center justify-center relative z-[1]">
          <Icon size={28} className="text-teal" />
        </div>
        <div className="absolute -top-2.5 -right-2.5 font-display text-[32px] text-teal/[0.15] z-0 leading-none">
          {String(num).padStart(2, "0")}
        </div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">{desc}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FAQ ITEM
// ═══════════════════════════════════════════════════════════════

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="glass-card px-6 py-5 cursor-pointer mb-2.5"
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center gap-4">
        <span className="text-[15px] font-medium">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
        </motion.div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="mt-3.5 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATS TICKER
// ═══════════════════════════════════════════════════════════════

function StatsTicker() {
  const items = [
    "🛣  12,000+ GROUP RIDES TRACKED",
    "📍  REAL-TIME ACCURACY <10 METERS",
    "⚡  ALERTS IN <2 SECONDS",
    "🌍  WORKS WORLDWIDE",
    "🔒  END-TO-END ENCRYPTED",
    "👥  FREE FOR UP TO 10 RIDERS",
  ];
  return (
    <div className="overflow-hidden border-y border-border/50 py-3.5 bg-teal/[0.03]">
      <div className="ticker-track">
        {[...items, ...items].map((s, i) => (
          <span key={i} className="font-mono text-xs text-teal tracking-wider">{s}</span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN LANDING PAGE
// ═══════════════════════════════════════════════════════════════

export default function LandingPage() {
  const { user } = useUser();

  return (
    <main className="bg-background overflow-hidden">

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <MapBackground />

        {/* Gradient orbs */}
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-radial from-teal/[0.06] to-transparent pointer-events-none" />
        <div className="absolute bottom-[10%] -right-[5%] w-[400px] h-[400px] rounded-full bg-gradient-radial from-amber/[0.05] to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">

          {/* Left — Copy */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-teal/[0.08] border border-teal/25 rounded-full px-3.5 py-1.5 mb-6"
            >
              <Zap size={12} className="text-teal" />
              <span className="font-mono text-[11px] text-teal tracking-wider">REAL-TIME GROUP TRACKING</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-bold tracking-tight leading-[0.95] mb-7"
            >
              NEVER<br />
              <span className="text-teal">LOSE</span><br />
              YOUR PACK
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-[440px] mb-9"
            >
              RiderConnect keeps your entire group in sync — whether you&apos;re on a highway convoy, mountain trail, or city commute. Get instant alerts the moment someone deviates from the route.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex gap-3.5 flex-wrap"
            >
              <Link href={user ? "/dashboard" : "/sign-up"}>
                <Button size="lg" className="bg-teal text-teal-foreground hover:bg-teal/90 shadow-glow-teal font-semibold px-7 gap-2 text-[15px] h-12">
                  <Navigation size={16} />
                  {user ? "Go to Dashboard" : "Start Tracking Free"}
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-border/60 hover:border-teal/40 hover:text-teal font-medium px-7 text-[15px] h-12">
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex gap-6 mt-9 flex-wrap"
            >
              {[["12k+", "Riders"], ["99.9%", "Uptime"], ["<2s", "Alert Latency"]].map(([v, l]) => (
                <div key={l}>
                  <div className="font-mono text-xl font-semibold">{v}</div>
                  <div className="text-xs text-muted-foreground">{l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Live Demo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="hidden lg:block"
          >
            <LiveAlertDemo />
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown size={22} className="text-muted-foreground" />
        </motion.div>
      </section>

      {/* ══════════════════════ STATS TICKER ══════════════════════ */}
      <StatsTicker />

      {/* ══════════════════════ FEATURES ══════════════════════ */}
      <section id="features" className="py-20 md:py-28 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="font-mono text-xs text-teal tracking-[3px] mb-3">CAPABILITIES</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              BUILT FOR THE ROAD
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-[15px] leading-relaxed">
              Every feature designed around the real challenges of group travel — from mountain highways to urban streets.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={Bell} color="amber" badge="CORE"
              title="Threshold Distance Alerts"
              desc="Set a custom radius — anyone who strays beyond it triggers an instant notification to the entire group. No one gets left behind." />
            <FeatureCard icon={MapPin} color="teal" badge="CORE"
              title="Live Route Tracking"
              desc="See every rider's real-time position on an interactive map, updated every few seconds with sub-10-meter GPS accuracy." />
            <FeatureCard icon={WifiOff} color="violet"
              title="Network Loss Detection"
              desc="When a rider loses signal, the group is alerted immediately with their last known position — not left guessing." />
            <FeatureCard icon={MessageSquare} color="pink"
              title="In-Ride Group Chat"
              desc="Text your group without switching apps. Hands-free voice messages coming soon for safer communication while riding." />
            <FeatureCard icon={Shield} color="teal"
              title="Privacy Controls"
              desc="Pause your location at any time. Location data is end-to-end encrypted and never sold or shared outside your group." />
            <FeatureCard icon={Users} color="amber"
              title="Instant Invite Codes"
              desc="Share a 6-character code or link — riders join in seconds without needing an account download first." />
          </div>
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section id="how-it-works" className="py-20 md:py-28 px-6 md:px-8 bg-card/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="font-mono text-xs text-teal tracking-[3px] mb-3">WORKFLOW</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
              RIDE IN 3 STEPS
            </h2>
          </motion.div>

          <div className="relative">
            {/* Connector line */}
            <div className="absolute top-9 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-teal to-transparent opacity-25 hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              <Step num={1} icon={Users} title="Create a Group" delay={0}
                desc="Name your group, set the route, define the threshold distance, and pick a start time." />
              <Step num={2} icon={UserPlus} title="Invite Riders" delay={0.2}
                desc="Share the 6-character code or link. Friends join in one tap — no app download required for guests." />
              <Step num={3} icon={Navigation} title="Ride Together" delay={0.4}
                desc="Everyone's position appears live on your map. Alerts fire the instant anyone drifts too far." />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ THRESHOLD EXPLAINER ══════════════════════ */}
      <section className="py-20 md:py-28 px-6 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
          >
            <p className="font-mono text-xs text-amber tracking-[3px] mb-3">THE KEY FEATURE</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1] mb-5">
              THRESHOLD<br /><span className="text-teal">DISTANCE</span><br />ALERTS
            </h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed mb-6">
              Set a maximum separation distance for your group — say, 2 km. The moment any rider exceeds that distance from the main cluster, every member gets an alert with the deviated rider&apos;s name and last known location.
            </p>
            <div className="flex flex-col gap-3.5">
              {[
                { label: "Instant push + in-app notifications", color: "bg-teal" },
                { label: "Shows exact deviation in km", color: "bg-teal" },
                { label: "Works even when rider loses signal", color: "bg-amber" },
                { label: "Configurable per group, per ride", color: "bg-teal" },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${color} flex-shrink-0`} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            className="glass-card p-8 text-center"
          >
            <div className="relative h-[260px] flex items-center justify-center">
              {[120, 88, 56].map((size, i) => (
                <div key={size} className="absolute rounded-full" style={{
                  width: size, height: size,
                  border: `1px solid hsl(var(--teal) / ${0.1 + i * 0.1})`,
                  background: i === 2 ? "hsl(var(--teal) / 0.05)" : "transparent",
                }} />
              ))}
              {/* Center rider */}
              <div className="w-9 h-9 rounded-full bg-teal/20 border-2 border-teal flex items-center justify-center z-[2]">
                <span className="text-xs font-bold font-mono text-teal">G</span>
              </div>
              {/* Outside rider */}
              <motion.div
                animate={{ x: [60, 75, 60], y: [30, 40, 30] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute"
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-amber/20 border-2 border-amber flex items-center justify-center">
                    <span className="text-[10px] font-bold font-mono text-amber">R</span>
                  </div>
                  <div className="absolute -inset-1 rounded-full border-2 border-amber" style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
                </div>
              </motion.div>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="font-mono text-[11px] text-amber">THRESHOLD EXCEEDED</span>
              </div>
            </div>
            <div className="glass-card px-4 py-3 text-left mt-2">
              <span className="font-mono text-[11px] text-amber">⚠ Rahul is 2.3 km away from group center</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ FAQ ══════════════════════ */}
      <section id="faq" className="py-20 md:py-28 px-6 md:px-8 bg-card/50">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="font-mono text-xs text-teal tracking-[3px] mb-3">FAQ</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">COMMON QUESTIONS</h2>
          </motion.div>

          <FAQItem q="Is my location data secure?"
            a="Yes. Location data is encrypted in transit using TLS and is only ever shared with members inside your group. You can pause sharing at any time, and we never sell location data to third parties." />
          <FAQItem q="How accurate is the tracking?"
            a="We use your device's GPS, which is typically accurate to within 5–10 meters in open areas. We apply smoothing algorithms to reduce jitter, so the map stays clean even in urban canyons." />
          <FAQItem q="What happens when someone loses mobile signal?"
            a="The app stores the rider's last known location and immediately notifies the group with a 'signal lost' alert. Once connectivity is restored, the location updates automatically." />
          <FAQItem q="Can I use this for a solo trip?"
            a="Absolutely. You can create a solo group and share your live location with family or friends who don't need to install anything — they can view your position via a web link." />
          <FAQItem q="How many riders can I track at once?"
            a="The free plan supports up to 10 riders per group. Premium plans support 100+ members, with advanced analytics, custom branding, and priority support for large events." />
          <FAQItem q="Does it work internationally?"
            a="Yes — RiderConnect works anywhere with GPS and mobile data. There are no geo-restrictions. Standard carrier data roaming rates may apply when abroad." />
        </div>
      </section>

      {/* ══════════════════════ CTA ══════════════════════ */}
      <section className="py-20 md:py-28 px-6 md:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[400px] rounded-full bg-gradient-radial from-teal/[0.07] to-transparent" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <p className="font-mono text-xs text-teal tracking-[3px] mb-4">GET STARTED TODAY</p>
          <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-5">
            READY TO ROLL?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-base leading-relaxed mb-10">
            Join thousands of riders who never lose sight of their group. Free to start, no credit card needed.
          </p>
          <Link href={user ? "/dashboard" : "/sign-up"}>
            <Button size="lg" className="bg-teal text-teal-foreground hover:bg-teal/90 shadow-glow-teal font-semibold px-8 py-2 gap-2 text-base h-13 hover:transition-shadow">
              <Navigation size={18} />
              {user ? "Go to Dashboard" : "Create Free Account"}
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="border-t border-border/50 pt-12 pb-8 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <Navigation size={20} className="text-teal" />
                <span className="font-display text-xl font-bold tracking-tight">
                  RIDER<span className="text-teal">CONNECT</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                Stay connected with your group, wherever the road takes you.
              </p>
            </div>
            {/* Link columns */}
            {[
              ["Product", ["Features", "Pricing", "Download", "Changelog"]],
              ["Company", ["About", "Blog", "Careers", "Press"]],
              ["Support", ["Documentation", "Contact", "Status", "Community"]],
              ["Legal", ["Privacy", "Terms", "Cookies", "Security"]],
            ].map(([heading, links]) => (
              <div key={heading as string}>
                <h4 className="font-mono text-xs font-semibold tracking-wider mb-3.5">{heading as string}</h4>
                <ul className="flex flex-col gap-2.5">
                  {(links as string[]).map(l => (
                    <li key={l}>
                      <a href="#" className="text-xs text-muted-foreground hover:text-teal transition-colors duration-200">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <hr className="hr-glow" />
          <div className="mt-6 flex justify-between items-center flex-wrap gap-3">
            <span className="font-mono text-xs text-muted-foreground">© 2026 RiderConnect. All rights reserved.</span>
            <span className="font-mono text-xs text-muted-foreground">Made for riders, by riders. 🏍</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
