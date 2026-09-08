import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';
import { Tenant as TenantType } from '@school-platform/shared';

export class TenantService {
  static async create(data: Partial<TenantType>): Promise<any> {
    // Check if slug already exists
    const existing = await Tenant.findOne({ slug: data.slug });
    if (existing) {
      throw new AppError('Tenant with this slug already exists', 409);
    }

    const tenant = await Tenant.create(data);
    return tenant.toObject();
  }

  static async getById(id: string): Promise<any> {
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    return tenant.toObject();
  }

  static async getBySlug(slug: string): Promise<any> {
    const tenant = await Tenant.findOne({ slug, status: 'active' });
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    return tenant.toObject();
  }

  static async update(id: string, data: Partial<TenantType>): Promise<any> {
    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    return tenant.toObject();
  }

  static async list(options: { limit?: number; offset?: number; status?: string }) {
    const filter: any = {};
    if (options.status) {
      filter.status = options.status;
    }

    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .limit(options.limit || 20)
        .skip(options.offset || 0)
        .sort({ createdAt: -1 }),
      Tenant.countDocuments(filter),
    ]);

    return {
      items: tenants.map(t => t.toObject()),
      total,
      limit: options.limit || 20,
      offset: options.offset || 0,
    };
  }
}