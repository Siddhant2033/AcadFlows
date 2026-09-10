import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-2xl w-full text-center animate-fade-up">
        {/* Big number */}
        <div className="text-[120px] md:text-[180px] font-bold leading-none bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent select-none">
          404
        </div>

        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-foreground">
          Page not found
        </h1>
        <p className="mt-3 text-muted max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved. Let's get
          you back on track.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate(-1)}
            leftIcon="←"
          >
            Go Back
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" leftIcon="🏠">
              Dashboard
            </Button>
          </Link>
        </div>

        {/* Helpful links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-xs uppercase tracking-wider text-muted mb-4">
            Popular pages
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { to: '/students', label: 'Students', icon: '👨‍🎓' },
              { to: '/teachers', label: 'Teachers', icon: '👨‍🏫' },
              { to: '/attendance/reports', label: 'Attendance', icon: '📊' },
              { to: '/fees/invoices', label: 'Invoices', icon: '💰' },
              { to: '/timetable', label: 'Timetable', icon: '📅' },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-1.5 rounded-full bg-elevated text-muted hover:text-foreground hover:bg-surface-tint text-xs font-medium transition-colors"
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}