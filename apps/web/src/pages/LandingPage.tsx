import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

/* ─────────────────────────────────────────────────────────── */
/* Content (honest — no fabricated testimonials or stats)    */
/* ─────────────────────────────────────────────────────────── */

type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

type BenefitItem = {
  icon: string;
  title: string;
  description: string;
};

const FEATURES: FeatureItem[] = [
  {
    icon: '▦',
    title: 'Academic Management',
    description:
      'Classes, subjects, timetables, and assignments, all in one place.',
  },
  {
    icon: '◌',
    title: 'Role-based Portals',
    description:
      'Focused views for admins, teachers, students, and guardians.',
  },
  {
    icon: '₹',
    title: 'Fee Management',
    description:
      'Fee structures, invoices, payments, and reminders.',
  },
  {
    icon: '◫',
    title: 'Analytics & Reports',
    description:
      'Attendance, grades, and fee collection at a glance.',
  },
  {
    icon: '✓',
    title: 'Attendance Tracking',
    description:
      'Daily attendance, class-teacher controls, and monthly reports.',
  },
  {
    icon: '⌁',
    title: 'Communication',
    description:
      'Announcements, notifications, and parent-teacher messaging.',
  },
];

const BENEFITS: BenefitItem[] = [
  {
    icon: 'IN',
    title: 'Built for India',
    description: 'INR, IST, +91 phone numbers, and Apr–Mar academic years.',
  },
  {
    icon: '₹',
    title: 'Free to start',
    description: 'No credit card. Run a full academic year on the free tier.',
  },
  {
    icon: '↗',
    title: 'Works on any device',
    description: 'Phone, tablet, or desktop — the same school, everywhere.',
  },
  {
    icon: '⌑',
    title: 'Your data stays yours',
    description: 'Each school is fully isolated. No cross-tenant access.',
  },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Register your school',
    description: 'Get a unique 10-character school code in seconds.',
  },
  {
    step: '2',
    title: 'Set up academics',
    description: 'Add grades, sections, subjects, and assign teachers.',
  },
  {
    step: '3',
    title: 'Invite your team',
    description: 'Students, teachers, and guardians join with the school code.',
  },
  {
    step: '4',
    title: 'Run the school day',
    description: 'Attendance, fees, assignments, and communication — together.',
  },
];

/* ─────────────────────────────────────────────────────────── */
/* Icons                                                     */
/* ─────────────────────────────────────────────────────────── */

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4 10h11M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="m4 10 3.5 3.5L16 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M10 2l1.5 5.5L17 9l-5.5 1.5L10 16l-1.5-5.5L3 9l5.5-1.5L10 2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Landing Page                                              */
/* ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-2xl">
        <nav
          className="mx-auto flex h-[72px] w-full items-center justify-between px-5 sm:px-7 lg:px-8"
          aria-label="Main navigation"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2.5 text-[21px] font-black tracking-[-0.03em]"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-500 text-[15px] text-white shadow-sm transition group-hover:scale-105">
              AF
            </span>
            <span>
              Acad<span className="text-primary-500">Flows</span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="#features"
              className="rounded-lg px-3 py-2 text-[15px] font-medium text-muted transition hover:bg-elevated hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#how"
              className="rounded-lg px-3 py-2 text-[15px] font-medium text-muted transition hover:bg-elevated hover:text-foreground"
            >
              How it works
            </a>
            <a
              href="#why-us"
              className="rounded-lg px-3 py-2 text-[15px] font-medium text-muted transition hover:bg-elevated hover:text-foreground"
            >
              Why AcadFlows
            </a>
            <div className="mx-2 h-6 w-px bg-border" />
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-xl px-4 py-2.5 text-[15px] font-semibold text-foreground transition hover:bg-elevated"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-primary-500 px-5 py-2.5 text-[15px] font-bold text-white shadow-lg shadow-primary-500/20 transition hover:-translate-y-0.5 hover:bg-primary-600"
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
              onClick={() => setMenuOpen(prev => !prev)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border text-lg"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div
            id="mobile-main-menu"
            className="border-t border-border bg-surface px-5 py-4 md:hidden"
          >
            <div className="flex flex-col gap-1">
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] font-semibold"
              >
                Features
              </a>
              <a
                href="#how"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] font-semibold"
              >
                How it works
              </a>
              <a
                href="#why-us"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] font-semibold"
              >
                Why AcadFlows
              </a>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 text-[15px] font-semibold"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="mt-1 rounded-xl bg-primary-500 px-3 py-3 text-center text-[15px] font-bold text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-surface">
          {/* Background gradient */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10%] top-20 h-[420px] w-[420px] rounded-full bg-primary-500/10 blur-[110px]" />
            <div className="absolute right-[-5%] top-10 h-[500px] w-[500px] rounded-full bg-secondary-500/10 blur-[120px]" />
            <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,rgb(var(--fg))_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--fg))_1px,transparent_1px)] [background-size:48px_48px]" />
          </div>

          <div className="relative mx-auto grid w-full gap-14 px-5 pb-20 pt-16 sm:px-7 sm:pt-20 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-8 lg:pb-20 lg:pt-20">
            <div className="lg:col-span-5">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1.5 text-[13px] font-bold text-primary-700 dark:border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-400">
                <SparkleIcon />
                Built for Indian schools
              </div>

              <h1 className="max-w-2xl text-[3rem] font-black leading-[1.02] tracking-[-0.055em] sm:text-[4.15rem] lg:text-[4.6rem]">
                Run your school
                <span className="block bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500 bg-clip-text text-transparent">
                  without the chaos.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-[17px] leading-7 text-muted sm:text-lg sm:leading-8">
                One platform for academics, attendance, fees, communication,
                and performance. Give your team more time to focus on students.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/school/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-500 px-6 py-3.5 text-[15px] font-bold text-white shadow-xl shadow-primary-500/20 transition hover:-translate-y-1 hover:bg-primary-600"
                >
                  Register your school
                  <ArrowIcon />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-border bg-surface px-6 py-3.5 text-[15px] font-bold text-foreground transition hover:-translate-y-1 hover:bg-elevated"
                >
                  Sign in
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-semibold text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon /> Free to start
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon /> No credit card
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckIcon /> Data stays in India
                </span>
              </div>
            </div>

            {/* Right side: illustration — statically rendered, no fake numbers */}
            <div className="relative lg:col-span-7">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary-500/25 via-primary-500/5 to-secondary-500/20 blur-3xl" />
              <div className="relative rounded-[1.7rem] border border-border bg-surface p-2 shadow-2xl sm:p-3">
                <div className="overflow-hidden rounded-[1.2rem] border border-border bg-background">
                  {/* Browser chrome */}
                  <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="rounded-md bg-elevated px-3 py-1 text-[12px] font-bold text-muted">
                      acadflows.app
                    </span>
                    <div className="h-6 w-6 rounded-full bg-elevated" />
                  </div>

                  {/* Sidebar + main */}
                  <div className="grid min-h-[420px] grid-cols-12">
                    <aside className="col-span-3 hidden border-r border-border bg-surface p-3 sm:block">
                      <div className="mb-6 flex items-center gap-2 px-1">
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-500 text-[10px] font-black text-white">
                          AF
                        </div>
                        <span className="text-[12px] font-black">AcadFlows</span>
                      </div>
                      <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-widest text-muted">
                        Workspace
                      </p>
                      <ul className="space-y-1">
                        {[
                          { icon: '⌂', label: 'Overview', active: true },
                          { icon: '◫', label: 'Analytics' },
                          { icon: '✓', label: 'Attendance' },
                          { icon: '₹', label: 'Fees' },
                          { icon: '▤', label: 'Assignments' },
                        ].map(item => (
                          <li key={item.label}>
                            <div
                              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] font-semibold ${
                                item.active
                                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
                                  : 'text-muted'
                              }`}
                            >
                              <span className="grid h-5 w-5 place-items-center rounded-md bg-elevated text-[10px]">
                                {item.icon}
                              </span>
                              {item.label}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </aside>

                    <section className="col-span-12 p-4 sm:col-span-9 sm:p-5">
                      <div className="mb-5 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
                            Overview
                          </p>
                          <h2 className="mt-1 text-[1.35rem] font-black tracking-tight sm:text-2xl">
                            Welcome back, Admin
                          </h2>
                          <p className="mt-1 text-[12px] text-muted">
                            Here's what's happening at your school today.
                          </p>
                        </div>
                      </div>

                      {/* Empty-state dashboard mockup — no fake numbers */}
                      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        {[
                          { label: 'Students', tone: 'bg-primary-500' },
                          { label: 'Attendance', tone: 'bg-emerald-500' },
                          { label: 'Fees', tone: 'bg-secondary-500' },
                          { label: 'Assignments', tone: 'bg-accent-500' },
                        ].map(item => (
                          <article
                            key={item.label}
                            className="rounded-xl border border-border bg-surface p-3"
                          >
                            <div
                              className={`mb-3 h-1.5 w-7 rounded-full ${item.tone}`}
                            />
                            <p className="text-[10px] font-semibold text-muted">
                              {item.label}
                            </p>
                            <div className="mt-2 h-4 w-12 rounded bg-elevated" />
                          </article>
                        ))}
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-5">
                        <article className="rounded-xl border border-border bg-surface p-3 sm:col-span-3">
                          <p className="text-[12px] font-black">
                            Attendance trend
                          </p>
                          <div className="mt-4 flex h-24 items-end gap-2">
                            {[45, 60, 52, 70, 65, 78, 72, 85, 80].map(
                              (height, index) => (
                                <div
                                  key={index}
                                  className="flex flex-1 items-end"
                                >
                                  <div
                                    className={`w-full rounded-t-md ${
                                      index === 7
                                        ? 'bg-primary-500'
                                        : 'bg-primary-500/15'
                                    }`}
                                    style={{ height: `${height}%` }}
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        </article>

                        <article className="rounded-xl border border-border bg-surface p-3 sm:col-span-2">
                          <p className="text-[12px] font-black">
                            Quick actions
                          </p>
                          <ul className="mt-3 space-y-2">
                            {['Add student', 'Mark attendance', 'Send notice'].map(
                              text => (
                                <li
                                  key={text}
                                  className="flex items-center gap-2 text-[11px] font-semibold text-muted"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                                  {text}
                                </li>
                              ),
                            )}
                          </ul>
                        </article>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section
          id="how"
          className="border-y border-border bg-surface px-5 py-20 sm:px-7 lg:px-8 lg:py-28"
        >
          <div className="mx-auto w-full">
            <div className="max-w-2xl">
              <p className="text-[13px] font-black uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                Setup in 4 steps
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                From sign-up to first bell.
              </h2>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map(item => (
                <article
                  key={item.step}
                  className="rounded-3xl border border-border bg-background p-6"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-500 text-[14px] font-black text-white">
                    {item.step}
                  </div>
                  <h3 className="mt-5 font-black tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-muted">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ─── */}
        <section
          id="features"
          className="bg-background px-5 py-20 sm:px-7 lg:px-8 lg:py-28"
        >
          <div className="mx-auto w-full">
            <div className="max-w-2xl">
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                Everything, in one place.
              </h2>
              <p className="mt-5 text-[17px] leading-7 text-muted">
                One clean workspace for your entire school.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <article
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-7 transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_25px_60px_-30px_rgb(223_48_28/0.35)] dark:hover:border-primary-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-500 text-[15px] font-black text-white transition group-hover:bg-primary-600">
                      {feature.icon}
                    </div>
                    <span className="text-[12px] font-black text-border">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-7 text-xl font-black tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-6 text-muted">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Why us ─── */}
        <section
          id="why-us"
          className="border-y border-border bg-surface px-5 py-20 sm:px-7 lg:px-8 lg:py-28"
        >
          <div className="mx-auto grid w-full gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-[13px] font-black uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                Made for India
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                Built for your school.
              </h2>
              <p className="mt-5 max-w-xl text-[17px] leading-7 text-muted">
                Simple tools built for everyday school work in Indian schools.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'One platform for everyone',
                  'Simple everyday workflows',
                  'Works on every device',
                ].map(item => (
                  <div
                    key={item}
                    className="flex items-start gap-3 text-[15px] font-semibold"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                      <CheckIcon />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map(benefit => (
                <article
                  key={benefit.title}
                  className="rounded-3xl border border-border bg-background p-6"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-surface text-[13px] font-black text-foreground shadow-sm">
                    {benefit.icon}
                  </div>
                  <h3 className="mt-5 font-black">{benefit.title}</h3>
                  <p className="mt-2 text-[15px] leading-6 text-muted">
                    {benefit.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="bg-background px-5 py-6 sm:px-7 lg:px-8 lg:py-10">
          <div className="relative mx-auto w-full overflow-hidden rounded-[2rem] bg-primary-500 px-6 py-14 text-center text-white sm:px-10 sm:py-16">
            <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 rounded-full bg-white/20 blur-[90px]" />
            <div className="relative">
              <p className="text-[13px] font-black uppercase tracking-[0.2em] text-white/80">
                Start today
              </p>
              <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-5xl">
                Your school deserves a better operating system.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-[15px] leading-6 text-white/85">
                Everything your school needs to stay organized — free to start.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/school/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-[15px] font-bold text-primary-600 transition hover:-translate-y-1 hover:bg-primary-50"
                >
                  Register your school
                  <ArrowIcon />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-6 py-3.5 text-[15px] font-bold text-white transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid w-full gap-10 px-5 py-12 sm:px-7 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          <section>
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-black">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-500 text-[12px] text-white">
                AF
              </span>
              Acad<span className="text-primary-500">Flows</span>
            </Link>
            <p className="mt-4 max-w-xs text-[15px] leading-6 text-muted">
              Simple school management, all in one place.
            </p>
            <p className="mt-5 text-[13px] font-semibold text-muted">
              Made in India for India
            </p>
            <a
              href="mailto:support@acadflows.in"
              className="mt-2 inline-block text-[15px] font-semibold text-foreground hover:text-primary-600"
            >
              support@acadflows.in
            </a>
          </section>

          <section>
            <h4 className="text-[13px] font-black uppercase tracking-[0.16em]">
              Product
            </h4>
            <ul className="mt-4 space-y-3 text-[15px] text-muted">
              <li>
                <a href="#features" className="hover:text-primary-600">
                  Features
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-primary-600">
                  How it works
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-primary-600">
                  Why AcadFlows
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h4 className="text-[13px] font-black uppercase tracking-[0.16em]">
              Get started
            </h4>
            <ul className="mt-4 space-y-3 text-[15px] text-muted">
              <li>
                <Link to="/school/register" className="hover:text-primary-600">
                  Register your school
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary-600">
                  Join with a school code
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-primary-600">
                  Sign in
                </Link>
              </li>
            </ul>
          </section>

          <section>
            <h4 className="text-[13px] font-black uppercase tracking-[0.16em]">
              Support
            </h4>
            <ul className="mt-4 space-y-3 text-[15px] text-muted">
              <li>
                <a href="mailto:support@acadflows.in" className="hover:text-primary-600">
                  Contact us
                </a>
              </li>
            </ul>
          </section>
        </div>

        <div className="border-t border-border px-5 py-5 text-center text-[13px] text-muted">
          © {new Date().getFullYear()} AcadFlows. All rights reserved. Made with ❤️
          in India
        </div>
      </footer>
    </div>
  );
}