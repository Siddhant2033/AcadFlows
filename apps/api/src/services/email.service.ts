import { Resend } from 'resend';

/**
 * Email service.
 *
 * If RESEND_API_KEY is set, uses Resend.
 * Otherwise, logs to console (useful for local dev and pre-launch testing).
 *
 * ALL approval workflow emails are stubs when RESEND_API_KEY is empty —
 * they log the message with all variables so you can verify the flow
 * without actually sending anything.
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
  }
}

/* ─────────────────────────────────────────────────────────────
   PASSWORD RESET
   ───────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────
   SCHOOL REGISTRATION
   ───────────────────────────────────────────────────────────── */

/**
 * Send a school email verification email.
 */
export async function sendSchoolVerificationEmail(
  to: string,
  verifyLink: string,
  schoolName: string,
  adminName: string,
): Promise<void> {
  const subject = 'Verify your school email — AcadFlows';

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(223, 48, 28, 0.04);">
          <div style="text-align: center; margin-bottom: 32px;">
            <span style="display: inline-block; width: 40px; height: 40px; background: #DF301C; color: white; border-radius: 10px; line-height: 40px; font-weight: 900; font-size: 16px;">AF</span>
          </div>

          <h1 style="color: #1E140F; font-size: 24px; font-weight: 700; margin: 0 0 16px;">Verify your school email</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px; margin: 0 0 24px;">
            Hi ${adminName},
          </p>

          <p style="color: #78716C; font-size: 15px; line-height: 24px; margin: 0 0 32px;">
            Thanks for registering <strong>${schoolName}</strong> on AcadFlows. To complete your registration and enable your account, please verify your school email by clicking the button below.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyLink}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Verify School Email
            </a>
          </div>

          <p style="color: #78716C; font-size: 13px; line-height: 20px; margin: 32px 0 0; padding-top: 24px; border-top: 1px solid #E8E0D6;">
            This link expires in 48 hours. If you didn't register a school on AcadFlows, you can safely ignore this email.
          </p>

          <p style="color: #78716C; font-size: 13px; line-height: 20px; margin: 16px 0 0;">
            After verifying, your school will be reviewed by our team. You'll receive another email once it's approved.
          </p>

          <p style="color: #DF301C; font-size: 12px; word-break: break-all; margin: 8px 0 0;">
            ${verifyLink}
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
Verify your school email

Hi ${adminName},

Thanks for registering ${schoolName} on AcadFlows. Please verify your school email by clicking the link below:

${verifyLink}

This link expires in 48 hours.
  `;

  await sendEmail({ to, subject, html, text });
}

/* ─────────────────────────────────────────────────────────────
   APPROVAL WORKFLOW — PLATFORM ADMIN
   ───────────────────────────────────────────────────────────── */

/**
 * Notify the platform admin (founder) that a new school is awaiting approval.
 */
export async function sendSchoolPendingApprovalEmail(
  to: string,
  schoolName: string,
  schoolEmail: string,
  schoolPhone: string,
  reviewLink: string,
): Promise<void> {
  const subject = `🏫 New school registration: ${schoolName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">New school registration</h1>
          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            A new school has requested to join AcadFlows.
          </p>

          <div style="background: #f9f4ee; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #1E140F; font-size: 15px;"><strong>${schoolName}</strong></p>
            <p style="margin: 0 0 4px; color: #78716C; font-size: 13px;">Email: ${schoolEmail}</p>
            <p style="margin: 0; color: #78716C; font-size: 13px;">Phone: ${schoolPhone}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${reviewLink}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Review Registration
            </a>
          </div>

          <p style="color: #78716C; font-size: 12px; margin: 24px 0 0;">
            This is an automated notification from AcadFlows.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `New school registration: ${schoolName}\nEmail: ${schoolEmail}\nPhone: ${schoolPhone}\nReview: ${reviewLink}`;

  await sendEmail({ to, subject, html, text });
}

/**
 * Notify a school admin that their school was approved.
 */
export async function sendSchoolApprovedEmail(
  to: string,
  schoolName: string,
  adminName: string,
  schoolCode: string,
): Promise<void> {
  const subject = `🎉 ${schoolName} is approved on AcadFlows`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">🎉 Your school is approved</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            Hi ${adminName},
          </p>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            <strong>${schoolName}</strong> has been approved on AcadFlows. Share the school code below with your teachers, students, and guardians so they can join.
          </p>

          <div style="background: #FFF1D1; border: 1px solid #FF9100; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px; color: #78716C; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;">Your School Code</p>
            <p style="margin: 0; color: #1E140F; font-size: 24px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 0.1em;">${schoolCode}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://acadflows.in'}/login" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Log In to AcadFlows
            </a>
          </div>

          <p style="color: #78716C; font-size: 13px; line-height: 20px; margin: 24px 0 0;">
            <strong>Important:</strong> Keep this code private. Only share it with people who should have access to your school.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Your school is approved\n\n${schoolName} has been approved on AcadFlows.\n\nSchool Code: ${schoolCode}\n\nLogin: ${process.env.FRONTEND_URL || 'https://acadflows.in'}/login`;

  await sendEmail({ to, subject, html, text });
}

/**
 * Notify a school admin that their school was rejected.
 */
export async function sendSchoolRejectedEmail(
  to: string,
  schoolName: string,
  adminName: string,
  reason: string,
): Promise<void> {
  const subject = `Update on ${schoolName} registration — AcadFlows`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Registration not approved</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            Hi ${adminName},
          </p>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            We were unable to approve the registration for <strong>${schoolName}</strong>.
          </p>

          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0;">
              <strong>Reason:</strong> ${reason}
            </p>
          </div>

          <p style="color: #78716C; font-size: 14px; line-height: 22px; margin: 24px 0 0;">
            If you believe this is a mistake, please contact us at support@acadflows.in.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Registration not approved\n\nHi ${adminName},\n\nWe were unable to approve the registration for ${schoolName}.\n\nReason: ${reason}\n\nContact support@acadflows.in if you have questions.`;

  await sendEmail({ to, subject, html, text });
}

/* ─────────────────────────────────────────────────────────────
   APPROVAL WORKFLOW — SCHOOL ADMIN / TEACHER
   ───────────────────────────────────────────────────────────── */

/**
 * Notify the school admin that a teacher is awaiting approval.
 */
export async function sendTeacherPendingApprovalEmail(
  to: string,
  teacherName: string,
  teacherEmail: string,
  schoolName: string,
  reviewLink: string,
): Promise<void> {
  const subject = `👨‍🏫 Teacher approval needed: ${teacherName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Teacher approval needed</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            ${teacherName} has requested to join ${schoolName} as a teacher. Please review their profile and approve or reject.
          </p>

          <div style="background: #f9f4ee; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #1E140F; font-size: 15px;"><strong>${teacherName}</strong></p>
            <p style="margin: 0; color: #78716C; font-size: 13px;">Email: ${teacherEmail}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${reviewLink}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Review Request
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Teacher approval needed: ${teacherName}\nEmail: ${teacherEmail}\nReview: ${reviewLink}`;

  await sendEmail({ to, subject, html, text });
}

/**
 * Notify the class teacher that a student is awaiting approval.
 */
export async function sendStudentPendingApprovalEmail(
  to: string,
  studentName: string,
  studentEmail: string,
  className: string,
  reviewLink: string,
): Promise<void> {
  const subject = `👨‍🎓 Student approval needed: ${studentName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Student approval needed</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            ${studentName} (${studentEmail}) has requested to join ${className}. Please review.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${reviewLink}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Review Request
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Student approval needed: ${studentName}\n${studentEmail}\nReview: ${reviewLink}`;

  await sendEmail({ to, subject, html, text });
}

/**
 * Notify the class teacher that a guardian is awaiting approval.
 */
export async function sendGuardianPendingApprovalEmail(
  to: string,
  guardianName: string,
  guardianEmail: string,
  studentName: string,
  reviewLink: string,
): Promise<void> {
  const subject = `👨‍👩‍👧 Guardian approval needed: ${guardianName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Guardian approval needed</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            ${guardianName} (${guardianEmail}) has requested to link as a guardian of ${studentName}. Please review.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${reviewLink}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Review Request
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Guardian approval needed: ${guardianName}\n${guardianEmail}\nStudent: ${studentName}\nReview: ${reviewLink}`;

  await sendEmail({ to, subject, html, text });
}

/**
 * Notify a user that their registration was approved.
 */
export async function sendUserApprovedEmail(
  to: string,
  userName: string,
  role: string,
  schoolName: string,
  loginLink: string,
): Promise<void> {
  const subject = `✅ Your AcadFlows account is approved`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">🎉 Your account is approved</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            Hi ${userName}, your ${role} account at ${schoolName} is now active. You can log in to start using the platform.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginLink}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Log In
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${userName}, your ${role} account at ${schoolName} is now active. Login: ${loginLink}`;

  await sendEmail({ to, subject, html, text });
}

/**
 * Notify a user that their registration was rejected.
 */
export async function sendUserRejectedEmail(
  to: string,
  userName: string,
  role: string,
  schoolName: string,
  reason: string,
): Promise<void> {
  const subject = `Update on your AcadFlows registration`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Registration update</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            Hi ${userName}, your ${role} registration at ${schoolName} was not approved.
          </p>

          <div style="background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #92400E; font-size: 14px; margin: 0;">
              <strong>Reason:</strong> ${reason}
            </p>
          </div>

          <p style="color: #78716C; font-size: 14px; line-height: 22px; margin: 24px 0 0;">
            If you believe this is a mistake, contact your school administrator.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `Hi ${userName}, your ${role} registration at ${schoolName} was not approved. Reason: ${reason}`;

  await sendEmail({ to, subject, html, text });
}

/* ─────────────────────────────────────────────────────────────
   STUDENT SELF-REGISTRATION — DUAL RECIPIENT (teacher + admin)
   ───────────────────────────────────────────────────────────── */

/**
 * Notify the class teacher AND the school admin that a student is
 * awaiting approval. Either can approve — first to act wins.
 *
 * Pass `null` for either recipient if unknown (e.g., section has no
 * class teacher assigned). At least one recipient must be present
 * or the send is skipped.
 */
export async function sendStudentPendingApprovalDualEmail(
  teacherEmail: string | null,
  adminEmail: string | null,
  studentName: string,
  studentEmail: string,
  className: string,
  reviewLink: string,
): Promise<void> {
  const recipients = [teacherEmail, adminEmail].filter(
    (e): e is string => !!e && e.trim() !== '',
  );

  if (recipients.length === 0) {
    console.warn(
      '⚠️  No recipients for student pending approval email — skipping send',
    );
    return;
  }

  const subject = `👨‍🎓 Student approval needed: ${studentName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Student approval needed</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            ${studentName} (${studentEmail}) has registered for ${className}.
            Please review and approve or reject.
          </p>

          <p style="color: #78716C; font-size: 14px; line-height: 22px; margin-top: 16px;">
            Either the class teacher or a school admin can approve this
            registration — first to act wins.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${reviewLink}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Review Request
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Student approval needed: ${studentName} (${studentEmail}) for ${className}.\nReview: ${reviewLink}`;

  await Promise.all(
    recipients.map(to =>
      sendEmail({ to, subject, html, text }).catch(err => {
        console.error(`Failed to notify ${to}:`, err);
      }),
    ),
  );
}

/* ─────────────────────────────────────────────────────────────
   ESCALATION
   ───────────────────────────────────────────────────────────── */

/**
 * Remind an approver that pending items are overdue.
 */
export async function sendApprovalReminderEmail(
  to: string,
  approverName: string,
  pendingCount: number,
  link: string,
): Promise<void> {
  const subject = `⏰ ${pendingCount} pending approval${pendingCount === 1 ? '' : 's'} awaiting your action`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #faf7f4; padding: 40px 20px; margin: 0;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px;">
          <h1 style="color: #1E140F; font-size: 22px; font-weight: 700; margin: 0 0 16px;">Pending approvals</h1>

          <p style="color: #78716C; font-size: 15px; line-height: 24px;">
            Hi ${approverName}, you have ${pendingCount} pending approval${pendingCount === 1 ? '' : 's'} waiting.
            Approvals over 72 hours old are escalated to the platform admin.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${link}" style="display: inline-block; background: #DF301C; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px;">
              Review Now
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `You have ${pendingCount} pending approvals. Review at: ${link}`;

  await sendEmail({ to, subject, html, text });
}