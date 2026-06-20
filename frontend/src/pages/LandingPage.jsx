import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CalendarCheck,
  ChefHat,
  Check,
  ChevronRight,
  Coffee,
  CreditCard,
  Database,
  Grid3X3,
  Layers,
  LockKeyhole,
  Menu,
  MonitorSmartphone,
  Receipt,
  ShieldCheck,
  Sparkles,
  Table2,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

const modules = [
  {
    icon: MonitorSmartphone,
    title: "Employee POS Terminal",
    desc: "Fast product selection, table orders, cart, discounts, kitchen sending, and payment collection.",
    tag: "Cashier",
  },
  {
    icon: ChefHat,
    title: "Kitchen Display System",
    desc: "Real-time order tickets with To Cook, Preparing, and Completed workflow using Socket.IO.",
    tag: "Kitchen",
  },
  {
    icon: ShieldCheck,
    title: "Admin Backend",
    desc: "Manage products, categories, tables, employees, coupons, bookings, payments, and reports.",
    tag: "Admin",
  },
  {
    icon: Table2,
    title: "Floor & Table Manager",
    desc: "Interactive table view with available, occupied, reserved, and payment pending states.",
    tag: "Tables",
  },
  {
    icon: CreditCard,
    title: "Payments & Receipts",
    desc: "Cash, Card, and UPI payment workflow with receipt generation and print-ready billing.",
    tag: "Billing",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    desc: "Track revenue, top products, order trends, payment history, and daily cafe performance.",
    tag: "Reports",
  },
];

const workflow = [
  "Login",
  "Open Session",
  "Select Table",
  "Add Products",
  "Send Kitchen",
  "Kitchen Ready",
  "Collect Payment",
  "Print Receipt",
];

const aiFeatures = [
  {
    title: "AI Sales Insights",
    desc: "Detect best-selling products, slow movers, and revenue trends from MongoDB order data.",
  },
  {
    title: "Smart Combo Suggestions",
    desc: "Recommend combo offers like Burger + Cold Coffee using product purchase patterns.",
  },
  {
    title: "Low Stock Prediction",
    desc: "Warn admin when high-selling products may run out soon during peak hours.",
  },
  {
    title: "Peak Hour Forecast",
    desc: "Analyze order timestamps and predict busy cafe time slots for better staff planning.",
  },
  {
    title: "Smart Coupon Ideas",
    desc: "Suggest discounts for slow-moving categories or repeat customers.",
  },
  {
    title: "Customer Preference Hints",
    desc: "Help cashiers suggest favorite items for returning customers.",
  },
];

const techStack = [
  "MongoDB",
  "Express.js",
  "React.js",
  "Node.js",
  "Socket.IO",
  "JWT + bcrypt",
  "Tailwind CSS",
];

function SectionBadge({ icon: Icon, children, tone = "orange" }) {
  const toneClass =
    tone === "purple"
      ? "border-violet-500/25 bg-violet-500/10 text-violet-300"
      : tone === "green"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
      : "border-orange-500/25 bg-orange-500/10 text-orange-300";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] ${toneClass}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </div>
  );
}

function ModuleCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="group rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-orange-500/35 hover:bg-white/[0.06]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-300 transition group-hover:bg-orange-500 group-hover:text-white">
          <Icon className="h-7 w-7" />
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
          {item.tag}
        </span>
      </div>

      <h3 className="text-lg font-black text-white">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{item.desc}</p>
    </div>
  );
}

function POSMockup() {
  const products = [
    ["Cold Coffee", "₹150", "Coffee"],
    ["French Fries", "₹90", "Snacks"],
    ["Veg Sandwich", "₹110", "Snacks"],
    ["Masala Tea", "₹40", "Tea"],
  ];

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-orange-500/15 via-violet-500/10 to-emerald-500/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b101a] shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>

          <div className="hidden rounded-full border border-white/10 bg-black/20 px-4 py-1 text-xs font-bold text-slate-500 md:block">
            cafeflow-pos.local/workspace
          </div>

          <div className="text-xs font-black text-orange-400">LIVE POS</div>
        </div>

        <div className="grid min-h-[420px] grid-cols-1 lg:grid-cols-[1fr_0.68fr_0.48fr]">
          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                  Products
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  Cafe Menu
                </h3>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300">
                Table T4
              </div>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {["All", "Coffee", "Tea", "Snacks"].map((tab, index) => (
                <div
                  key={tab}
                  className={`rounded-2xl px-4 py-2 text-xs font-black ${
                    index === 0
                      ? "bg-orange-500 text-white"
                      : "border border-white/10 bg-white/5 text-slate-400"
                  }`}
                >
                  {tab}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {products.map(([name, price, category]) => (
                <div
                  key={name}
                  className="rounded-3xl border border-white/10 bg-[#101826] p-4"
                >
                  <div className="flex h-24 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-violet-500/20">
                    <Coffee className="h-10 w-10 text-orange-300" />
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-white">{name}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {category}
                      </p>
                    </div>

                    <p className="font-mono text-sm font-black text-orange-400">
                      {price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
                  Order
                </p>
                <h3 className="mt-1 text-xl font-black text-white">
                  Current Bill
                </h3>
              </div>

              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-300">
                In Kitchen
              </span>
            </div>

            <div className="space-y-3">
              {[
                ["1x Cold Coffee", "₹150"],
                ["2x French Fries", "₹180"],
                ["1x Masala Tea", "₹40"],
              ].map(([item, price]) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] p-4"
                >
                  <p className="font-bold text-slate-200">{item}</p>
                  <p className="font-mono font-black text-white">{price}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span>₹370.00</span>
              </div>

              <div className="mt-2 flex justify-between text-sm text-slate-400">
                <span>GST 5%</span>
                <span>₹18.50</span>
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex justify-between text-xl font-black text-white">
                  <span>Total</span>
                  <span className="text-orange-400">₹388.50</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
              Payment
            </p>

            <h3 className="mt-1 text-xl font-black text-white">
              Smart Checkout
            </h3>

            <div className="mt-5 space-y-3">
              {[
                ["Card", CreditCard],
                ["Cash", WalletCards],
                ["UPI", Receipt],
              ].map(([label, Icon], index) => (
                <div
                  key={label}
                  className={`flex items-center justify-between rounded-2xl border p-4 ${
                    index === 0
                      ? "border-orange-500/35 bg-orange-500/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-black">{label}</span>
                  </div>

                  {index === 0 && <Check className="h-5 w-5 text-orange-400" />}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <p className="text-sm font-black text-emerald-300">
                Kitchen Completed
              </p>
              <p className="mt-2 text-xs leading-6 text-emerald-100/70">
                Payment unlocks only after KDS marks the order completed.
              </p>
            </div>

            <button className="mt-5 w-full rounded-2xl bg-emerald-500 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20">
              Pay ₹388.50
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const goTo = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const scrollTo = (id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05070d] text-white selection:bg-orange-500 selection:text-white">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-140px] top-20 h-[450px] w-[450px] rounded-full bg-orange-500/20 blur-[140px]" />
        <div className="absolute right-[-160px] top-[-120px] h-[520px] w-[520px] rounded-full bg-violet-600/15 blur-[150px]" />
        <div className="absolute bottom-[-180px] left-1/2 h-[460px] w-[460px] rounded-full bg-emerald-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />
      </div>

      {/* navbar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#05070d]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <button
            onClick={() => scrollTo("home")}
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25">
              <Coffee className="h-6 w-6 text-white" />
            </div>

            <div className="text-left">
              <p className="text-lg font-black leading-5">
                CafeFlow <span className="text-orange-500">POS</span>
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
                MERN System
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-8 text-sm font-bold text-slate-400 lg:flex">
            <button onClick={() => scrollTo("features")} className="hover:text-white">
              Features
            </button>
            <button onClick={() => scrollTo("workflow")} className="hover:text-white">
              Workflow
            </button>
            <button onClick={() => scrollTo("ai")} className="hover:text-white">
              AI Copilot
            </button>
            <button onClick={() => scrollTo("tech")} className="hover:text-white">
              Tech Stack
            </button>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={() => goTo("/login")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Sign In
            </button>

            <button
              onClick={() => goTo("/signup")}
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/25 transition hover:brightness-110"
            >
              Create Account
            </button>
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#080b13] px-5 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => scrollTo("features")}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-300 hover:bg-white/5"
              >
                Features
              </button>

              <button
                onClick={() => scrollTo("workflow")}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-300 hover:bg-white/5"
              >
                Workflow
              </button>

              <button
                onClick={() => scrollTo("ai")}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-300 hover:bg-white/5"
              >
                AI Copilot
              </button>

              <button
                onClick={() => scrollTo("tech")}
                className="rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-300 hover:bg-white/5"
              >
                Tech Stack
              </button>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => goTo("/login")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white"
                >
                  Sign In
                </button>

                <button
                  onClick={() => goTo("/signup")}
                  className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-black text-white"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10">
        {/* hero */}
        <section
          id="home"
          className="mx-auto max-w-7xl px-5 pb-20 pt-16 text-center lg:px-8 lg:pb-28 lg:pt-24"
        >
          <SectionBadge icon={Sparkles}>Odoo-style MERN Restaurant POS</SectionBadge>

          <h1 className="mx-auto mt-8 max-w-5xl text-5xl font-black leading-[1.04] tracking-tight md:text-7xl">
            Modern Cafe & Restaurant{" "}
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 bg-clip-text text-transparent">
              POS System
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">
            A professional full-stack POS platform for cafes and restaurants:
            table orders, product images, real-time kitchen display, payments,
            receipts, admin backend, reports, and AI-powered business insights.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => goTo("/login")}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 transition hover:-translate-y-0.5 hover:brightness-110 sm:w-auto"
            >
              Launch POS Workspace
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => scrollTo("features")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto"
            >
              Explore Modules
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Live", "Kitchen"],
              ["3", "User Roles"],
              ["MERN", "Full Stack"],
              ["AI", "Insights"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5"
              >
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <POSMockup />
          </div>
        </section>

        {/* features */}
        <section id="features" className="border-y border-white/10 bg-white/[0.025] py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <SectionBadge icon={Grid3X3}>Platform Modules</SectionBadge>

              <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
                Everything a cafe needs in one system
              </h2>

              <p className="mt-4 text-base leading-8 text-slate-400">
                CafeFlow is divided into role-based modules so every user gets a
                clean, focused, and fast workflow.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((item) => (
                <ModuleCard key={item.title} item={item} />
              ))}
            </div>
          </div>
        </section>

        {/* workflow */}
        <section id="workflow" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#101827] to-[#070b12] p-8 lg:p-10">
            <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <SectionBadge icon={Activity}>Real POS Flow</SectionBadge>

                <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
                  From table selection to receipt
                </h2>

                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">
                  The full cashier workflow is connected with MongoDB, Express
                  APIs, and Socket.IO live kitchen updates.
                </p>
              </div>

              <button
                onClick={() => goTo("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-400"
              >
                Start Flow
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {workflow.map((step, index) => (
                <div
                  key={step}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-orange-500/35 hover:bg-orange-500/5"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-sm font-black text-orange-300 group-hover:bg-orange-500 group-hover:text-white">
                    {index + 1}
                  </div>

                  <p className="font-black text-white">{step}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {index === 0 && "Role-based secure access."}
                    {index === 1 && "Open daily POS session."}
                    {index === 2 && "Choose floor and table."}
                    {index === 3 && "Add menu items to cart."}
                    {index === 4 && "Send ticket to kitchen."}
                    {index === 5 && "Kitchen marks completed."}
                    {index === 6 && "Cash, Card, or UPI payment."}
                    {index === 7 && "Generate customer receipt."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI */}
        <section id="ai" className="border-y border-white/10 bg-[#080d17] py-20">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
            <div>
              <SectionBadge icon={BrainCircuit} tone="purple">
                AI Copilot
              </SectionBadge>

              <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
                Smart insights from your cafe data
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-400">
                AI features can be powered by MongoDB order, product, customer,
                and payment data. Start with rule-based insights now, then add
                external AI later if needed.
              </p>

              <div className="mt-7 space-y-3">
                {[
                  "No fake data required for dashboard insights.",
                  "Works with MongoDB orders and product collections.",
                  "Safe fallback when there are no orders yet.",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                      <Check className="h-4 w-4 text-orange-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {aiFeatures.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5 transition hover:border-violet-500/35 hover:bg-violet-500/5"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                    <BrainCircuit className="h-5 w-5" />
                  </div>

                  <h3 className="font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* tech */}
        <section id="tech" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <SectionBadge icon={Database} tone="green">
              Full Stack Architecture
            </SectionBadge>

            <h2 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
              Built with clean MERN stack
            </h2>

            <p className="mt-4 text-base leading-8 text-slate-400">
              No Supabase or Firebase. The system uses your own Node backend,
              MongoDB database, and React frontend.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
            {techStack.map((tech) => (
              <div
                key={tech}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center transition hover:border-emerald-500/35 hover:bg-emerald-500/5"
              >
                <BadgeCheck className="mx-auto mb-3 h-6 w-6 text-emerald-300" />
                <p className="text-sm font-black text-white">{tech}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-orange-500/20 bg-gradient-to-br from-orange-500/15 to-orange-500/5 p-8 text-center lg:p-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Zap className="h-8 w-8" />
            </div>

            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              Ready to run CafeFlow POS?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Login as admin, cashier, or kitchen staff and test the complete
              order-to-payment workflow.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <button
                onClick={() => goTo("/login")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 transition hover:bg-orange-400"
              >
                Sign In
                <LockKeyhole className="h-5 w-5" />
              </button>

              <button
                onClick={() => goTo("/signup")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-base font-black text-white transition hover:bg-white/10"
              >
                Create Account
                <Users className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-[#03050a]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-sm text-slate-500 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-orange-500" />
            <span className="font-bold">CafeFlow POS</span>
          </div>

          <p>MERN Stack Restaurant POS System • Hackathon Ready</p>
        </div>
      </footer>
    </div>
  );
}