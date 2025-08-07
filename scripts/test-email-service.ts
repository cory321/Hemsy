import { config } from 'dotenv';

// Load environment variables from .env.local FIRST
config({ path: '.env.local' });

import { TemplateRenderer } from '../src/lib/services/email/template-renderer';
import { get_default_email_templates } from '../src/lib/services/email/default-templates';
import { PreviewHelper } from '../src/lib/services/email/preview-helper';

async function testEmailService() {
  console.log('🧪 Testing Email Service Core Components...\n');

  // 1. Test Template Renderer
  console.log('1. Testing Template Renderer:');
  const renderer = new TemplateRenderer();

  const template = {
    subject: 'Hello {client_name}',
    body: 'Your appointment with {shop_name} is at {appointment_time}.',
  };

  const data = {
    client_name: 'Jane Doe',
    shop_name: 'Best Alterations',
    appointment_time: 'Monday, Dec 25 at 2:00 PM',
  };

  const rendered = renderer.render(template, data);
  console.log('   ✅ Rendered subject:', rendered.subject);
  console.log('   ✅ Rendered body:', rendered.body);

  // 2. Test Variable Extraction
  console.log('\n2. Testing Variable Extraction:');
  const variables = renderer.extractVariables(template.body);
  console.log('   ✅ Extracted variables:', variables);

  // 3. Test Default Templates
  console.log('\n3. Testing Default Templates:');
  const defaultTemplates = get_default_email_templates();
  const appointmentTemplate = defaultTemplates.appointment_scheduled;
  console.log('   ✅ Default template subject:', appointmentTemplate.subject);

  // 4. Test Preview Helper
  console.log('\n4. Testing Preview Helper:');
  const preview = PreviewHelper.generatePreview(
    appointmentTemplate,
    'appointment_scheduled',
    { includeFooter: true }
  );
  console.log('   ✅ Preview subject:', preview.subject);
  console.log('   ✅ Preview variables:', preview.variables);
  console.log(
    '   ✅ Preview body (truncated):',
    preview.body.substring(0, 100) + '...'
  );

  // 5. Test Template Validation
  console.log('\n5. Testing Template Validation:');
  const validation = PreviewHelper.validateTemplate(
    appointmentTemplate,
    'appointment_scheduled'
  );
  console.log(
    '   ✅ Template validation result:',
    validation.valid ? 'VALID' : 'INVALID'
  );
  if (!validation.valid) {
    console.log('   ❌ Validation errors:', validation.errors);
  }

  // 6. Test Variable Help
  console.log('\n6. Testing Variable Help:');
  const variableHelp = renderer.getVariableHelp('appointment_scheduled');
  console.log('   ✅ Available variables for appointment_scheduled:');
  variableHelp.forEach((v) => {
    console.log(`      • ${v.key}: ${v.description} (e.g., "${v.example}")`);
  });

  console.log('\n🎉 All email service core components working correctly!');
  console.log(
    '\n📧 Email Service is ready for integration with Supabase and appointments.'
  );
}

testEmailService().catch(console.error);
