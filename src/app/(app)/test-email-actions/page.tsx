import {
  getEmailTemplates,
  testEmailDelivery,
  previewEmailTemplate,
  getTemplateVariables,
} from '@/lib/actions/emails';

async function TestEmailForm() {
  const handleTestEmail = async () => {
    'use server';
    const result = await testEmailDelivery();
    console.log('Test email result:', result);
  };

  const handlePreview = async () => {
    'use server';
    const result = await previewEmailTemplate('appointment_scheduled');
    console.log('Preview result:', result);
  };

  const handleGetVariables = async () => {
    'use server';
    const result = await getTemplateVariables('appointment_scheduled');
    console.log('Variables result:', result);
  };

  return (
    <div className="p-4 space-y-4">
      <form action={handleTestEmail}>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Email Delivery
        </button>
      </form>

      <form action={handlePreview}>
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Preview Appointment Template
        </button>
      </form>

      <form action={handleGetVariables}>
        <button
          type="submit"
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          Get Template Variables
        </button>
      </form>
    </div>
  );
}

export default async function TestEmailActions() {
  const templatesResult = await getEmailTemplates();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Email Actions Test</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Email Templates</h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(templatesResult, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <TestEmailForm />
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-700">
          <strong>Note:</strong> Check the browser console and server logs for
          action results.
        </p>
      </div>
    </div>
  );
}
