import mongoose from 'mongoose';
import { config } from '../config';
import { Tenant } from '../models/Tenant';

async function createDefaultTenant() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('📦 Connected to MongoDB');
    
    // Check if any tenant exists
    const existing = await Tenant.findOne({});
    if (existing) {
      console.log('✅ Tenant already exists:');
      console.log(`   Name: ${existing.name}`);
      console.log(`   ID: ${existing._id}`);
      console.log(`   School Code: ${existing.schoolCode}`);
      await mongoose.disconnect();
      return;
    }
    
    // Create default tenant
    const tenant = await Tenant.create({
      name: 'Default School',
      slug: 'default',
      status: 'active',
      address: '123 Default Street',
      phone: '+1-555-000-0000',
      email: 'default@school.com',
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        language: 'en',
      },
    });
    
    console.log('✅ Default tenant created successfully!');
    console.log(`   Name: ${tenant.name}`);
    console.log(`   ID: ${tenant._id}`);
    console.log(`   School Code: ${tenant.schoolCode}`);
    console.log(`   Formatted Code: ${tenant.schoolCode.substring(0, 4)}-${tenant.schoolCode.substring(4, 8)}-${tenant.schoolCode.substring(8, 10)}`);
    
    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error creating default tenant:', error);
    process.exit(1);
  }
}

createDefaultTenant();