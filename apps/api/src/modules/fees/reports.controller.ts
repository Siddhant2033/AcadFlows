import { Request, Response, NextFunction } from 'express';
import { FeeReportsService, parseDateRange } from './reports.service';
import { AuthRequest } from '../../middleware/auth';

export class FeeReportsController {
  /**
   * GET /fees/reports/collection
   * Query: preset, from, to, academicYearId, gradeId, sectionId
   */
  static async getCollection(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { preset, from, to, academicYearId, gradeId, sectionId } = req.query;

      const range = parseDateRange(
        preset as string,
        from as string,
        to as string,
      );

      const data = await FeeReportsService.getCollectionSummary(
        authReq.user.tenantId,
        range,
        {
          academicYearId: academicYearId as string,
          gradeId: gradeId as string,
          sectionId: sectionId as string,
        },
      );

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /fees/reports/defaulters
   * Query: academicYearId, gradeId, sectionId, minAmount
   */
  static async getDefaulters(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { academicYearId, gradeId, sectionId, minAmount } = req.query;

      const data = await FeeReportsService.getDefaulters(authReq.user.tenantId, {
        academicYearId: academicYearId as string,
        gradeId: gradeId as string,
        sectionId: sectionId as string,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /fees/reports/daybook
   * Query: preset, from, to, method
   */
  static async getDaybook(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { preset, from, to, method } = req.query;

      const range = parseDateRange(
        preset as string,
        from as string,
        to as string,
      );

      const data = await FeeReportsService.getDaybook(
        authReq.user.tenantId,
        range,
        { method: method as string },
      );

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /fees/reports/students/:studentId/fees
   */
  static async getStudentFeeHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthRequest;
      const { studentId } = req.params;

      const data = await FeeReportsService.getStudentFeeHistory(
        authReq.user.tenantId,
        studentId,
      );

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}