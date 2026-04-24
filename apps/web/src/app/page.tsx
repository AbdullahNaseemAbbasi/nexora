"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Users,
  BarChart3,
  FolderKanban,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FolderKanban, 
    title: "Project Management", 
    description: "Organize tasks with Kanban boards, timelines, and custom workflows.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered", 
    description: "Get smart task suggestions, meeting summaries, and project insights.",
  },
  { 
    icon: Users,
    title: "Multi-Tenant", 
    description: "Each organization gets its own isolated workspace with role-based access.",
  },
  { 
    icon: Shield,
    title: "Secure by Default", 
    description: "Enterprise-grade security with JWT auth and encrypted data.",
  },
  { 
    icon: BarChart3,
    title: "Analytics", 
    description: "Track progress with real-time dashboards and detailed reports.",
  },
  { 
    icon: Zap,
    title: "Real-Time", 
    description: "Instant updates across your team with WebSocket notifications.",
  },
]; 

const plans = [
  { 
    name: "Free", 
    price: "$0",
    description: "For small teams getting started",
    features: ["3 team members", "2 projects", "Basic AI features", "500MB storage"],
  },
  {  
    name: "Pro",
    price: "$29",
    description: "For growing teams",
    features: ["20 team members", "Unlimited projects", "Full AI features", "10GB storage"],
    popular: true,
  },
  {  
    name: "Enterprise",
    price: "$99",
    description: "For large organizations",
    features: ["Unlimited members", "Unlimited everything", "Priority AI", "Custom branding"],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="px-6 sm:px-10 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-foreground rounded flex items-center justify-center">
              <span className="text-background text-xs font-bold">N</span>
            </div>
            <span className="font-semibold">Nexora</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[13px]">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-[13px]">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3 w-3" />
            Now with AI-powered task suggestions
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15]">
            Project management<br />
            <span className="text-muted-foreground">that actually works</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Nexora helps teams plan, track, and deliver projects with AI-powered
            tools. Built for modern teams who value clarity.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="text-sm px-6 w-full sm:w-auto">
                Start for free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-sm px-6 w-full sm:w-auto">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Everything you need</h2>
            <p className="text-muted-foreground mt-2">
              Powerful features to help your team deliver better, faster.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-5 rounded-lg border border-border hover:border-foreground/20 transition-colors"
              >
                <feature.icon className="h-5 w-5 mb-3 text-foreground/70" strokeWidth={1.75} />
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-20 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Simple pricing</h2>
            <p className="text-muted-foreground mt-2">
              Start free. Upgrade when you need to.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-lg border transition-colors ${
                  plan.popular
                    ? "border-foreground/30 ring-1 ring-foreground/10"
                    : "border-border hover:border-foreground/20"
                }`}
              >
                {plan.popular && (
                  <span className="text-[11px] font-medium bg-foreground text-background px-2 py-0.5 rounded-full">
                    Popular
                  </span>
                )}
                <h3 className="font-semibold mt-3">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1">{plan.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-foreground/50" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <Button
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full mt-6 text-[13px]"
                    size="sm"
                  >
                    Get started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-foreground rounded flex items-center justify-center">
              <span className="text-background text-[10px] font-bold">N</span>
            </div>
            <span className="text-sm font-medium">Nexora</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built by Abdullah Naseem Abbasi
          </p>
        </div>
      </footer>
    </div>
  );
}
