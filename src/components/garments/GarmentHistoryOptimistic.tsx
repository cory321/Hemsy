'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Avatar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import UpdateIcon from '@mui/icons-material/Update';
import EventIcon from '@mui/icons-material/Event';
import { getGarmentHistory } from '@/lib/actions/garments';
import { format, isToday, isYesterday } from 'date-fns';
import { useGarment } from '@/contexts/GarmentContext';

interface HistoryEntry {
  id: string;
  garment_id: string;
  changed_by: string;
  changed_at: string;
  field_name: string;
  old_value: any;
  new_value: any;
  change_type: string;
  related_service_id?: string | null;
  changed_by_user:
    | {
        first_name?: string;
        last_name?: string;
        email: string;
      }
    | null
    | any;
  // For optimistic updates
  isOptimistic?: boolean;
  isPersisting?: boolean;
}

interface GarmentHistoryOptimisticProps {
  garmentId: string;
}

export default function GarmentHistoryOptimistic({
  garmentId,
}: GarmentHistoryOptimisticProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { optimisticHistoryEntry, historyRefreshSignal } = useGarment();

  // Initial load of history
  useEffect(() => {
    fetchHistory();
  }, [garmentId]);

  // Handle optimistic updates
  useEffect(() => {
    if (optimisticHistoryEntry) {
      // Add the optimistic entry with persisting state
      setHistory((prev) => [
        { ...optimisticHistoryEntry, isPersisting: true },
        ...prev,
      ]);

      // After a short delay, mark it as persisted
      const timer = setTimeout(() => {
        setHistory((prev) =>
          prev.map((entry) =>
            entry.id === optimisticHistoryEntry.id
              ? { ...entry, isPersisting: false, isOptimistic: false }
              : entry
          )
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [optimisticHistoryEntry]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getGarmentHistory(garmentId);

      if (result.success) {
        setHistory(result.history || []);
      } else {
        setError(result.error || 'Failed to load history');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Refresh history after server updates
  const refreshHistory = useCallback(async () => {
    try {
      const result = await getGarmentHistory(garmentId);
      if (result.success) {
        setHistory(result.history || []);
      }
    } catch (err) {
      // Silent refresh failure - we still have the optimistic update
    }
  }, [garmentId]);

  // Listen for refresh signals
  useEffect(() => {
    if (historyRefreshSignal > 0) {
      refreshHistory();
    }
  }, [historyRefreshSignal, refreshHistory]);

  const getChangeIcon = (changeType: string, fieldName?: string) => {
    // Service changes
    if (changeType === 'service_added')
      return { icon: <AddIcon />, color: '#4CAF50' };
    if (changeType === 'service_removed')
      return { icon: <RemoveIcon />, color: '#F44336' };
    if (changeType === 'service_updated')
      return { icon: <EditIcon />, color: '#FF9800' };

    // Field-specific changes
    if (fieldName === 'due_date')
      return { icon: <UpdateIcon />, color: '#2196F3' };
    if (fieldName === 'event_date')
      return { icon: <EventIcon />, color: '#2196F3' };
    if (fieldName === 'stage')
      return { icon: <UpdateIcon />, color: '#2196F3' };

    // Default for other field updates
    return { icon: <EditIcon />, color: '#FF9800' };
  };

  const formatHistoryEntry = (entry: HistoryEntry) => {
    const user = entry.changed_by_user;
    let userName = 'Unknown';

    // Handle different user data formats
    if (user && typeof user === 'object' && !('error' in user)) {
      if (user.first_name && user.last_name) {
        userName = `${user.first_name} ${user.last_name}`;
      } else if (user.email) {
        userName = user.email.split('@')[0]; // Use email username as fallback
      }
    }

    // Safely format the time with validation
    let time = 'Unknown time';
    if (entry.changed_at) {
      const date = new Date(entry.changed_at);
      if (!isNaN(date.getTime())) {
        time = format(date, 'h:mm a');
      }
    }

    const { icon, color } = getChangeIcon(entry.change_type, entry.field_name);

    let title = '';
    let detail = '';

    switch (entry.change_type) {
      case 'field_update':
        const fieldLabels: Record<string, string> = {
          name: 'Name',
          due_date: 'Due date',
          event_date: 'Event date',
          icon: 'Icon',
          fill_color: 'Icon color',
          notes: 'Notes',
          stage: 'Stage',
        };

        const fieldLabel = fieldLabels[entry.field_name] || entry.field_name;

        if (entry.field_name === 'name') {
          title = 'Name changed';
          detail = `"${entry.old_value || ''}" → "${entry.new_value || ''}"`;
        } else if (entry.field_name === 'due_date') {
          title = 'Due date';
          let oldDate = 'not set';
          let newDate = 'not set';

          if (entry.old_value) {
            const oldDateObj = new Date(entry.old_value + 'T12:00:00');
            if (!isNaN(oldDateObj.getTime())) {
              oldDate = format(oldDateObj, 'M/d/yy');
            }
          }

          if (entry.new_value) {
            const newDateObj = new Date(entry.new_value + 'T12:00:00');
            if (!isNaN(newDateObj.getTime())) {
              newDate = format(newDateObj, 'M/d/yy');
            }
          }

          detail = `${oldDate} → ${newDate}`;
        } else if (entry.field_name === 'event_date') {
          title = 'Event date';
          let oldDate = 'not set';
          let newDate = 'not set';

          if (entry.old_value) {
            const oldDateObj = new Date(entry.old_value + 'T12:00:00');
            if (!isNaN(oldDateObj.getTime())) {
              oldDate = format(oldDateObj, 'M/d/yy');
            }
          }

          if (entry.new_value) {
            const newDateObj = new Date(entry.new_value + 'T12:00:00');
            if (!isNaN(newDateObj.getTime())) {
              newDate = format(newDateObj, 'M/d/yy');
            }
          }

          detail = `${oldDate} → ${newDate}`;
        } else if (entry.field_name === 'stage') {
          title = 'Stage updated';
          const oldVal = entry.old_value || 'not set';
          const newVal = entry.new_value || 'not set';
          detail = `${oldVal} → ${newVal}`;
        } else {
          title = `${fieldLabel} updated`;
          if (entry.old_value !== null || entry.new_value !== null) {
            const oldVal = entry.old_value || '';
            const newVal = entry.new_value || '';
            detail = `${oldVal} → ${newVal}`;
          }
        }
        break;

      case 'service_added':
        title = 'Service added';
        detail = entry.new_value?.name || '';
        if (entry.new_value?.quantity && entry.new_value?.unit_price_cents) {
          const price = (entry.new_value.unit_price_cents / 100).toFixed(2);
          detail += ` (${entry.new_value.quantity} @ $${price})`;
        }
        break;

      case 'service_removed':
        title = 'Service removed';
        detail = entry.old_value?.name || '';
        break;

      case 'service_updated':
        title = 'Service updated';
        const serviceName =
          entry.old_value?.service_name || entry.new_value?.service_name;
        detail = serviceName || '';

        const changes = entry.new_value?.changes || [];
        if (changes.length > 0) {
          const changeDescriptions = changes
            .map((change: any) => {
              if (change.field === 'quantity') {
                return `quantity → ${change.new}`;
              } else if (change.field === 'unit_price') {
                return `unit price → $${(change.new / 100).toFixed(2)}`;
              }
              return '';
            })
            .filter(Boolean);

          if (changeDescriptions.length > 0) {
            detail += ` (${changeDescriptions.join(', ')})`;
          }
        }
        break;

      default:
        title = 'Changes made';
        detail = '';
    }

    return { time, title, detail, icon, color, userName };
  };

  // Group history entries by date
  const groupHistoryByDate = (entries: HistoryEntry[]) => {
    const groups: { [key: string]: { date: Date; entries: any[] } } = {};

    entries.forEach((entry) => {
      if (!entry.changed_at) return; // Skip entries without a date

      const date = new Date(entry.changed_at);
      if (isNaN(date.getTime())) return; // Skip invalid dates

      const dateKey = format(date, 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        groups[dateKey] = { date, entries: [] };
      }

      groups[dateKey].entries.push({
        ...entry,
        formatted: formatHistoryEntry(entry),
      });
    });

    // Sort groups by date (newest first)
    return Object.values(groups).sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
  };

  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Change History
          </Typography>
          <Typography color="text.secondary">
            No changes recorded yet
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const groupedHistory = groupHistoryByDate(history);

  return (
    <Card
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            letterSpacing: '0.025em',
            mb: 3,
          }}
        >
          HISTORY
        </Typography>

        {groupedHistory.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No changes recorded yet
            </Typography>
          </Box>
        ) : (
          <>
            {groupedHistory.map((group, groupIndex) => (
              <Box key={groupIndex} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500,
                    mb: 2,
                  }}
                >
                  {formatDateHeader(group.date)}
                </Typography>

                <Box sx={{ position: 'relative' }}>
                  {/* Vertical timeline line */}
                  {group.entries.length > 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '20px',
                        top: '32px',
                        bottom: '8px',
                        width: '2px',
                        bgcolor: 'divider',
                        zIndex: 0,
                      }}
                    />
                  )}

                  {group.entries.map((entry, index) => (
                    <Box
                      key={entry.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        mb: 2,
                        position: 'relative',
                        opacity: entry.isOptimistic ? 0.7 : 1,
                        transition: 'opacity 0.2s ease-in-out',
                      }}
                    >
                      {/* Time */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          minWidth: '80px',
                          mr: 2,
                          mt: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        {entry.formatted.time}
                        {entry.isPersisting && (
                          <CircularProgress
                            size={12}
                            thickness={5}
                            sx={{ color: 'text.secondary' }}
                          />
                        )}
                      </Typography>

                      {/* Icon */}
                      <Avatar
                        sx={{
                          bgcolor: entry.formatted.color,
                          width: 40,
                          height: 40,
                          mr: 2,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        {entry.formatted.icon}
                      </Avatar>

                      {/* Content */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 500,
                            mb: 0.5,
                          }}
                        >
                          {entry.formatted.title}
                        </Typography>
                        {entry.formatted.detail && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                            }}
                          >
                            {entry.formatted.detail}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
