import mongoose from 'mongoose';
import { config } from '../config';
import { Tenant } from '../models/Tenant';
import { generateUniqueSchoolCode, formatSchoolCode } from '../utils/school-code';

async function seedSchools() {
  await mongoose.connect(config.mongodb.uri);
  
  const schools = [
    {
      name: 'Springfield Elementary School',
      slug: 'springfield-elementary',
      address: '123 Main St, Springfield',
      phone: '+1234567890',
      email: 'info@springfield.edu',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        language: 'en',
        emailDomain: 'springfield.edu',
      }
    },
    {
      name: 'Riverside High School',
      slug: 'riverside-high',
      address: '456 River Rd, Riverside',
      phone: '+1987654321',
      email: 'info@riverside.edu',
      settings: {
        currency: 'USD',
        timezone: 'America/Los_Angeles',
        language: 'en',
        emailDomain: 'riverside.edu',
      }
    },
    {
      name: 'Oakwood Academy',
      slug: 'oakwood-academy',
      address: '789 Oak St, Oakwood',
      phone: '+1122334455',
      email: 'info@oakwood.edu',
      settings: {
        currency: 'USD',
        timezone: 'America/Chicago',
        language: 'en',
        emailDomain: 'oakwood.edu',
      }
    },
  ];

  console.log('🌱 Seeding schools...\n');

  for (const schoolData of schools) {
    try {
      const schoolCode = await generateUniqueSchoolCode();
      const tenant = await Tenant.create({
        ...schoolData,
        schoolCode,
      });
      
      console.log(`✅ Created: ${tenant.name}`);
      console.log(`   School Code: ${formatSchoolCode(tenant.schoolCode)}`);
      console.log(`   ID: ${tenant._id}\n`);
    } catch (error) {
      if (
        error !== null &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        console.log(`⏭️  Skipped: ${schoolData.name} (already exists)`);
      } else {
        console.error(`❌ Error creating ${schoolData.name}:`, error);
      }
    }
  }

  // List all schools
  console.log('\n📚 All Schools:\n');
  const allSchools = await Tenant.find({}).sort({ name: 1 });
  allSchools.forEach(school => {
    console.log(`   ${school.name}`);
    console.log(`   Code: ${formatSchoolCode(school.schoolCode)}`);
    console.log(`   ID: ${school._id}\n`);
  });

  await mongoose.disconnect();
  console.log('✅ Seeding complete!');
}

seedSchools().catch(console.error);