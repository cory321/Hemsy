'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { EmailRepository } from '@/lib/services/email/email-repository';
import { EmailLog, EmailStatistics } from '@/types/email';
import { EmailLogQuerySchema } from '@/lib/validations/email';
import { startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';
import { ensureUserAndShop } from '../users';

/**
 * Get email logs with filters
 */
export async function getEmailLogs(
  params: Partial<z.infer<typeof EmailLogQuerySchema>> = {}
): Promise<{
  success: boolean;
  data?: {
    logs: EmailLog[];
    total: number;
  };
  error?: string;
}> {
  try {
    // Validate input
    const validatedParams = EmailLogQuerySchema.parse(params);

    const { user } = await ensureUserAndShop();

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, user.id);

    const result = await repository.getEmailLogs(validatedParams);

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to get email logs:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid query parameters',
      };
    }

    return {
      success: false,
      error: 'Failed to load email logs',
    };
  }
}

/**
 * Get email statistics
 */
export async function getEmailStatistics(params: {
  startDate: string;
  endDate: string;
}): Promise<{
  success: boolean;
  data?: EmailStatistics;
  error?: string;
}> {
  try {
    const { user } = await ensureUserAndShop();

    const supabase = await createClient();
    const repository = new EmailRepository(supabase, user.id);

    // Get all logs for the date range
    const { logs } = await repository.getEmailLogs({
      startDate: startOfDay(new Date(params.startDate)).toISOString(),
      endDate: endOfDay(new Date(params.endDate)).toISOString(),
      limit: 1000, // High limit for statistics
    });

    // Calculate statistics
    const statistics: EmailStatistics = {
      total: logs.length,
      sent: logs.filter((log) => log.status === 'sent').length,
      failed: logs.filter((log) => log.status === 'failed').length,
      pending: logs.filter((log) => log.status === 'pending').length,
      byType: {
        appointment_scheduled: 0,
        appointment_rescheduled: 0,
        appointment_canceled: 0,
        payment_link: 0,
        appointment_confirmation_request: 0,
        appointment_confirmed: 0,
      },
      dailyCounts: [],
    };

    // Count by type
    const emailTypes = [
      'appointment_scheduled',
      'appointment_rescheduled',
      'appointment_canceled',
      'payment_link',
      'appointment_confirmation_request',
      'appointment_confirmed',
    ] as const;

    emailTypes.forEach((type) => {
      statistics.byType[type] = logs.filter(
        (log) => log.email_type === type
      ).length;
    });

    // Calculate daily counts
    const days = eachDayOfInterval({
      start: new Date(params.startDate),
      end: new Date(params.endDate),
    });

    statistics.dailyCounts = days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const count = logs.filter((log) => {
        const logDate = new Date(log.created_at);
        return logDate >= dayStart && logDate <= dayEnd;
      }).length;

      return {
        date: format(day, 'yyyy-MM-dd'),
        count,
      };
    });

    return { success: true, data: statistics };
  } catch (error) {
    console.error('Failed to get email statistics:', error);
    return {
      success: false,
      error: 'Failed to load email statistics',
    };
  }
}

/**
 * Get single email log details
 */
export async function getEmailLog(emailLogId: string): Promise<{
  success: boolean;
  data?: EmailLog;
  error?: string;
}> {
  try {
    const { user } = await ensureUserAndShop();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', emailLogId)
      .eq('created_by', user.id)
      .single();

    if (error || !data) {
      return { success: false, error: 'Email log not found' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to get email log:', error);
    return {
      success: false,
      error: 'Failed to load email log',
    };
  }
}

/**
 * Delete old email logs (cleanup)
 */
export async function deleteOldEmailLogs(daysToKeep: number = 90): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const { user } = await ensureUserAndShop();

    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await supabase
      .from('email_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('created_by', user.id)
      .select('id');

    if (error) {
      throw error;
    }

    return {
      success: true,
      deletedCount: data?.length || 0,
    };
  } catch (error) {
    console.error('Failed to delete old email logs:', error);
    return {
      success: false,
      error: 'Failed to delete old logs',
    };
  }
}
