import { createClient } from '@supabase/supabase-js';
import { MOCK_USERS, MOCK_COMPANIES } from './src/mockData.js';

const supabaseUrl = 'https://ilatjsfsnghykmoyxvor.supabase.co';
const supabaseAnonKey = 'sb_publishable_Pht1dsgsChLmQIpkfIDLYQ_FemfM8qn';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('Seeding Companies...');
  const companiesToSeed = [
    {
      id: 'SYSTEM',
      name: '시스템 관리',
      representative: '운영자',
      contact: '000-0000-0000',
      status: '활성'
    },
    ...MOCK_COMPANIES.map(c => ({
      id: c.id,
      name: c.name,
      representative: c.representative || null,
      contact: c.contact || null,
      status: c.status || '활성',
      manager_name: c.managerName || null,
      manager_phone: c.managerPhone || null,
      address: c.address || null,
      latitude: c.latitude || null,
      longitude: c.longitude || null,
    }))
  ];

  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .upsert(companiesToSeed);
  
  if (companyError) {
    console.error('Error seeding companies:', companyError);
  } else {
    console.log('Companies seeded successfully.');
  }

  console.log('Seeding Users...');
  const { data: users, error: userError } = await supabase
    .from('users')
    .upsert(MOCK_USERS.map(u => ({
      id: u.id,
      password: u.password,
      name: u.name,
      role: u.role,
      role_code: u.roleCode,
      department: u.department || null,
      company_id: u.companyId || null,
      base_salary: u.baseSalary || 0,
    })));

  if (userError) {
    console.error('Error seeding users:', userError);
  } else {
    console.log('Users seeded successfully.');
  }
}

seed();
