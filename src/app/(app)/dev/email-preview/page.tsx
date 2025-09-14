import React from 'react';
import { EmailPreviewClient } from './EmailPreviewClient';

export default function EmailPreviewPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Email Preview</h1>
        <p className="mt-2 text-gray-600">
          Preview React Email templates during development
        </p>
      </div>

      <EmailPreviewClient />
    </div>
  );
}
