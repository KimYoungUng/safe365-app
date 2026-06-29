const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const content = fs.readFileSync('c:/Users/윤성국/Desktop/mob/src/lib/supabase.js', 'utf8');
const urlMatch = content.match(/const supabaseUrl = ['"]([^'"]+)['"]/);
const keyMatch = content.match(/const supabaseAnonKey = ['"]([^'"]+)['"]/);

if (urlMatch && keyMatch) {
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  supabase.from('companies').select('*').limit(1).then(({data, error}) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Columns:', Object.keys(data[0] || {}));
    }
  });
} else {
  console.log('Credentials not found');
}
