import { Request, Response, NextFunction } from 'express';
import { Student } from '../../models/Student';
import { Teacher } from '../../models/Teacher';
import { Tenant } from '../../models/Tenant';
import { Section } from '../../models/Section';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/error-handler';

/**
 * Renders a full HTML document containing N ID cards.
 * The frontend opens this in a new tab and the user prints to PDF.
 *
 * Query params:
 *   ids      — comma-separated list of student or teacher IDs
 *   return   — "html" (default). We return HTML directly, no JSON wrapper.
 */

const BASE_STYLES = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8f8f8;
      padding: 20px;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      max-width: 900px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      page-break-inside: avoid;
      width: 100%;
      aspect-ratio: 1.586;
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e5e5;
    }
    .card-header {
      padding: 12px 16px;
      color: white;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .card-header .logo {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      overflow: hidden;
    }
    .card-header .logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .card-header .school {
      flex: 1;
      min-width: 0;
    }
    .card-header .school-name {
      font-weight: 700;
      font-size: 13px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-header .school-sub {
      font-size: 9px;
      opacity: 0.85;
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-body {
      flex: 1;
      padding: 12px 16px;
      display: flex;
      gap: 12px;
    }
    .photo-wrap {
      width: 68px;
      height: 82px;
      border-radius: 8px;
      overflow: hidden;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid #e5e5e5;
    }
    .photo-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-wrap .initials {
      font-size: 22px;
      font-weight: 700;
      color: #888;
    }
    .info {
      flex: 1;
      min-width: 0;
    }
    .info .name {
      font-weight: 700;
      font-size: 14px;
      color: #1a1a1a;
      margin-bottom: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .info .field {
      display: flex;
      gap: 6px;
      font-size: 10px;
      margin-bottom: 3px;
      line-height: 1.3;
    }
    .info .field .label {
      color: #888;
      min-width: 50px;
      flex-shrink: 0;
    }
    .info .field .value {
      color: #1a1a1a;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-footer {
      padding: 8px 16px;
      font-size: 9px;
      color: #888;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-footer .id-mono {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: #1a1a1a;
      font-size: 10px;
    }
    @media print {
      body { background: white; padding: 0; }
      .card-grid { max-width: 100%; gap: 8px; }
      .card { box-shadow: none; }
      .no-print { display: none; }
    }
    .no-print {
      max-width: 900px;
      margin: 0 auto 20px;
      padding: 12px 16px;
      background: #FFF1D1;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
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

function escapeHtml(s: any): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function renderHeader(tenant: any, settings: any) {
  const primary = settings.primaryColor || '#DF301C';
  const logoUrl = settings.logoUrl || tenant.logoUrl || '';
  const initials = (tenant.name || 'AF')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return `
    <div class="card-header" style="background: linear-gradient(135deg, ${primary}, ${primary}dd);">
      <div class="logo">
        ${logoUrl ? `<img src="${logoUrl}" alt="" />` : escapeHtml(initials)}
      </div>
      <div class="school">
        <div class="school-name">${escapeHtml(tenant.name)}</div>
        <div class="school-sub">${escapeHtml(settings.affiliation || 'School ID Card')}</div>
      </div>
    </div>
  `;
}

function renderStudentCard(student: any, tenant: any, settings: any, sectionName: string) {
  const photo = student.photoUrl || '';
  const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();
  const dob = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString('en-IN')
    : '—';
  const validUpto = new Date(new Date().getFullYear() + 1, 2, 31).toLocaleDateString('en-IN');

  return `
    <div class="card">
      ${renderHeader(tenant, settings)}
      <div class="card-body">
        <div class="photo-wrap">
          ${
            photo
              ? `<img src="${escapeHtml(photo)}" alt="" />`
              : `<span class="initials">${escapeHtml(initials)}</span>`
          }
        </div>
        <div class="info">
          <div class="name">${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</div>
          <div class="field"><span class="label">Adm. No</span><span class="value">${escapeHtml(student.admissionNo)}</span></div>
          <div class="field"><span class="label">Class</span><span class="value">${escapeHtml(student.grade)}${sectionName ? ` - ${escapeHtml(sectionName)}` : ''}</span></div>
          <div class="field"><span class="label">Roll No</span><span class="value">${escapeHtml(student.rollNo)}</span></div>
          <div class="field"><span class="label">DOB</span><span class="value">${escapeHtml(dob)}</span></div>
          <div class="field"><span class="label">Blood</span><span class="value">${escapeHtml(student.bloodGroup || '—')}</span></div>
        </div>
      </div>
      <div class="card-footer">
        <span class="id-mono">${escapeHtml(student.admissionNo)}</span>
        <span>Valid till ${validUpto}</span>
      </div>
    </div>
  `;
}

function renderTeacherCard(teacher: any, tenant: any, settings: any) {
  const photo = teacher.photoUrl || '';
  const initials = `${teacher.firstName?.[0] || ''}${teacher.lastName?.[0] || ''}`.toUpperCase();
  const validUpto = new Date(new Date().getFullYear() + 1, 2, 31).toLocaleDateString('en-IN');

  return `
    <div class="card">
      ${renderHeader(tenant, settings)}
      <div class="card-body">
        <div class="photo-wrap">
          ${
            photo
              ? `<img src="${escapeHtml(photo)}" alt="" />`
              : `<span class="initials">${escapeHtml(initials)}</span>`
          }
        </div>
        <div class="info">
          <div class="name">${escapeHtml(teacher.firstName)} ${escapeHtml(teacher.lastName)}</div>
          <div class="field"><span class="label">Emp. ID</span><span class="value">${escapeHtml(teacher.employeeId)}</span></div>
          <div class="field"><span class="label">Role</span><span class="value">${escapeHtml(teacher.employmentType || 'Teacher')}</span></div>
          <div class="field"><span class="label">Email</span><span class="value">${escapeHtml(teacher.email)}</span></div>
          <div class="field"><span class="label">Phone</span><span class="value">+91 ${escapeHtml(teacher.phone)}</span></div>
          <div class="field"><span class="label">Joined</span><span class="value">${
            teacher.joiningDate
              ? new Date(teacher.joiningDate).toLocaleDateString('en-IN')
              : '—'
          }</span></div>
        </div>
      </div>
      <div class="card-footer">
        <span class="id-mono">${escapeHtml(teacher.employeeId)}</span>
        <span>Valid till ${validUpto}</span>
      </div>
    </div>
  `;
}

function renderPage(title: string, body: string) {
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
          // Auto-open print dialog after a short delay
          window.addEventListener('load', () => {
            setTimeout(() => window.print(), 500);
          });
        </script>
      </body>
    </html>
  `;
}

export class DocumentsController {
  /**
   * GET /documents/id-cards/students?ids=id1,id2,id3
   * Also supports ?sectionId=X or ?grade=Y to auto-select.
   */
  static async studentIdCards(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { ids, sectionId, grade } = req.query;

      const query: any = {
        tenantId: authReq.user.tenantId,
        isDeleted: false,
        status: 'active',
      };

      if (ids) {
        const idList = String(ids).split(',').filter(Boolean);
        if (idList.length === 0) throw new AppError('No student IDs provided', 400);
        query._id = { $in: idList };
      } else if (sectionId) {
        query.sectionId = sectionId;
      } else if (grade) {
        query.grade = grade;
      } else {
        throw new AppError('Provide `ids`, `sectionId`, or `grade`', 400);
      }

      const [students, tenant] = await Promise.all([
        Student.find(query).sort({ rollNo: 1 }).lean(),
        Tenant.findById(authReq.user.tenantId).lean(),
      ]);

      if (!tenant) throw new AppError('Tenant not found', 404);
      if (students.length === 0) throw new AppError('No students found', 404);

      const settings = tenant.settings || {};

      // Section names
      const sectionIds = students
        .map(s => s.sectionId)
        .filter((id): id is string => Boolean(id));
      const sections = await Section.find({
        tenantId: authReq.user.tenantId,
        _id: { $in: sectionIds },
      }).lean();
      const sectionMap = new Map(sections.map(s => [s._id.toString(), s.name]));

      const cards = students.map(s => {
        const sectionName = s.sectionId
          ? sectionMap.get(s.sectionId) || s.section || ''
          : s.section || '';
        return renderStudentCard(s, tenant, settings, sectionName);
      });

      const html = renderPage(
        `Student ID Cards (${students.length})`,
        `<div class="card-grid">${cards.join('')}</div>`,
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /documents/id-cards/teachers?ids=id1,id2,id3
   * Or omit `ids` for all active teachers.
   */
  static async teacherIdCards(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { ids } = req.query;

      const query: any = {
        tenantId: authReq.user.tenantId,
        isDeleted: false,
        status: 'active',
      };

      if (ids) {
        const idList = String(ids).split(',').filter(Boolean);
        if (idList.length === 0) throw new AppError('No teacher IDs provided', 400);
        query._id = { $in: idList };
      }

      const [teachers, tenant] = await Promise.all([
        Teacher.find(query).sort({ firstName: 1 }).lean(),
        Tenant.findById(authReq.user.tenantId).lean(),
      ]);

      if (!tenant) throw new AppError('Tenant not found', 404);
      if (teachers.length === 0) throw new AppError('No teachers found', 404);

      const settings = tenant.settings || {};
      const cards = teachers.map(t => renderTeacherCard(t, tenant, settings));

      const html = renderPage(
        `Teacher ID Cards (${teachers.length})`,
        `<div class="card-grid">${cards.join('')}</div>`,
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error) {
      next(error);
    }
  }
}