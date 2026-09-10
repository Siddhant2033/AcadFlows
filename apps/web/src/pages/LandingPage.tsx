import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import ThemeToggle from "../components/ThemeToggle"

type StatItem = {
    icon: string
    label: string
    target: number
    suffix: "+" | "K+"
}

type FeatureItem = {
    icon: string
    title: string
    description: string
}

type BenefitItem = {
    icon: string
    title: string
    description: string
}

type TestimonialItem = {
    quote: string
    name: string
    role: string
    avatar: string
}

type DashboardMenuItem = {
    icon: string
    label: string
    active?: boolean
}

type DashboardActivity = {
    time: string
    text: string
}

const STATS: StatItem[] = [
    { icon: "⌂", label: "Schools", target: 500, suffix: "+" },
    { icon: "◉", label: "Students", target: 50, suffix: "K+" },
    { icon: "◇", label: "Teachers", target: 10, suffix: "K+" },
    { icon: "◎", label: "Cities", target: 25, suffix: "+" },
]

const FEATURES: FeatureItem[] = [
    {
        icon: "▦",
        title: "Academic Management",
        description:
            "Classes, subjects, timetables, and assignments.",
    },
    {
        icon: "◌",
        title: "Student & Teacher Portal",
        description:
            "Focused portals for every role.",
    },
    {
        icon: "₹",
        title: "Fee Management",
        description:
            "Payments, invoices, fees, and reminders.",
    },
    {
        icon: "◫",
        title: "Analytics & Reports",
        description:
            "Clear insights and student performance.",
    },
    {
        icon: "✓",
        title: "Attendance Tracking",
        description:
            "Attendance, reports, and parent alerts.",
    },
    {
        icon: "⌁",
        title: "Smart Communication",
        description:
            "Announcements and real-time messaging.",
    },
]

const BENEFITS: BenefitItem[] = [
    {
        icon: "IN",
        title: "India-First",
        description: "Designed for Indian schools, boards, and education system",
    },
    {
        icon: "₹",
        title: "Affordable Pricing",
        description: "Starting at just ₹999/month for schools of all sizes",
    },
    {
        icon: "↗",
        title: "Mobile Friendly",
        description: "Access from any device - phone, tablet, or desktop",
    },
    {
        icon: "⌑",
        title: "Secure & Private",
        description: "Data privacy with Indian servers and compliance",
    },
]

const TESTIMONIALS: TestimonialItem[] = [
    {
        quote:
            '"AcadFlows has transformed how we manage our school. From attendance to fee collection, everything is now paperless and efficient. Our parents love the transparency."',
        name: "Dr. Rajesh Kumar",
        role: "Principal, Delhi Public School",
        avatar: "RK",
    },
    {
        quote:
            '"I can track my child\'s attendance, grades, and fee status in real-time. The mobile-friendly interface makes it so easy to stay connected with the school."',
        name: "Mrs. Priya Sharma",
        role: "Parent, Class 5",
        avatar: "PS",
    },
    {
        quote:
            '"Creating assignments, grading submissions, and managing my timetable has never been easier. The platform saves me hours of administrative work every week."',
        name: "Mr. Amit Patel",
        role: "Teacher, Mathematics",
        avatar: "AP",
    },
]

const DASHBOARD_MENU: DashboardMenuItem[] = [
    { icon: "⌂", label: "Overview", active: true },
    { icon: "◫", label: "Analytics" },
    { icon: "✓", label: "Attendance" },
    { icon: "₹", label: "Fees" },
    { icon: "▤", label: "Assignments" },
]

const DASHBOARD_ACTIVITY: DashboardActivity[] = [
    { time: "09:10 AM", text: "Attendance updated for Class 8A" },
    { time: "10:20 AM", text: "Fee payment received - 24 entries" },
    { time: "11:35 AM", text: "Mathematics assignment published" },
]

function ArrowIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M4 10h11M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="m4 10 3.5 3.5L16 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

function SparkleIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M10 2l1.5 5.5L17 9l-5.5 1.5L10 16l-1.5-5.5L3 9l5.5-1.5L10 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
    )
}

export default function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [activeTestimonial, setActiveTestimonial] = useState(0)
    const [hasAnimatedStats, setHasAnimatedStats] = useState(false)
    const [statValues, setStatValues] = useState<number[]>([0, 0, 0, 0])
    const statsRef = useRef<HTMLElement>(null)
    const statsTriggeredRef = useRef(false)

    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) setMenuOpen(false)
        }

        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [])

    useEffect(() => {
        const element = statsRef.current
        if (!element || hasAnimatedStats) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !statsTriggeredRef.current) {
                        statsTriggeredRef.current = true
                        setHasAnimatedStats(true)
                    }
                })
            },
            { threshold: 0.3 }
        )

        observer.observe(element)
        return () => observer.disconnect()
    }, [hasAnimatedStats])

    useEffect(() => {
        if (!hasAnimatedStats) return

        const duration = 2000
        const start = performance.now()
        let frame = 0

        const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            setStatValues(STATS.map((item) => Math.round(item.target * progress)))

            if (progress < 1) {
                frame = window.requestAnimationFrame(step)
            }
        }

        frame = window.requestAnimationFrame(step)
        return () => window.cancelAnimationFrame(frame)
    }, [hasAnimatedStats])

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
        }, 5000)

        return () => window.clearInterval(intervalId)
    }, [])

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#f7f9fc] text-slate-950 dark:bg-slate-950 dark:text-white">
            <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80">
                <nav
                    className="mx-auto flex h-[72px] w-full w-full items-center justify-between px-5 sm:px-7 lg:px-8"
                    aria-label="Main navigation"
                >
                    <Link
                        to="/"
                        className="group inline-flex items-center gap-2.5 text-[21px] font-black tracking-[-0.03em]"
                    >
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-[15px] text-white shadow-sm transition group-hover:scale-105 dark:bg-white dark:text-slate-950">
                            AF
                        </span>
                        <span>
                            Acad<span className="text-blue-600 dark:text-blue-400">Flows</span>
                        </span>
                    </Link>

                    <div className="hidden items-center gap-2 md:flex">
                        <a href="#features" className="rounded-lg px-3 py-2 text-[15px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
                            Features
                        </a>
                        <a href="#why-us" className="rounded-lg px-3 py-2 text-[15px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
                            Why AcadFlows
                        </a>
                        <a href="#stories" className="rounded-lg px-3 py-2 text-[15px] font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white">
                            Stories
                        </a>
                        <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-white/10" />
                        <ThemeToggle />
                        <Link
                            to="/login"
                            className="rounded-xl px-4 py-2.5 text-[15px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/register"
                            className="rounded-xl bg-slate-950 px-5 py-2.5 text-[15px] font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-600 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-400"
                        >
                            Get started
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button
                            type="button"
                            aria-label="Toggle mobile menu"
                            aria-expanded={menuOpen}
                            aria-controls="mobile-main-menu"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-lg dark:border-white/10"
                        >
                            {menuOpen ? "✕" : "☰"}
                        </button>
                    </div>
                </nav>

                {menuOpen && (
                    <div id="mobile-main-menu" className="border-t border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-slate-950 md:hidden">
                        <div className="flex flex-col gap-1">
                            <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[15px] font-semibold">Features</a>
                            <a href="#why-us" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[15px] font-semibold">Why AcadFlows</a>
                            <a href="#stories" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[15px] font-semibold">Stories</a>
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-3 text-[15px] font-semibold">Sign In</Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)} className="mt-1 rounded-xl bg-slate-950 px-3 py-3 text-center text-[15px] font-bold text-white dark:bg-white dark:text-slate-950">Get started</Link>
                        </div>
                    </div>
                )}
            </header>

            <main>
                <section className="relative overflow-hidden bg-white dark:bg-slate-950">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute left-[-10%] top-20 h-[420px] w-[420px] rounded-full bg-blue-500/15 blur-[110px]" />
                        <div className="absolute right-[-5%] top-10 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
                        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:48px_48px] dark:opacity-[0.07] dark:[background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)]" />
                    </div>

                    <div className="relative mx-auto grid w-full w-full gap-14 px-5 pb-20 pt-16 sm:px-7 sm:pt-20 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-8 lg:pb-20 lg:pt-20">
                        <div className="lg:col-span-4">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[13px] font-bold text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                                <SparkleIcon />
                                Built for modern Indian schools
                            </div>

                            <h1 className="max-w-2xl text-[3rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-[4.15rem] lg:text-[4.6rem]">
                                Run your school
                                <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                    without the chaos.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-xl text-[17px] leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">
                                One simple platform for academics, attendance, fees, communication, and performance. Give your team more time to focus on what actually matters - students.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Link
                                    to="/register"
                                    className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-slate-950/15 transition hover:-translate-y-1 hover:bg-blue-600 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-400"
                                >
                                    Start free
                                    <ArrowIcon />
                                </Link>
                                <Link
                                    to="/school/register"
                                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-[15px] font-bold text-slate-800 transition hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                >
                                    Register your school
                                </Link>
                            </div>

                            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1.5"><CheckIcon /> No credit card required</span>
                                <span className="inline-flex items-center gap-1.5"><CheckIcon /> 30-day free trial</span>
                                <span className="inline-flex items-center gap-1.5"><CheckIcon /> Cancel anytime</span>
                            </div>
                        </div>

                        <div className="relative lg:col-span-8">
                            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-500/25 via-indigo-500/10 to-violet-500/20 blur-3xl" />
                            <div className="relative rounded-[1.7rem] border border-slate-200/80 bg-white/90 p-2 shadow-[0_35px_100px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 sm:p-3">
                                <div className="overflow-hidden rounded-[1.2rem] border border-slate-200 bg-[#f8fafc] dark:border-white/10 dark:bg-slate-950">
                                    <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-white/10 dark:bg-slate-900">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                                            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                                        </div>
                                        <span className="rounded-md bg-slate-100 px-3 py-1 text-[12px] font-bold text-slate-500 dark:bg-white/5 dark:text-slate-400">
                                            acadflows.app
                                        </span>
                                        <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-white/10" />
                                    </div>

                                    <div className="grid min-h-[390px] grid-cols-12">
                                        <aside className="col-span-3 hidden border-r border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900 sm:block">
                                            <div className="mb-6 flex items-center gap-2 px-1">
                                                <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-[10px] font-black text-white">AF</div>
                                                <span className="text-[12px] font-black">AcadFlows</span>
                                            </div>
                                            <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">Workspace</p>
                                            <ul className="space-y-1">
                                                {DASHBOARD_MENU.map((item) => (
                                                    <li key={item.label}>
                                                        <button
                                                            type="button"
                                                            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] font-semibold ${
                                                                item.active
                                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
                                                                    : "text-slate-500 dark:text-slate-400"
                                                            }`}
                                                        >
                                                            <span className="grid h-5 w-5 place-items-center rounded-md bg-slate-100 text-[10px] dark:bg-white/5">{item.icon}</span>
                                                            {item.label}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </aside>

                                        <section className="col-span-12 p-4 sm:col-span-9 sm:p-5">
                                            <div className="mb-5 flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Overview</p>
                                                    <h2 className="mt-1 text-[1.35rem] font-black tracking-tight sm:text-2xl">Good morning, Admin</h2>
                                                    <p className="mt-1 text-[12px] text-slate-500">Here is what is happening at your school today.</p>
                                                </div>
                                                <div className="hidden rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 sm:block dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                                                    Sep 10, 2026
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                                {[
                                                    ["Students", "2,486", "+8.2%", "blue"],
                                                    ["Attendance", "94.8%", "+2.4%", "emerald"],
                                                    ["Fees collected", "₹3.24L", "+12.6%", "violet"],
                                                    ["Assignments", "248", "+18", "amber"],
                                                ].map(([label, value, change, tone]) => (
                                                    <article key={label} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-900">
                                                        <div className={`mb-3 h-1.5 w-7 rounded-full ${tone === "blue" ? "bg-blue-500" : tone === "emerald" ? "bg-emerald-500" : tone === "violet" ? "bg-violet-500" : "bg-amber-500"}`} />
                                                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
                                                        <p className="mt-1 text-[17px] font-black tracking-tight sm:text-lg">{value}</p>
                                                        <p className="mt-0.5 text-[9px] font-bold text-emerald-600">{change}</p>
                                                    </article>
                                                ))}
                                            </div>

                                            <div className="mt-3 grid gap-3 sm:grid-cols-5">
                                                <article className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-3 dark:border-white/10 dark:bg-slate-900">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[12px] font-black">Attendance trend</p>
                                                        <span className="text-[9px] font-bold text-slate-400">Last 7 days</span>
                                                    </div>
                                                    <div className="mt-5 flex h-28 items-end gap-2">
                                                        {[42, 61, 54, 73, 68, 87, 79, 94, 84].map((height, index) => (
                                                            <div key={index} className="flex flex-1 items-end">
                                                                <div className={`w-full rounded-t-md ${index === 7 ? "bg-blue-600" : "bg-blue-100 dark:bg-blue-500/20"}`} style={{ height: `${height}%` }} />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </article>

                                                <article className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2 dark:border-white/10 dark:bg-slate-900">
                                                    <p className="text-[12px] font-black">Recent activity</p>
                                                    <ul className="mt-4 space-y-3">
                                                        {DASHBOARD_ACTIVITY.map((item) => (
                                                            <li key={`${item.time}-${item.text}`} className="flex gap-2">
                                                                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-slate-400">{item.time}</p>
                                                                    <p className="mt-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">{item.text}</p>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </article>
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:flex sm:items-center sm:gap-3 dark:border-white/10 dark:bg-slate-900">
                                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10">✓</div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400">Today</p>
                                    <p className="text-[13px] font-black">94.8% attendance</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section ref={statsRef} className="border-y border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/50">
                    <div className="mx-auto grid w-full grid-cols-2 lg:grid-cols-4">
                        {STATS.map((item, index) => {
                            const current = statValues[index] ?? 0
                            const display = item.suffix === "K+" ? `${current}K+` : `${current}+`

                            return (
                                <article key={item.label} className="border-r border-slate-200 px-5 py-8 text-center last:border-r-0 dark:border-white/10">
                                    <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                                    <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">{display}</p>
                                    
                                </article>
                            )
                        })}
                    </div>
                </section>

                <section id="features" className="bg-[#f7f9fc] px-5 py-20 sm:px-7 lg:px-8 lg:py-28 dark:bg-slate-950">
                    <div className="mx-auto w-full">
                        <div className="max-w-2xl">
                            {/* <p className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Everything in one place</p> */}
                            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                                Everything, in one place.
                            </h2>
                            <p className="mt-5 text-[17px] leading-7 text-slate-600 dark:text-slate-300">
                                One clean workspace for your entire school.
                            </p>
                        </div>

                        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((feature, index) => (
                                <article
                                    key={feature.title}
                                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_25px_60px_-30px_rgba(37,99,235,0.35)] dark:border-white/10 dark:bg-slate-900 dark:hover:border-blue-400/30"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-[15px] font-black text-white transition group-hover:bg-blue-600 dark:bg-white dark:text-slate-950 dark:group-hover:bg-blue-400">
                                            {feature.icon}
                                        </div>
                                        <span className="text-[12px] font-black text-slate-300 dark:text-slate-700">0{index + 1}</span>
                                    </div>
                                    <h3 className="mt-7 text-xl font-black tracking-tight">{feature.title}</h3>
                                    <p className="mt-3 text-[15px] leading-6 text-slate-500 dark:text-slate-400">{feature.description}</p>
                                    <div className="mt-6 flex items-center gap-1 text-[13px] font-bold text-blue-600 opacity-0 transition group-hover:opacity-100 dark:text-blue-400">
                                        Explore feature <ArrowIcon />
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="why-us" className="bg-white px-5 py-20 sm:px-7 lg:px-8 lg:py-28 dark:bg-slate-900">
                    <div className="mx-auto grid w-full gap-14 lg:grid-cols-2 lg:items-center">
                        <div>
                            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Made for India</p>
                            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                                Built for your school.
                            </h2>
                            <p className="mt-5 max-w-xl text-[17px] leading-7 text-slate-600 dark:text-slate-300">
                                Simple tools built for everyday school work.
                            </p>

                            <div className="mt-8 space-y-4">
                                {[
                                    "One platform for everyone",
                                    "Simple everyday workflows",
                                    "Works on every device",
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3 text-[15px] font-semibold text-slate-700 dark:text-slate-200">
                                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
                                            <CheckIcon />
                                        </span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {BENEFITS.map((benefit) => (
                                <article key={benefit.title} className="rounded-3xl border border-slate-200 bg-[#f8fafc] p-6 dark:border-white/10 dark:bg-slate-950">
                                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[13px] font-black text-slate-950 shadow-sm dark:bg-white/10 dark:text-white">
                                        {benefit.icon}
                                    </div>
                                    <h3 className="mt-5 font-black">{benefit.title}</h3>
                                    <p className="mt-2 text-[15px] leading-6 text-slate-500 dark:text-slate-400">{benefit.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="stories" className="bg-[#f7f9fc] px-5 py-20 sm:px-7 lg:px-8 lg:py-28 dark:bg-slate-950">
                    <div className="mx-auto w-full text-center">
                        <p className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Loved by the people who use it</p>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Loved by school teams.</h2>

                        <div className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white text-left shadow-[0_25px_80px_-45px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-slate-900">
                            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}>
                                {TESTIMONIALS.map((item) => (
                                    <figure key={item.name} className="w-full shrink-0 px-7 py-10 sm:px-12 sm:py-12">
                                        <div className="flex gap-1 text-[15px] text-amber-400" aria-label="5 out of 5 stars">
                                            ★★★★★
                                        </div>
                                        <blockquote className="mt-6 max-w-2xl text-xl font-semibold leading-9 tracking-[-0.02em] text-slate-800 sm:text-2xl sm:leading-10 dark:text-slate-100">
                                            {item.quote}
                                        </blockquote>
                                        <figcaption className="mt-8 flex items-center gap-3">
                                            <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-[13px] font-black text-white dark:bg-white dark:text-slate-950">
                                                {item.avatar}
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-black">{item.name}</p>
                                                <p className="mt-0.5 text-[13px] text-slate-500 dark:text-slate-400">{item.role}</p>
                                            </div>
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 flex justify-center gap-2">
                            {TESTIMONIALS.map((item, index) => (
                                <button
                                    key={item.name}
                                    type="button"
                                    aria-label={`Go to testimonial ${index + 1}`}
                                    onClick={() => setActiveTestimonial(index)}
                                    className={`h-2 rounded-full transition-all ${
                                        activeTestimonial === index
                                            ? "w-7 bg-blue-600"
                                            : "w-2 bg-slate-300 dark:bg-slate-700"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="px-5 py-6 sm:px-7 lg:px-8 lg:py-10 dark:bg-slate-950">
                    <div className="relative mx-auto w-full overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-center text-white sm:px-10 sm:py-16 dark:bg-white dark:text-slate-950">
                        <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[90px]" />
                        <div className="relative">
                            <p className="text-[13px] font-black uppercase tracking-[0.2em] text-blue-300 dark:text-blue-600">Start today</p>
                            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                                Your school deserves a better operating system.
                            </h2>
                            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-6 text-slate-300 dark:text-slate-600">
                                Everything your school needs to stay organized.
                            </p>
                            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-[15px] font-bold text-slate-950 transition hover:-translate-y-1 hover:bg-blue-50 dark:bg-slate-950 dark:text-white dark:hover:bg-blue-600"
                                >
                                    Start free
                                    <ArrowIcon />
                                </Link>
                                <Link
                                    to="/school/register"
                                    className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-1 hover:bg-white/10 dark:border-slate-950/15 dark:text-slate-950 dark:hover:bg-slate-950/5"
                                >
                                    Register your school
                                </Link>
                            </div>
                            <p className="mt-5 text-[12px] font-medium text-slate-400 dark:text-slate-500">
                                No credit card required. Free for 30 days. Cancel anytime.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
                <div className="mx-auto grid w-full gap-10 px-5 py-12 sm:px-7 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
                    <section>
                        <Link to="/" className="inline-flex items-center gap-2 text-xl font-black">
                            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-[12px] text-white dark:bg-white dark:text-slate-950">AF</span>
                            Acad<span className="text-blue-600 dark:text-blue-400">Flows</span>
                        </Link>
                        <p className="mt-4 max-w-xs text-[15px] leading-6 text-slate-500 dark:text-slate-400">
                            Simple school management, all in one place.
                        </p>
                        <p className="mt-5 text-[13px] font-semibold text-slate-500 dark:text-slate-400">Made in India for India</p>
                        <a href="mailto:support@acadflows.in" className="mt-2 inline-block text-[15px] font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                            support@acadflows.in
                        </a>
                    </section>

                    <section>
                        <h4 className="text-[13px] font-black uppercase tracking-[0.16em]">Product</h4>
                        <ul className="mt-4 space-y-3 text-[15px] text-slate-500 dark:text-slate-400">
                            <li><a href="#features" className="hover:text-blue-600">Features</a></li>
                            <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
                            <li><a href="#" className="hover:text-blue-600">Integrations</a></li>
                            <li><a href="#" className="hover:text-blue-600">Updates</a></li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="text-[13px] font-black uppercase tracking-[0.16em]">Company</h4>
                        <ul className="mt-4 space-y-3 text-[15px] text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-blue-600">About Us</a></li>
                            <li><a href="#" className="hover:text-blue-600">Blog</a></li>
                            <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                            <li><a href="#" className="hover:text-blue-600">Contact</a></li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="text-[13px] font-black uppercase tracking-[0.16em]">Support</h4>
                        <ul className="mt-4 space-y-3 text-[15px] text-slate-500 dark:text-slate-400">
                            <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                            <li><a href="#" className="hover:text-blue-600">Documentation</a></li>
                            <li><a href="#" className="hover:text-blue-600">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-blue-600">Terms of Service</a></li>
                        </ul>
                    </section>
                </div>

                <div className="border-t border-slate-200 px-5 py-5 text-center text-[13px] text-slate-400 dark:border-white/10">
                    © {new Date().getFullYear()} AcadFlows. All rights reserved. Made with ❤️ in India
                </div>
            </footer>
        </div>
    )
}