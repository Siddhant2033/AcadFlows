import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingPage() {
  const { theme, mode } = useTheme();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const statsRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState({ schools: 0, students: 0, teachers: 0, cities: 0 });

  const features = [
    {
      icon: '📚',
      title: 'Academic Management',
      description: 'Manage classes, subjects, timetables, and assignments with ease. Complete academic year planning.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: '👨‍🎓',
      title: 'Student & Teacher Portal',
      description: 'Dedicated portals for students, teachers, and guardians. Role-based access for everyone.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: '💰',
      title: 'Fee Management',
      description: 'Track fees, generate invoices, manage payments, and send automatic reminders to parents.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: '📊',
      title: 'Analytics & Reports',
      description: 'Get insights with detailed analytics, report cards, and performance tracking for every student.',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: '✅',
      title: 'Attendance Tracking',
      description: 'Track attendance with ease, generate reports, and send instant notifications to parents.',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: '🔔',
      title: 'Smart Communication',
      description: 'Keep everyone informed with real-time notifications, announcements, and parent-teacher messaging.',
      color: 'from-indigo-500 to-indigo-600',
    },
  ];

  const stats = [
    { label: 'Schools', value: 500, icon: '🏫' },
    { label: 'Students', value: 50000, icon: '👨‍🎓' },
    { label: 'Teachers', value: 10000, icon: '👨‍🏫' },
    { label: 'Cities', value: 25, icon: '🌆' },
  ];

  const testimonials = [
    {
      name: 'Dr. Rajesh Kumar',
      role: 'Principal, Delhi Public School',
      image: '👨‍🏫',
      quote: 'School Platform has transformed how we manage our school. From attendance to fee collection, everything is now paperless and efficient. Our parents love the transparency.',
      rating: 5,
    },
    {
      name: 'Mrs. Priya Sharma',
      role: 'Parent, Class 5',
      image: '👩',
      quote: 'I can track my child\'s attendance, grades, and fee status in real-time. The mobile-friendly interface makes it so easy to stay connected with the school.',
      rating: 5,
    },
    {
      name: 'Mr. Amit Patel',
      role: 'Teacher, Mathematics',
      image: '👨‍🏫',
      quote: 'Creating assignments, grading submissions, and managing my timetable has never been easier. The platform saves me hours of administrative work every week.',
      rating: 5,
    },
  ];

  // Animation for stats on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounts();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const animateCounts = () => {
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setCounts({
        schools: Math.floor(500 * easeOutCubic(progress)),
        students: Math.floor(50000 * easeOutCubic(progress)),
        teachers: Math.floor(10000 * easeOutCubic(progress)),
        cities: Math.floor(25 * easeOutCubic(progress)),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating);
  };

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
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏫</span>
              <span className="text-xl font-bold font-headline" style={{ color: theme.text.primary }}>
                School<span style={{ color: '#F97316' }}>Platform</span>
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: theme.text.secondary }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm font-medium rounded-lg transition-all hover:scale-105"
                style={{
                  backgroundColor: '#F97316',
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EA580C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F97316';
                }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background Gradient */}
        <div className="absolute inset-0 opacity-10" style={{
          background: 'radial-gradient(circle at 30% 50%, #F97316 0%, transparent 60%), radial-gradient(circle at 70% 80%, #F97316 0%, transparent 60%)',
        }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm mb-6 animate-fade-in" style={{
              backgroundColor: mode === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#FFF7ED',
              color: '#F97316',
              border: '1px solid rgba(249, 115, 22, 0.2)',
            }}>
              🚀 India's Most Trusted School Management Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline mb-6 leading-tight animate-slide-up" style={{ color: theme.text.primary }}>
              Transform Your
              <span className="block text-primary-500" style={{ color: '#F97316' }}>
                School Management
              </span>
            </h1>
            
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in" style={{ color: theme.text.secondary }}>
              The all-in-one platform for modern Indian schools. From attendance to grades, 
              fees to communication — everything in one place, designed for India.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Link
                to="/register"
                className="px-8 py-4 text-base font-medium rounded-lg transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: '#F97316',
                  color: '#FFFFFF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#EA580C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F97316';
                }}
              >
                Start Free Trial
                <span className="ml-2">→</span>
              </Link>
              <Link
                to="/school/register"
                className="px-8 py-4 text-base font-medium rounded-lg transition-all hover:scale-105 border-2"
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

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 opacity-70">
              <span className="text-sm" style={{ color: theme.text.muted }}>Trusted by 500+ schools across India</span>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm" style={{ color: theme.text.muted }}>4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image/Illustration */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{
            backgroundColor: theme.background.elevated,
            border: `1px solid ${theme.border.light}`,
          }}>
            <div className="aspect-[16/9] flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🏫</div>
                <p className="text-lg" style={{ color: theme.text.secondary }}>
                  Complete School Management Dashboard
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  <span className="px-3 py-1 rounded-full text-sm" style={{
                    backgroundColor: mode === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#FFF7ED',
                    color: '#F97316',
                  }}>📊 Analytics</span>
                  <span className="px-3 py-1 rounded-full text-sm" style={{
                    backgroundColor: mode === 'dark' ? 'rgba(34, 197, 94, 0.2)' : '#F0FDF4',
                    color: '#22C55E',
                  }}>✅ Attendance</span>
                  <span className="px-3 py-1 rounded-full text-sm" style={{
                    backgroundColor: mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#EFF6FF',
                    color: '#3B82F6',
                  }}>💰 Fees</span>
                  <span className="px-3 py-1 rounded-full text-sm" style={{
                    backgroundColor: mode === 'dark' ? 'rgba(168, 85, 247, 0.2)' : '#F5F3FF',
                    color: '#8B5CF6',
                  }}>📝 Assignments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 border-t border-b" style={{
        borderColor: theme.border.light,
        backgroundColor: theme.background.surface,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="opacity-0 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold font-headline" style={{ color: '#F97316' }}>
                  {stat.value >= 1000 
                    ? `${(counts[stat.label.toLowerCase() as keyof typeof counts] / 1000).toFixed(0)}K+`
                    : `${counts[stat.label.toLowerCase() as keyof typeof counts]}+`
                  }
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4" style={{ color: theme.text.primary }}>
              Everything You Need to Succeed
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.text.secondary }}>
              Powerful features designed specifically for Indian schools to streamline operations and enhance learning.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl transition-all hover:transform hover:-translate-y-2 hover:shadow-xl"
                style={{
                  backgroundColor: theme.card.background,
                  boxShadow: mode === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.05)',
                  border: `1px solid ${theme.border.light}`,
                }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold font-headline mb-2" style={{ color: theme.text.primary }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.text.secondary }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20" style={{
        backgroundColor: theme.background.surface,
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4" style={{ color: theme.text.primary }}>
              Why Indian Schools Choose Us
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.text.secondary }}>
              Built for Indian education system with local support and understanding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🇮🇳', title: 'India-First', desc: 'Designed for Indian schools, boards, and education system' },
              { icon: '💸', title: 'Affordable Pricing', desc: 'Starting at just ₹999/month for schools of all sizes' },
              { icon: '📱', title: 'Mobile Friendly', desc: 'Access from any device — phone, tablet, or desktop' },
              { icon: '🛡️', title: 'Secure & Private', desc: 'Data privacy with Indian servers and compliance' },
            ].map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl text-center transition-all hover:transform hover:-translate-y-2"
                style={{
                  backgroundColor: theme.card.background,
                  border: `1px solid ${theme.border.light}`,
                }}
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text.primary }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: theme.text.secondary }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4" style={{ color: theme.text.primary }}>
              What Our Users Say
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.text.secondary }}>
              Trusted by educators, parents, and students across India
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="p-8 rounded-2xl text-center" style={{
                      backgroundColor: theme.card.background,
                      border: `1px solid ${theme.border.light}`,
                    }}>
                      <div className="text-6xl mb-4">{testimonial.image}</div>
                      <div className="text-yellow-400 text-xl mb-3">{renderStars(testimonial.rating)}</div>
                      <p className="text-lg italic mb-6" style={{ color: theme.text.secondary }}>
                        "{testimonial.quote}"
                      </p>
                      <div>
                        <p className="font-semibold" style={{ color: theme.text.primary }}>
                          {testimonial.name}
                        </p>
                        <p className="text-sm" style={{ color: theme.text.muted }}>
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className="w-3 h-3 rounded-full transition-all"
                  style={{
                    backgroundColor: activeTestimonial === index ? '#F97316' : theme.border.medium,
                    width: activeTestimonial === index ? '24px' : '12px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden" style={{
        backgroundColor: mode === 'dark' ? '#0F172A' : '#FFF7ED',
      }}>
        <div className="absolute inset-0 opacity-5" style={{
          background: 'radial-gradient(circle at 50% 50%, #F97316 0%, transparent 70%)',
        }} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4" style={{ color: theme.text.primary }}>
            Ready to Transform Your School?
          </h2>
          <p className="text-lg mb-8" style={{ color: theme.text.secondary }}>
            Join 500+ schools already using our platform to manage their operations efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 text-base font-medium rounded-lg transition-all hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: '#F97316',
                color: '#FFFFFF',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EA580C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F97316';
              }}
            >
              Start Free Trial
              <span className="ml-2">→</span>
            </Link>
            <Link
              to="/school/register"
              className="px-8 py-4 text-base font-medium rounded-lg transition-all hover:scale-105 border-2"
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
          <p className="text-sm mt-4" style={{ color: theme.text.muted }}>
            No credit card required. Free for 30 days. Cancel anytime.
          </p>
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
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🏫</span>
                <span className="text-lg font-bold font-headline" style={{ color: theme.text.primary }}>
                  School<span style={{ color: '#F97316' }}>Platform</span>
                </span>
              </Link>
              <p className="text-sm" style={{ color: theme.text.secondary }}>
                Making school management simple and efficient for Indian schools.
              </p>
              <div className="mt-4 flex gap-4">
                <a href="#" className="text-xl hover:scale-110 transition-transform" style={{ color: theme.text.muted }}>📱</a>
                <a href="#" className="text-xl hover:scale-110 transition-transform" style={{ color: theme.text.muted }}>🐦</a>
                <a href="#" className="text-xl hover:scale-110 transition-transform" style={{ color: theme.text.muted }}>📸</a>
                <a href="#" className="text-xl hover:scale-110 transition-transform" style={{ color: theme.text.muted }}>💼</a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3" style={{ color: theme.text.primary }}>Product</h4>
              <ul className="space-y-2 text-sm" style={{ color: theme.text.secondary }}>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Features</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Pricing</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Integrations</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Updates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3" style={{ color: theme.text.primary }}>Company</h4>
              <ul className="space-y-2 text-sm" style={{ color: theme.text.secondary }}>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">About Us</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Blog</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Careers</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3" style={{ color: theme.text.primary }}>Support</h4>
              <ul className="space-y-2 text-sm" style={{ color: theme.text.secondary }}>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Help Center</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Documentation</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-primary-500 transition-colors">Terms of Service</Link></li>
              </ul>
              <div className="mt-4 p-3 rounded-lg" style={{
                backgroundColor: mode === 'dark' ? 'rgba(249, 115, 22, 0.1)' : '#FFF7ED',
                border: `1px solid ${mode === 'dark' ? 'rgba(249, 115, 22, 0.2)' : '#FED7AA'}`,
              }}>
                <p className="text-xs" style={{ color: theme.text.secondary }}>
                  🇮🇳 Made in India for India
                </p>
                <p className="text-xs font-mono" style={{ color: '#F97316' }}>
                  support@schoolplatform.in
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-sm text-center" style={{
            borderColor: theme.border.light,
            color: theme.text.muted,
          }}>
            <p>© {new Date().getFullYear()} SchoolPlatform. All rights reserved. Made with ❤️ in India</p>
            <p className="mt-1 text-xs">📍 Noida, Uttar Pradesh, India</p>
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
          animation: fade-in 0.8s ease-out forwards;
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}