import { useState } from 'react';
import { Card, Button, Label } from './ui';
import { cn } from '../lib/cn';

interface TempPasswordModalProps {
  userName: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  onClose: () => void;
}

export function TempPasswordModal({
  userName,
  email,
  password,
  role,
  onClose,
}: TempPasswordModalProps) {
  const [copied, setCopied] = useState<'password' | 'all' | null>(null);

  const copy = async (text: string, kind: 'password' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback: select the input
    }
  };

  const copyAll = () => {
    const text = `AcadFlows Login\n\nRole: ${role}\nEmail: ${email}\nPassword: ${password}\n\nPlease change your password after first login.`;
    copy(text, 'all');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card
        padding="lg"
        className="max-w-md w-full animate-scale-in"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-green-500/15 text-2xl">
            ✅
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {role === 'student' ? 'Student' : 'Teacher'} created
            </h3>
            <p className="text-sm text-muted mt-0.5">
              Share these login credentials with {userName}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 mb-5">
          <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
            ⚠️ This password is shown only once. Copy it now.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                readOnly
                value={email}
                className="flex-1 rounded-lg border border-border bg-elevated px-3.5 py-2.5 text-sm text-foreground font-mono"
              />
            </div>
          </div>

          <div>
            <Label>Password</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                readOnly
                value={password}
                className="flex-1 rounded-lg border border-border bg-elevated px-3.5 py-2.5 text-sm text-foreground font-mono"
              />
              <Button
                type="button"
                variant={copied === 'password' ? 'success' : 'outline'}
                size="sm"
                onClick={() => copy(password, 'password')}
              >
                {copied === 'password' ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            variant={copied === 'all' ? 'success' : 'primary'}
            fullWidth
            onClick={copyAll}
            leftIcon={copied === 'all' ? '✓' : '📋'}
          >
            {copied === 'all' ? 'Copied all credentials' : 'Copy all credentials'}
          </Button>
          <Button variant="outline" fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default TempPasswordModal;