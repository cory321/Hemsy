import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailTemplateEditor } from '@/app/(app)/settings/components/emails/templates/EmailTemplateEditor';
import {
  updateEmailTemplate,
  previewEmailTemplate,
  getTemplateVariables,
  testEmailTemplate,
} from '@/lib/actions/emails';
import { useToast } from '@/hooks/useToast';

// Mock dependencies
jest.mock('@/lib/config/email.config', () => ({
  resend: {},
  emailConfig: {
    from: {
      email: 'test@example.com',
      name: 'Test',
    },
    retryDelay: 60000,
    maxRetries: 3,
  },
}));
jest.mock('@/lib/actions/emails');
jest.mock('@/hooks/useToast');

describe('EmailTemplateEditor - Test Email Functionality', () => {
  const mockOnClose = jest.fn();
  const mockShowToast = jest.fn();

  const mockTemplate = {
    id: 'test-template-id',
    user_id: 'test-user-id',
    email_type: 'appointment_scheduled' as const,
    subject: 'Appointment Scheduled',
    body: 'Your appointment is scheduled for {appointment_date}',
    is_active: true,
    is_default: false,
    created_by: 'user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockVariables = [
    {
      key: 'client_name',
      description: 'Client name',
      example: 'John Doe',
    },
    {
      key: 'appointment_date',
      description: 'Appointment date',
      example: 'January 1, 2024',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
    (getTemplateVariables as jest.Mock).mockResolvedValue({
      success: true,
      data: mockVariables,
    });
    (updateEmailTemplate as jest.Mock).mockResolvedValue({ success: true });
    (previewEmailTemplate as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        subject: 'Appointment Scheduled',
        body: 'Your appointment is scheduled for January 1, 2024',
        variables: ['client_name', 'appointment_date'],
      },
    });
    (testEmailTemplate as jest.Mock).mockResolvedValue({ success: true });
  });

  it('should render Send Test Email button', async () => {
    await act(async () => {
      render(
        <EmailTemplateEditor template={mockTemplate} onClose={mockOnClose} />
      );
    });

    expect(screen.getByText('Send Test Email')).toBeInTheDocument();
  });

  it('should send test email when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <EmailTemplateEditor template={mockTemplate} onClose={mockOnClose} />
    );

    const sendButton = screen.getByText('Send Test Email');
    await user.click(sendButton);

    await waitFor(() => {
      expect(testEmailTemplate).toHaveBeenCalledWith('appointment_scheduled');
      expect(mockShowToast).toHaveBeenCalledWith(
        'Test email sent! Check your inbox.',
        'success'
      );
    });
  });

  it('should show loading state while sending test email', async () => {
    const user = userEvent.setup();
    (testEmailTemplate as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(
      <EmailTemplateEditor template={mockTemplate} onClose={mockOnClose} />
    );

    const sendButton = screen.getByText('Send Test Email');

    await act(async () => {
      await user.click(sendButton);
    });

    // Wait for loading state to appear
    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    // Wait for loading state to disappear and button to return to normal
    await waitFor(() => {
      expect(screen.getByText('Send Test Email')).toBeInTheDocument();
    });
  });

  it('should save pending changes before sending test email', async () => {
    const user = userEvent.setup();
    render(
      <EmailTemplateEditor template={mockTemplate} onClose={mockOnClose} />
    );

    // Make a change to the template
    const subjectInput = screen.getByLabelText('Subject');
    await user.clear(subjectInput);
    await user.type(subjectInput, 'Updated Subject');

    // Click send test email
    const sendButton = screen.getByText('Send Test Email');
    await user.click(sendButton);

    await waitFor(() => {
      // Should save the template first
      expect(updateEmailTemplate).toHaveBeenCalledWith({
        emailType: 'appointment_scheduled',
        subject: 'Updated Subject',
        body: mockTemplate.body,
      });
      // Then send the test email
      expect(testEmailTemplate).toHaveBeenCalledWith('appointment_scheduled');
    });
  });

  it('should handle test email sending errors', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to send test email';
    (testEmailTemplate as jest.Mock).mockResolvedValue({
      success: false,
      error: errorMessage,
    });

    render(
      <EmailTemplateEditor template={mockTemplate} onClose={mockOnClose} />
    );

    const sendButton = screen.getByText('Send Test Email');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(errorMessage, 'error');
    });
  });

  it('should disable send button while sending', async () => {
    const user = userEvent.setup();
    (testEmailTemplate as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(
      <EmailTemplateEditor template={mockTemplate} onClose={mockOnClose} />
    );

    const sendButton = screen.getByRole('button', { name: /send test email/i });
    await user.click(sendButton);

    expect(sendButton).toBeDisabled();

    await waitFor(() => {
      expect(sendButton).not.toBeDisabled();
    });
  });

  it('should handle exceptions during test email sending', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Network error';
    (testEmailTemplate as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <EmailTemplateEditor template={mockTemplate} onClose={mockOnClose} />
    );

    const sendButton = screen.getByText('Send Test Email');
    await user.click(sendButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(errorMessage, 'error');
    });
  });

  it('should maintain other button functionality while sending test email', async () => {
    const user = userEvent.setup();
    (testEmailTemplate as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    render(
      <EmailTemplateEditor template={mockTemplate} onClose={mockOnClose} />
    );

    const sendButton = screen.getByText('Send Test Email');
    const previewButton = screen.getByText('Preview');
    const saveButton = screen.getByText('Save Template');

    await user.click(sendButton);

    // Other buttons should still be enabled
    expect(previewButton).not.toBeDisabled();
    expect(saveButton).toBeDisabled(); // Disabled because no changes made

    await waitFor(() => {
      expect(screen.getByText('Send Test Email')).toBeInTheDocument();
    });
  });
});
