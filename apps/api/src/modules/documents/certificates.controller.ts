import { Request, Response, NextFunction } from 'express';
import { Student } from '../../models/Student';
import { Tenant } from '../../models/Tenant';
import { Section } from '../../models/Section';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/error-handler';
import crypto from 'crypto';

/* ─────────────────────────────────────────────────────────────
   Styles shared by all certificate templates
   ───────────────────────────────────────────────────────────── */

const BASE_STYLES = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #f4f4f4;
      padding: 20px;
    }
    .certificate {
      background: white;
      width: 800px;
      min-height: 560px;
      margin: 20px auto;
      padding: 50px 60px;
      position: relative;
      box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      page-break-after: always;
    }
    .certificate:last-child { page-break-after: auto; }
    .border-outer {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 2px solid #DF301C;
      pointer-events: none;
    }
    .border-inner {
      position: absolute;
      top: 26px;
      left: 26px;
      right: 26px;
      bottom: 26px;
      border: 1px solid #E8E0D6;
      pointer-events: none;
    }
    .content {
      position: relative;
      z-index: 1;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
      padding-bottom: 16px;
      border-bottom: 2px solid #DF301C;
    }
    .logo {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      background: #DF301C;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 22px;
      overflow: hidden;
      flex-shrink: 0;
      font-family: 'Arial', sans-serif;
    }
    .logo img { width: 100%; height: 100%; object-fit: cover; }
    .school-info { flex: 1; min-width: 0; }
    .school-name {
      font-size: 26px;
      font-weight: bold;
      color: #1E140F;
      letter-spacing: 0.02em;
    }
    .school-sub {
      font-size: 12px;
      color: #78716C;
      margin-top: 4px;
      font-family: 'Arial', sans-serif;
    }
    .school-affiliation {
      font-size: 11px;
      color: #78716C;
      margin-top: 2px;
      font-family: 'Arial', sans-serif;
    }
    .serial {
      text-align: right;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #78716C;
    }
    .serial strong { color: #1E140F; font-size: 12px; }
    .title {
      text-align: center;
      margin: 40px 0 24px;
      font-size: 30px;
      font-weight: bold;
      color: #1E140F;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    .title::after {
      content: '';
      display: block;
      width: 80px;
      height: 3px;
      background: #DF301C;
      margin: 12px auto 0;
    }
    .body-text {
      font-size: 16px;
      line-height: 1.9;
      color: #1E140F;
      text-align: justify;
    }
    .body-text .field {
      display: inline-block;
      border-bottom: 1px dotted #78716C;
      min-width: 180px;
      padding: 0 8px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      color: #1E140F;
      text-align: center;
    }
    .body-text .field-wide { min-width: 240px; }
    .body-text .field-narrow { min-width: 100px; }
    .body-text .field-tiny { min-width: 60px; }
    .body-text .field-name {
      min-width: 300px;
      font-family: 'Georgia', serif;
      font-size: 17px;
    }
    .footer {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .date-block {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      color: #78716C;
    }
    .signature {
      text-align: center;
      min-width: 200px;
    }
    .signature .line {
      border-top: 1px solid #1E140F;
      margin-bottom: 6px;
    }
    .signature .name {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      color: #1E140F;
      font-weight: bold;
    }
    .signature .role {
      font-family: 'Arial', sans-serif;
      font-size: 10px;
      color: #78716C;
      margin-top: 2px;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 100px;
      font-weight: bold;
      color: rgba(223, 48, 28, 0.04);
      pointer-events: none;
      font-family: 'Arial', sans-serif;
      z-index: 0;
    }
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; margin: 0; }
      .no-print { display: none; }
    }
    .no-print {
      max-width: 800px;
      margin: 20px auto;
      padding: 12px 16px;
      background: #FFF1D1;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      font-family: 'Arial', sans-serif;
    }
    .no-print button {
      background: #DF301C;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
    }
    .no-print button:hover { background: #C4270F; }
  </style>
`;

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function escapeHtml(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** Convert number to Indian-format words: 1234 → "One Thousand Two Hundred Thirty-Four" */
function numberToWords(num: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  if (num === 0) return 'Zero';

  const chunk = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000)
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + chunk(n % 100) : '');
    return '';
  };

  // Indian system: crore, lakh, thousand, hundred
  let result = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  if (crore) result += chunk(crore) + ' Crore ';
  if (lakh) result += chunk(lakh) + ' Lakh ';
  if (thousand) result += chunk(thousand) + ' Thousand ';
  if (rest) result += chunk(rest);

  return result.trim();
}

/** Format a Date as "11th September 2026" */
function formatDateLong(date: Date): string {
  const d = new Date(date);
  const day = d.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  const suffix =
    day % 10 === 1 && day !== 11 ? 'st' :
    day % 10 === 2 && day !== 12 ? 'nd' :
    day % 10 === 3 && day !== 13 ? 'rd' : 'th';

  return `${day}${suffix} ${month} ${year}`;
}

/** Generate a unique serial number for the certificate */
function generateSerial(prefix: string): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}/${year}/${random}`;
}

function renderHeader(tenant: any, serialPrefix: string) {
  const settings = tenant.settings || {};
  const logoUrl = settings.logoUrl || tenant.logoUrl || '';
  const initials = (tenant.name || 'AF')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const serial = generateSerial(serialPrefix);

  return `
    <div class="header">
      <div class="logo">
        ${logoUrl ? `<img src="${logoUrl}" alt="" />` : escapeHtml(initials)}
      </div>
      <div class="school-info">
        <div class="school-name">${escapeHtml(tenant.name)}</div>
        ${tenant.address ? `<div class="school-sub">${escapeHtml(tenant.address)}</div>` : ''}
        ${settings.affiliation ? `<div class="school-affiliation">Affiliated to ${escapeHtml(settings.affiliation)}${settings.affiliationNumber ? ` · No. ${escapeHtml(settings.affiliationNumber)}` : ''}</div>` : ''}
      </div>
      <div class="serial">
        Serial No.<br/><strong>${escapeHtml(serial)}</strong>
      </div>
    </div>
  `;
}

function renderFooter(tenant: any, date: Date) {
  return `
    <div class="footer">
      <div class="date-block">
        Date: <strong>${escapeHtml(formatDateLong(date))}</strong><br/>
        Place: ${escapeHtml(tenant.address || '___________')}
      </div>
      <div class="signature">
        <div class="line"></div>
        <div class="name">Principal</div>
        <div class="role">${escapeHtml(tenant.name)}</div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────
   Certificate Templates
   ───────────────────────────────────────────────────────────── */

function renderBonafide(student: any, tenant: any, sectionName: string, date: Date): string {
  const body = `
    <div class="body-text">
      This is to certify that <span class="field field-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</span>
      is a bonafide student of this school, studying in
      <span class="field field-wide">${escapeHtml(student.grade)}${sectionName ? ` - ${escapeHtml(sectionName)}` : ''}</span>
      during the current academic year.
      <br/><br/>
      As per our records, the student bears Admission Number
      <span class="field">${escapeHtml(student.admissionNo)}</span>
      and Roll Number <span class="field field-narrow">${escapeHtml(student.rollNo)}</span>.
      The student's date of birth is recorded as
      <span class="field field-wide">${escapeHtml(formatDateLong(student.dateOfBirth))}</span>.
      <br/><br/>
      This certificate is issued upon the request of the student for official purposes.
    </div>
  `;

  return `
    <div class="certificate">
      <div class="watermark">BONAFIDE</div>
      <div class="border-outer"></div>
      <div class="border-inner"></div>
      <div class="content">
        ${renderHeader(tenant, 'BON')}
        <div class="title">Bonafide Certificate</div>
        ${body}
        ${renderFooter(tenant, date)}
      </div>
    </div>
  `;
}

function renderTransfer(student: any, tenant: any, sectionName: string, date: Date): string {
  const year = new Date().getFullYear();
  const academicYear = `${year}-${String(year + 1).slice(-2)}`;

  const body = `
    <div class="body-text">
      This is to certify that <span class="field field-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</span>,
      son/daughter of <span class="field field-wide">${escapeHtml(student.guardians?.[0]?.name || '___________')}</span>,
      was a student of this school from
      <span class="field field-narrow">${escapeHtml(student.enrollments?.[0]?.enrollmentDate ? formatDateLong(student.enrollments[0].enrollmentDate) : '___________')}</span>
      to <span class="field field-narrow">${escapeHtml(formatDateLong(date))}</span>.
      <br/><br/>
      The student was studying in <span class="field">${escapeHtml(student.grade)}${sectionName ? ` - ${escapeHtml(sectionName)}` : ''}</span>
      during the academic year <span class="field field-narrow">${escapeHtml(academicYear)}</span>.
      <br/><br/>
      The student's date of birth is <span class="field field-wide">${escapeHtml(formatDateLong(student.dateOfBirth))}</span>
      (in words: <em>${escapeHtml(formatDateLong(student.dateOfBirth))}</em>).
      Admission Number is <span class="field">${escapeHtml(student.admissionNo)}</span>.
      <br/><br/>
      The student has <strong>no dues</strong> pending against the school and is being transferred
      at the request of the parent/guardian. We wish the student success in future endeavors.
    </div>
  `;

  return `
    <div class="certificate">
      <div class="watermark">TRANSFER</div>
      <div class="border-outer"></div>
      <div class="border-inner"></div>
      <div class="content">
        ${renderHeader(tenant, 'TC')}
        <div class="title">Transfer Certificate</div>
        ${body}
        ${renderFooter(tenant, date)}
      </div>
    </div>
  `;
}

function renderCharacter(student: any, tenant: any, sectionName: string, date: Date): string {
  const body = `
    <div class="body-text">
      This is to certify that <span class="field field-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</span>,
      a student of <span class="field">${escapeHtml(student.grade)}${sectionName ? ` - ${escapeHtml(sectionName)}` : ''}</span>
      with Admission Number <span class="field">${escapeHtml(student.admissionNo)}</span>,
      has been a student of this institution.
      <br/><br/>
      During their tenure at our school, we found the student to be of <strong>good moral character</strong>
      and conduct. The student has been regular in attendance and has shown respect towards
      teachers, staff, and fellow students.
      <br/><br/>
      We wish the student all the best in their future academic pursuits and personal growth.
    </div>
  `;

  return `
    <div class="certificate">
      <div class="watermark">CHARACTER</div>
      <div class="border-outer"></div>
      <div class="border-inner"></div>
      <div class="content">
        ${renderHeader(tenant, 'CHR')}
        <div class="title">Character Certificate</div>
        ${body}
        ${renderFooter(tenant, date)}
      </div>
    </div>
  `;
}

function renderStudy(student: any, tenant: any, sectionName: string, date: Date): string {
  const body = `
    <div class="body-text">
      This is to certify that <span class="field field-name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</span>
      is currently studying in <span class="field">${escapeHtml(student.grade)}${sectionName ? ` - ${escapeHtml(sectionName)}` : ''}</span>
      at our school.
      <br/><br/>
      The student is enrolled under Admission Number <span class="field">${escapeHtml(student.admissionNo)}</span>
      and Roll Number <span class="field field-narrow">${escapeHtml(student.rollNo)}</span>.
      Date of Birth as per school records is
      <span class="field field-wide">${escapeHtml(formatDateLong(student.dateOfBirth))}</span>.
      <br/><br/>
      This certificate is issued to enable the student to apply for
      <span class="field field-wide">___________</span>
      and other official purposes as required.
    </div>
  `;

  return `
    <div class="certificate">
      <div class="watermark">STUDY</div>
      <div class="border-outer"></div>
      <div class="border-inner"></div>
      <div class="content">
        ${renderHeader(tenant, 'STU')}
        <div class="title">Study Certificate</div>
        ${body}
        ${renderFooter(tenant, date)}
      </div>
    </div>
  `;
}

function renderPage(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        ${BASE_STYLES}
      </head>
      <body>
        <div class="no-print">
          <span>Ready to print. Click the button to open the print dialog (Save as PDF).</span>
          <button onclick="window.print()">Print / Save PDF</button>
        </div>
        ${body}
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => window.print(), 500);
          });
        </script>
      </body>
    </html>
  `;
}

/* ─────────────────────────────────────────────────────────────
   Controller
   ───────────────────────────────────────────────────────────── */

export class CertificatesController {
  /**
   * GET /documents/certificates/:type/:studentId
   * type: bonafide | transfer | character | study
   */
  static async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { type, studentId } = req.params;

      const validTypes = ['bonafide', 'transfer', 'character', 'study'] as const;
      type CertType = (typeof validTypes)[number];

      if (!validTypes.includes(type as CertType)) {
        throw new AppError(
          `Invalid certificate type. Must be one of: ${validTypes.join(', ')}`,
          400,
        );
      }

      const [student, tenant] = await Promise.all([
        Student.findOne({
          _id: studentId,
          tenantId: authReq.user.tenantId,
          isDeleted: false,
        }).lean(),
        Tenant.findById(authReq.user.tenantId).lean(),
      ]);

      if (!student) throw new AppError('Student not found', 404);
      if (!tenant) throw new AppError('Tenant not found', 404);

      // Section name
      let sectionName = student.section || '';
      if (student.sectionId) {
        const section = await Section.findOne({
          tenantId: authReq.user.tenantId,
          _id: student.sectionId,
        }).lean();
        if (section) sectionName = section.name;
      }

      const date = new Date();

      let html = '';
      let pageTitle = '';

      switch (type as CertType) {
        case 'bonafide':
          html = renderBonafide(student, tenant, sectionName, date);
          pageTitle = 'Bonafide Certificate';
          break;
        case 'transfer':
          html = renderTransfer(student, tenant, sectionName, date);
          pageTitle = 'Transfer Certificate';
          break;
        case 'character':
          html = renderCharacter(student, tenant, sectionName, date);
          pageTitle = 'Character Certificate';
          break;
        case 'study':
          html = renderStudy(student, tenant, sectionName, date);
          pageTitle = 'Study Certificate';
          break;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(renderPage(pageTitle, html));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /documents/certificates/bulk/:type?ids=id1,id2,id3
   * Prints the same certificate type for multiple students.
   */
  static async bulkGenerate(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { type } = req.params;
      const { ids } = req.query;

      const validTypes = ['bonafide', 'transfer', 'character', 'study'] as const;
      type CertType = (typeof validTypes)[number];

      if (!validTypes.includes(type as CertType)) {
        throw new AppError(`Invalid certificate type`, 400);
      }
      if (!ids) {
        throw new AppError('ids query param is required', 400);
      }

      const studentIds = String(ids).split(',').filter(Boolean);
      if (studentIds.length === 0) {
        throw new AppError('No student IDs provided', 400);
      }

      const [students, tenant] = await Promise.all([
        Student.find({
          _id: { $in: studentIds },
          tenantId: authReq.user.tenantId,
          isDeleted: false,
        }).lean(),
        Tenant.findById(authReq.user.tenantId).lean(),
      ]);

      if (!tenant) throw new AppError('Tenant not found', 404);
      if (students.length === 0) throw new AppError('No students found', 404);

      // Build section map
      const sectionIds = students
        .map(s => s.sectionId)
        .filter((id): id is string => Boolean(id));
      const sections = await Section.find({
        tenantId: authReq.user.tenantId,
        _id: { $in: sectionIds },
      }).lean();
      const sectionMap = new Map(sections.map(s => [s._id.toString(), s.name]));

      const date = new Date();
      const certificates = students.map(student => {
        const sectionName = student.sectionId
          ? sectionMap.get(student.sectionId) || student.section || ''
          : student.section || '';

        switch (type as CertType) {
          case 'bonafide':
            return renderBonafide(student, tenant, sectionName, date);
          case 'transfer':
            return renderTransfer(student, tenant, sectionName, date);
          case 'character':
            return renderCharacter(student, tenant, sectionName, date);
          case 'study':
            return renderStudy(student, tenant, sectionName, date);
          default:
            return '';
        }
      });

      const pageTitle = `${type.charAt(0).toUpperCase() + type.slice(1)} Certificates (${students.length})`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(renderPage(pageTitle, certificates.join('')));
    } catch (error) {
      next(error);
    }
  }
}