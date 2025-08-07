// Template management
export {
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  resetEmailTemplate,
  previewEmailTemplate,
  getTemplateVariables,
} from './email-templates';

// Email sending
export {
  sendAppointmentScheduledEmail,
  sendAppointmentRescheduledEmail,
  sendAppointmentCanceledEmail,
  sendConfirmationRequestEmail,
  sendPaymentLinkEmail,
  resendEmail,
} from './email-send';

// Monitoring
export {
  getEmailLogs,
  getEmailStatistics,
  getEmailLog,
  deleteOldEmailLogs,
} from './email-monitoring';

// Settings
export {
  getUserEmailSettings,
  updateUserEmailSettings,
  testEmailDelivery,
  testEmailTemplate,
} from './email-settings';

// Confirmation tokens
export {
  confirmAppointment,
  checkConfirmationToken,
} from './confirmation-tokens';
