'use client';

import React, { useState, useEffect } from 'react';
import { EmailType } from '@/types/email';

interface EmailTemplate {
  type: EmailType;
  name: string;
  description: string;
}

export function EmailPreviewClient() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailType | null>(
    null
  );
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/email/preview/list');
      const data = await response.json();
      setTemplates(data.available);
      if (data.available.length > 0) {
        setSelectedTemplate(data.available[0].type);
      }
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading email templates...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Template List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Templates</h2>
          </div>
          <div className="p-2">
            {templates.map((template) => (
              <button
                key={template.type}
                onClick={() => setSelectedTemplate(template.type)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedTemplate === template.type
                    ? 'bg-blue-50 text-blue-900 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode('html')}
                className={`px-3 py-1 text-sm rounded-md ${
                  previewMode === 'html'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                HTML
              </button>
              <button
                onClick={() => setPreviewMode('text')}
                className={`px-3 py-1 text-sm rounded-md ${
                  previewMode === 'text'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Text
              </button>
              {selectedTemplate && (
                <a
                  href={`/api/email/preview?type=${selectedTemplate}&format=${previewMode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm bg-green-100 text-green-900 rounded-md hover:bg-green-200"
                >
                  Open in New Tab
                </a>
              )}
            </div>
          </div>
          <div className="p-0">
            {selectedTemplate && (
              <EmailPreview emailType={selectedTemplate} format={previewMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EmailPreviewProps {
  emailType: EmailType;
  format: 'html' | 'text';
}

function EmailPreview({ emailType, format }: EmailPreviewProps) {
  const previewUrl = `/api/email/preview?type=${emailType}&format=${format}`;

  if (format === 'html') {
    return (
      <iframe
        src={previewUrl}
        className="w-full h-96 border-0"
        title={`Email preview: ${emailType}`}
      />
    );
  }

  return (
    <div className="p-4">
      <iframe
        src={previewUrl}
        className="w-full h-96 border border-gray-200 rounded font-mono text-sm bg-gray-50"
        title={`Email preview: ${emailType}`}
      />
    </div>
  );
}
