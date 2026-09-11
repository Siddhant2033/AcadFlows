import { Resend } from 'resend';

/**
 * Email service.
 *
 * If RESEND_API_KEY is set, uses Resend.
 * Otherwise, logs to console (useful for local dev and pre-launch testing).
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'AcadFlows <noreply@acadflows.in>';

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
  console.log('✅ Email service initialized with Resend');
} else {
  console.log(
    '⚠️  RESEND_API_KEY not set — email service will log to console only',
  );
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text } = options;

  // Fallback: log to console
  if (!resend) {
    console.log('\n📧 [EMAIL — console mode]');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${text || html.replace(/<[^>]*>/g, '').slice(0, 300)}`);
    console.log('');
    return;
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || undefined,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      throw new Error(result.error.message);
    }

    console.log(`✅ Email sent to ${to} (id: ${result.data?.id})`);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    // Don't throw — email failures shouldn't break the request
  }
}

/**
 * Send a password reset email.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  userName: string,
): Promise<void> {
  const subject = 'Reset your AcadFlows password';

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(223, 48, 28, 0.04);">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; width: 40px; height: 40px; background: #DF301C; color: white; border-radius: 10px; line-height: 40px; font-weight: 900; font-size: 16px;">AF</span>
          </div>

          <h1 style="color: #1E140F; font-size: 24px; font-weight: 700; margin: 0 0 16px;">Reset your password</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px; margin: 0 0 24px;">
            Hi ${userName},
          </p>

          <p style="color: #78716C; font-size: 15px; line-height: 24px; margin: 0 0 32px;">
            We received a request to reset your AcadFlows password. Click the button below to choose a new one.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Reset Password
            </a>
          </div>

          <p style="color: #78716C; font-size: 13px; line-height: 20px; margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #E8E0D6;">
            This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
          </p>

          <p style="color: #78716C; font-size: 13px; line-height: 20px; margin: 16px 0 0;">
            If the button doesn't work, copy and paste this URL into your browser:
          </p>
          <p style="color: #DF301C; font-size: 12px; word-break: break-all; margin: 8px 0 0;">
            ${resetLink}
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Reset your AcadFlows password

Hi ${userName},

We received a request to reset your AcadFlows password. Click the link below to choose a new one.

${resetLink}

This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
  `;

  await sendEmail({ to, subject, html, text });
}