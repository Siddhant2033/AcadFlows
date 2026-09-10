import mongoose from 'mongoose';
import { Tenant } from '../../models/Tenant';
import { AppError } from '../../middleware/error-handler';
import { Tenant as TenantType } from '@acadflows/shared';
import { 
  generateUniqueSchoolCode, 
  validateSchoolCode, 
  formatSchoolCode,
  normalizeSchoolCode 
} from '../../utils/school-code';

export class TenantService {
  static async create(data: Partial<TenantType>): Promise<any> {
    // Validate required fields
    if (!data.name || !data.slug) {
      throw new AppError('Name and slug are required', 400);
    }

    // Check if slug already exists
    const existingSlug = await Tenant.findOne({ slug: data.slug });
    if (existingSlug) {
      throw new AppError('Tenant with this slug already exists', 409);
    }

    // Generate unique school code
    const schoolCode = await generateUniqueSchoolCode();

    const tenant = await Tenant.create({
      ...data,
      schoolCode,
    });
    
    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(schoolCode);
    tenantObj.id = tenant._id;
    
    return tenantObj;
  }

  static async getBySchoolCode(schoolCode: string): Promise<any> {
    // Normalize code (remove hyphens, spaces, uppercase)
    const normalizedCode = normalizeSchoolCode(schoolCode);
    
    if (!validateSchoolCode(normalizedCode)) {
      throw new AppError('Invalid school code format', 400);
    }
    
    const tenant = await Tenant.findOne({ 
      schoolCode: normalizedCode,
      status: 'active' 
    });
    
    if (!tenant) {
      throw new AppError('School not found with this code', 404);
    }
    
    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(normalizedCode);
    tenantObj.id = tenant._id;
    
    return tenantObj;
  }

  static async getById(id: string): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid tenant ID format', 400);
    }
    
    const tenant = await Tenant.findById(id);
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    
    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(tenant.schoolCode);
    tenantObj.id = tenant._id;
    
    return tenantObj;
  }

  static async getBySlug(slug: string): Promise<any> {
    const tenant = await Tenant.findOne({ slug, status: 'active' });
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    
    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(tenant.schoolCode);
    tenantObj.id = tenant._id;
    
    return tenantObj;
  }

  static async update(id: string, data: Partial<TenantType>): Promise<any> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid tenant ID format', 400);
    }
    
    // If slug is being updated, check uniqueness
    if (data.slug) {
      const existing = await Tenant.findOne({ 
        slug: data.slug,
        _id: { $ne: id }
      });
      if (existing) {
        throw new AppError('Tenant with this slug already exists', 409);
      }
    }
    
    const tenant = await Tenant.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    
    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(tenant.schoolCode);
    tenantObj.id = tenant._id;
    
    return tenantObj;
  }

  static async list(options: { 
    limit?: number; 
    offset?: number; 
    status?: string;
    search?: string;
  }) {
    const filter: any = {};
    if (options.status) {
      filter.status = options.status;
    }
    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { slug: { $regex: options.search, $options: 'i' } },
        { schoolCode: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .limit(options.limit || 20)
        .skip(options.offset || 0)
        .sort({ createdAt: -1 }),
      Tenant.countDocuments(filter),
    ]);

    return {
      items: tenants.map(t => {
        const obj: any = t.toObject();
        obj.formattedSchoolCode = formatSchoolCode(t.schoolCode);
        obj.id = t._id;
        return obj;
      }),
      total,
      limit: options.limit || 20,
      offset: options.offset || 0,
    };
  }

  static async getPublicInfo(slug: string): Promise<any> {
    const tenant = await Tenant.findOne({ slug, status: 'active' });
    if (!tenant) {
      throw new AppError('Tenant not found', 404);
    }
    
    return {
      id: tenant._id,
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      schoolCode: tenant.schoolCode,
      formattedSchoolCode: formatSchoolCode(tenant.schoolCode),
      logoUrl: tenant.logoUrl,
      settings: {
        currency: tenant.settings?.currency,
        timezone: tenant.settings?.timezone,
        language: tenant.settings?.language,
      },
    };
  }

  static async getPublicInfoBySchoolCode(schoolCode: string): Promise<any> {
    const normalizedCode = normalizeSchoolCode(schoolCode);
    
    if (!validateSchoolCode(normalizedCode)) {
      throw new AppError('Invalid school code format', 400);
    }
    
    const tenant = await Tenant.findOne({ 
      schoolCode: normalizedCode,
      status: 'active' 
    });
    
    if (!tenant) {
      throw new AppError('School not found with this code', 404);
    }
    
    return {
      id: tenant._id,
      _id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      schoolCode: tenant.schoolCode,
      formattedSchoolCode: formatSchoolCode(tenant.schoolCode),
      logoUrl: tenant.logoUrl,
      settings: {
        currency: tenant.settings?.currency,
        timezone: tenant.settings?.timezone,
        language: tenant.settings?.language,
      },
    };
  }

  static async validateTenant(tenantId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return false;
    }
    const tenant = await Tenant.findOne({ 
      _id: tenantId, 
      status: 'active' 
    });
    return !!tenant;
  }

  static async validateSchoolCode(schoolCode: string): Promise<{ valid: boolean; tenant?: any }> {
    try {
      // Normalize code: remove spaces, hyphens, and convert to uppercase
      const normalizedCode = normalizeSchoolCode(schoolCode);
      
      // Check format
      if (!validateSchoolCode(normalizedCode)) {
        return { valid: false };
      }
      
      // Search for tenant
      const tenant = await Tenant.findOne({ 
        schoolCode: normalizedCode,
        status: 'active' 
      });
      
      if (!tenant) {
        return { valid: false };
      }
      
      return {
        valid: true,
        tenant: {
          id: tenant._id,
          _id: tenant._id,
          name: tenant.name,
          schoolCode: tenant.schoolCode,
          formattedSchoolCode: formatSchoolCode(tenant.schoolCode),
        }
      };
    } catch (error) {
      console.error('Error validating school code:', error);
      return { valid: false };
    }
  }

  /**
   * Create a new school (for admin registration)
   */
  static async createSchool(data: { 
    name: string; 
    slug?: string; 
    address?: string;
    phone?: string;
    email?: string;
  }): Promise<any> {
    // Validate required fields
    if (!data.name) {
      throw new AppError('School name is required', 400);
    }

    // Generate slug from name if not provided
    let slug = data.slug;
    if (!slug) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Check if slug already exists
    const existingSlug = await Tenant.findOne({ slug });
    if (existingSlug) {
      // Append random number if slug exists
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // Generate unique school code
    const schoolCode = await generateUniqueSchoolCode();

    const tenant = await Tenant.create({
      name: data.name,
      slug,
      schoolCode,
      address: data.address || '',
      phone: data.phone || '',
      email: data.email || '',
      status: 'active',
    });
    
    const tenantObj: any = tenant.toObject();
    tenantObj.formattedSchoolCode = formatSchoolCode(schoolCode);
    tenantObj.id = tenant._id;
    
    console.log('🏫 School created:', {
      id: tenant._id,
      name: tenant.name,
      schoolCode: tenant.schoolCode,
    });
    
    return tenantObj;
  }

  /**
   * Check if school has an admin
   */
  static async hasAdmin(tenantId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return false;
    }
    
    const User = mongoose.model('User');
    const admin = await User.findOne({ 
      tenantId, 
      role: 'admin',
      status: 'active' 
    });
    
    return !!admin;
  }
}