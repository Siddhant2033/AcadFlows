import mongoose from 'mongoose';
import { config } from '../config';
import { Tenant } from '../models/Tenant';

async function seedTenant() {
  await mongoose.connect(config.mongodb.uri);
  
  const tenant = await Tenant.create({
    name: 'Demo School',
    slug: 'demo-school',
    status: 'active',
    address: '123 Education Street',
    phone: '+1234567890',
    email: 'info@demoschool.com',
    settings: {
      currency: 'USD',
      timezone: 'UTC',
    }
  });
  
  console.log('✅ Tenant created with ID:', tenant._id);
  console.log('Use this ID for registration:', tenant._id.toString());
  
  await mongoose.disconnect();
}

seedTenant().catch(console.error);