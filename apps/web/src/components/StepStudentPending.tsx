import { Link } from 'react-router-dom';
import { Card, Button } from './ui';

interface StepStudentPendingProps {
  firstName: string;
  email: string;
  grade: string;
  section?: string;
  tenantName: string;
  wasVerified: boolean;
}

export default function StepStudentPending({
  firstName,
  email,
  grade,
  section,
  tenantName,
  wasVerified,
}: StepStudentPendingProps) {
  return (
    <Card padding="lg" className="text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-secondary-500/15 flex items-center justify-center mb-5">
        <span className="text-3xl">⏳</span>
      </div>

      <h2 className="text-2xl font-bold text-foreground">
        Waiting for approval
      </h2>

      <p className="mt-3 text-sm text-muted leading-relaxed">
        Hi {firstName}, your registration at <strong>{tenantName}</strong>{' '}
        has been received.
      </p>

      <p className="mt-2 text-sm text-muted leading-relaxed">
        {wasVerified
          ? 'Your class teacher will confirm your record and activate your account.'
          : 'Your class teacher or school admin will review your details and activate your account.'}
      </p>

      <div className="mt-6 rounded-lg bg-elevated p-4 text-left">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">
              Registered as
            </p>
            <p className="text-foreground font-medium">Student</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">
              Class
            </p>
            <p className="text-foreground font-medium">
              {grade}
              {section ? ` - ${section}` : ''}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[10px] uppercase tracking-wider text-muted mb-1">
              Notification email
            </p>
            <p className="text-foreground font-medium break-all">
              {email}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-surface p-4 text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
          What happens next?
        </p>
        <ol className="space-y-2 text-sm text-foreground">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <span>
              {wasVerified
                ? 'Your class teacher reviews and approves your account.'
                : 'Your class teacher or school admin reviews your details.'}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <span>
              You'll get an email at <strong>{email}</strong> once
              you're approved.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <span>You can then log in and access your dashboard.</span>
          </li>
        </ol>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
        <Link to="/login">
          <Button variant="outline" fullWidth>
            Go to Login
          </Button>
        </Link>
      </div>

      <p className="mt-4 text-xs text-muted">
        Don't hear back in 2–3 days? Contact your school administrator.
      </p>
    </Card>
  );
}