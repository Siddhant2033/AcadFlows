import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingPage() {
  const { theme, mode } = useTheme();
  const statsRef = useRef<HTMLDivElement>(null);

  // Animation for stats on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: '📚',
      title: 'Academic Management',
      description: 'Manage classes, subjects, timetables, and assignments with ease.',
    },
    {
      icon: '👨‍🎓',
      title: 'Student & Teacher Portal',
      description: 'Dedicated portals for students, teachers, and guardians.',
    },
    {
      icon: '💰',
      title: 'Fee Management',
      description: 'Track fees, generate invoices, and manage payments.',
    },
    {
      icon: '📊',
      title: 'Analytics & Reports',
      description: 'Get insights with detailed analytics and report cards.',
    },
    {
      icon: '📝',
      title: 'Attendance Tracking',
      description: 'Track attendance with ease and generate reports.',
    },
    {
      icon: '🔔',
      title: 'Notifications',
      description: 'Keep everyone informed with real-time notifications.',
    },
  ];

  const stats = [
    { label: 'Schools', value: '500+' },
    { label: 'Students', value: '50K+' },
    { label: 'Teachers', value: '10K+' },
    { label: 'Countries', value: '25+' },
  ];

  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: theme.background.base,
      color: theme.text.primary 
    }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-md border-b" style={{
        backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        borderColor: theme.border.light,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏫</span>
              <span className="text-xl font-bold font-headline" style={{ color: theme.text.primary }}>
                SchoolPlatform
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  color: theme.text.secondary,
                  backgroundColor: 'transparent',
                }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: theme.button.primary.background,
                  color: theme.button.primary.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.button.primary.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.button.primary.background;
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm mb-6" style={{
              backgroundColor: mode === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#FFF7ED',
              color: '#F97316',
            }}>
              🚀 The Future of School Management
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-headline mb-6 leading-tight" style={{ color: theme.text.primary }}>
              Manage Your School
              <span className="block text-primary-500">Smarter & Faster</span>
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: theme.text.secondary }}>
              The all-in-one platform for modern schools. From attendance to grades,
              everything in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-3 text-base font-medium rounded-lg transition-colors"
                style={{
                  backgroundColor: theme.button.primary.background,
                  color: theme.button.primary.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.button.primary.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.button.primary.background;
                }}
              >
                Get Started Free
              </Link>
              <Link
                to="/school/register"
                className="px-8 py-3 text-base font-medium rounded-lg transition-colors border-2"
                style={{
                  backgroundColor: 'transparent',
                  color: theme.text.primary,
                  borderColor: theme.border.medium,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.background.elevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Register Your School
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-12 border-t border-b" style={{
        borderColor: theme.border.light,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="opacity-0 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-3xl md:text-4xl font-bold font-headline text-primary-500">
                  {stat.value}
                </div>
                <div className="text-sm mt-1" style={{ color: theme.text.secondary }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4" style={{ color: theme.text.primary }}>
              Everything You Need to Succeed
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.text.secondary }}>
              Powerful features designed to streamline your school operations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-card transition-all hover:transform hover:-translate-y-1"
                style={{
                  backgroundColor: theme.card.background,
                  boxShadow: mode === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)',
                }}
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold font-headline mb-2" style={{ color: theme.text.primary }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: theme.text.secondary }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{
        backgroundColor: mode === 'dark' ? '#0F172A' : '#FFF7ED',
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4" style={{ color: theme.text.primary }}>
            Ready to Transform Your School?
          </h2>
          <p className="text-lg mb-8" style={{ color: theme.text.secondary }}>
            Join thousands of schools already using our platform.
          </p>
          <Link
            to="/register"
            className="px-8 py-4 text-base font-medium rounded-lg transition-colors inline-block"
            style={{
              backgroundColor: theme.button.primary.background,
              color: theme.button.primary.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.button.primary.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.button.primary.background;
            }}
          >
            Start Your Journey Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t" style={{
        borderColor: theme.border.light,
        backgroundColor: theme.background.surface,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🏫</span>
                <span className="text-lg font-bold font-headline" style={{ color: theme.text.primary }}>
                  SchoolPlatform
                </span>
              </div>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Making school management simple and efficient.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: theme.text.primary }}>Product</h4>
              <ul className="space-y-2 text-sm" style={{ color: theme.text.secondary }}>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Features</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Pricing</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: theme.text.primary }}>Company</h4>
              <ul className="space-y-2 text-sm" style={{ color: theme.text.secondary }}>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">About</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Blog</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3" style={{ color: theme.text.primary }}>Support</h4>
              <ul className="space-y-2 text-sm" style={{ color: theme.text.secondary }}>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Contact</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-sm text-center" style={{
            borderColor: theme.border.light,
            color: theme.text.muted,
          }}>
            © {new Date().getFullYear()} SchoolPlatform. All rights reserved.
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}