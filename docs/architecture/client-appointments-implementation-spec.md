# Client Appointments Section - Implementation Specification

_Document Version: 1.0_  
_Created: December 2024_  
_Author: Winston, System Architect_

---

## Component Implementation Details

### 1. ClientAppointmentsSection Component

**Location**: `/src/components/clients/ClientAppointmentsSection.tsx`

```typescript
interface ClientAppointmentsSectionProps {
  clientId: string;
  clientName: string;
  shopId: string;
}

interface FilterState {
  statuses: AppointmentStatus[];
  showPast: boolean;
  showUpcoming: boolean;
  showCanceled: boolean;
}

const ClientAppointmentsSection: React.FC<ClientAppointmentsSectionProps> = ({
  clientId,
  clientName,
  shopId,
}) => {
  // State management
  const [filters, setFilters] = useState<FilterState>({
    statuses: ['pending', 'confirmed'],
    showPast: false,
    showUpcoming: true,
    showCanceled: false,
  });

  // Data fetching with React Query
  const { data, isLoading, error } = useClientAppointments(
    shopId,
    clientId,
    {
      includeCompleted: filters.showPast,
      statuses: filters.statuses,
    }
  );

  // Appointment grouping logic
  const groupedAppointments = useMemo(() => {
    if (!data?.appointments) return { upcoming: [], past: [], canceled: [] };

    const now = new Date();
    return data.appointments.reduce((groups, apt) => {
      const aptDate = new Date(`${apt.date} ${apt.start_time}`);

      if (apt.status === 'canceled' || apt.status === 'no_show') {
        groups.canceled.push(apt);
      } else if (aptDate >= now) {
        groups.upcoming.push(apt);
      } else {
        groups.past.push(apt);
      }

      return groups;
    }, { upcoming: [], past: [], canceled: [] });
  }, [data?.appointments]);

  return (
    <Card elevation={2} sx={{ mt: 3 }}>
      <CardContent>
        {/* Header with count and quick action */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon color="primary" />
            Appointments ({data?.total || 0})
          </Typography>

          <AppointmentDialog
            prefilledData={{ client_id: clientId }}
            trigger={
              <IconButton color="primary" size="small">
                <AddIcon />
              </IconButton>
            }
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Filter Controls */}
        <AppointmentFilters
          filters={filters}
          onChange={setFilters}
        />

        {/* Appointments List */}
        {isLoading ? (
          <AppointmentsSkeleton />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <AppointmentsList
            upcoming={groupedAppointments.upcoming}
            past={groupedAppointments.past}
            canceled={groupedAppointments.canceled}
            filters={filters}
          />
        )}
      </CardContent>
    </Card>
  );
};
```

### 2. AppointmentsList Component

**Location**: `/src/components/clients/AppointmentsList.tsx`

```typescript
interface AppointmentsListProps {
  upcoming: Appointment[];
  past: Appointment[];
  canceled: Appointment[];
  filters: FilterState;
}

const AppointmentsList: React.FC<AppointmentsListProps> = ({
  upcoming,
  past,
  canceled,
  filters,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!upcoming.length && !past.length && !canceled.length) {
    return <EmptyAppointmentsState />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Upcoming Appointments */}
      {filters.showUpcoming && upcoming.length > 0 && (
        <AppointmentGroup
          title="Upcoming Appointments"
          appointments={upcoming}
          icon={<EventAvailableIcon />}
          color="primary"
        />
      )}

      {/* Past Appointments */}
      {filters.showPast && past.length > 0 && (
        <AppointmentGroup
          title="Past Appointments"
          appointments={past}
          icon={<HistoryIcon />}
          color="text.secondary"
          defaultCollapsed={!isMobile}
        />
      )}

      {/* Canceled/Rescheduled */}
      {filters.showCanceled && canceled.length > 0 && (
        <AppointmentGroup
          title="Canceled & Rescheduled"
          appointments={canceled}
          icon={<EventBusyIcon />}
          color="error"
          defaultCollapsed
        />
      )}
    </Box>
  );
};
```

### 3. AppointmentListItem Component

**Location**: `/src/components/clients/AppointmentListItem.tsx`

```typescript
interface AppointmentListItemProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
}

const AppointmentListItem = memo<AppointmentListItemProps>(({
  appointment,
  onEdit,
  onStatusChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(false);

  const typeConfig = APPOINTMENT_TYPE_CONFIG[appointment.type];
  const statusConfig = APPOINTMENT_STATUS_CONFIG[appointment.status];

  const formattedDate = format(new Date(appointment.date), 'MMM d, yyyy');
  const formattedTime = `${appointment.start_time} - ${appointment.end_time}`;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        opacity: appointment.status === 'canceled' ? 0.7 : 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardContent
        sx={{
          p: isMobile ? 1.5 : 2,
          '&:last-child': { pb: isMobile ? 1.5 : 2 },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          {/* Left side - Main content */}
          <Box sx={{ flex: 1 }}>
            {/* Date and Time */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mb: 0.5,
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 16 }} />
              {formattedDate} at {formattedTime}
            </Typography>

            {/* Type and Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                icon={typeConfig.icon}
                label={typeConfig.label}
                sx={{
                  bgcolor: typeConfig.color,
                  color: 'white',
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />

              <Chip
                size="small"
                label={statusConfig.label}
                color={statusConfig.color}
                variant={appointment.status === 'canceled' ? 'outlined' : 'filled'}
              />
            </Box>

            {/* Notes Preview (if expanded) */}
            <Collapse in={expanded}>
              {appointment.notes && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                >
                  {appointment.notes}
                </Typography>
              )}

              {/* Quick Actions */}
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(appointment);
                  }}
                >
                  Edit
                </Button>

                {appointment.status === 'pending' && (
                  <Button
                    size="small"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(appointment.id, 'confirmed');
                    }}
                  >
                    Confirm
                  </Button>
                )}
              </Box>
            </Collapse>
          </Box>

          {/* Right side - Expand indicator */}
          <IconButton size="small" sx={{ ml: 1 }}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
});
```

### 4. Data Integration Updates

**Location**: `/src/lib/actions/appointments-refactored.ts`

```typescript
// Enhanced getClientAppointments with filtering options
export async function getClientAppointments(
  shopId: string,
  clientId: string,
  options?: {
    includeCompleted?: boolean;
    statuses?: AppointmentStatus[];
    dateRange?: { start: string; end: string };
    limit?: number;
    offset?: number;
  }
): Promise<{
  appointments: Appointment[];
  total: number;
  hasMore: boolean;
}> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Verify shop ownership (existing logic)
  // ...

  // Build query with enhanced filtering
  let query = supabase
    .from('appointments')
    .select(
      `
      *,
      client:clients(
        id,
        first_name,
        last_name,
        email,
        phone_number,
        accept_email,
        accept_sms
      )
    `,
      { count: 'exact' }
    )
    .eq('shop_id', shopId)
    .eq('client_id', clientId)
    .order('date', { ascending: false })
    .order('start_time', { ascending: false });

  // Apply status filter
  if (options?.statuses && options.statuses.length > 0) {
    query = query.in('status', options.statuses);
  } else if (!options?.includeCompleted) {
    // Default: exclude completed appointments
    query = query.in('status', ['pending', 'confirmed']);
  }

  // Apply date range filter
  if (options?.dateRange) {
    query = query
      .gte('date', options.dateRange.start)
      .lte('date', options.dateRange.end);
  }

  // Apply pagination
  const limit = options?.limit || 10;
  const offset = options?.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data: appointments, error, count } = await query;

  if (error) {
    console.error('Failed to fetch client appointments:', error);
    throw new Error('Failed to fetch client appointments');
  }

  return {
    appointments: appointments as Appointment[],
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
}
```

### 5. React Query Hook

**Location**: `/src/lib/queries/client-appointment-queries.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClientAppointments,
  updateAppointmentStatus,
} from '@/lib/actions/appointments-refactored';

// Query key factory
export const clientAppointmentKeys = {
  all: (clientId: string) => ['appointments', 'client', clientId] as const,
  list: (clientId: string, filters?: AppointmentFilters) =>
    [...clientAppointmentKeys.all(clientId), 'list', filters] as const,
};

// Custom hook for fetching client appointments
export function useClientAppointments(
  shopId: string,
  clientId: string,
  options?: {
    includeCompleted?: boolean;
    statuses?: AppointmentStatus[];
    dateRange?: { start: string; end: string };
  }
) {
  return useQuery({
    queryKey: clientAppointmentKeys.list(clientId, options),
    queryFn: () => getClientAppointments(shopId, clientId, options),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

// Mutation for updating appointment status
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      status,
    }: {
      appointmentId: string;
      status: AppointmentStatus;
    }) => updateAppointmentStatus(appointmentId, status),

    onMutate: async ({ appointmentId, status }) => {
      // Optimistic update implementation
      // ...
    },

    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['appointments'],
      });
    },

    onError: (error, variables, context) => {
      // Rollback optimistic update
      // Show error toast
    },
  });
}
```

### 6. Integration with Client View Page

**Location**: `/src/app/(app)/clients/[id]/page.tsx`

```typescript
// Add to the existing Client Detail Page
import ClientAppointmentsSection from '@/components/clients/ClientAppointmentsSection';

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { id } = await params;

  try {
    const client = await getClient(id);
    if (!client) {
      notFound();
    }

    // Get shop ID for appointments section
    const { userId } = await auth();
    const supabase = await createClient();

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    const { data: shopData } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_user_id', userData.id)
      .single();

    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          {/* Existing client information sections */}
          {/* ... */}

          {/* New Appointments Section */}
          <ClientAppointmentsSection
            clientId={client.id}
            clientName={`${client.first_name} ${client.last_name}`}
            shopId={shopData.id}
          />
        </Box>
      </Container>
    );
  } catch (error) {
    console.error('Error fetching client:', error);
    notFound();
  }
}
```

### 7. Constants and Configuration

**Location**: `/src/lib/constants/appointments.ts`

```typescript
export const APPOINTMENT_TYPE_CONFIG = {
  consultation: {
    label: 'Consultation',
    icon: <ChatBubbleOutlineIcon />,
    color: '#2196F3', // Blue
  },
  fitting: {
    label: 'Fitting',
    icon: <ContentCutIcon />,
    color: '#9C27B0', // Purple
  },
  pickup: {
    label: 'Pickup',
    icon: <LocalShippingIcon />,
    color: '#FF9800', // Orange
  },
  delivery: {
    label: 'Delivery',
    icon: <HomeIcon />,
    color: '#4CAF50', // Green
  },
  other: {
    label: 'Other',
    icon: <MoreHorizIcon />,
    color: '#607D8B', // Blue Grey
  },
};

export const APPOINTMENT_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'warning' as const,
  },
  confirmed: {
    label: 'Confirmed',
    color: 'success' as const,
  },
  declined: {
    label: 'Declined',
    color: 'error' as const,
  },
  canceled: {
    label: 'Canceled',
    color: 'default' as const,
  },
  no_show: {
    label: 'No Show',
    color: 'error' as const,
  },
};
```

### 8. Testing Requirements

**Location**: `/src/__tests__/unit/components/clients/ClientAppointmentsSection.test.tsx`

```typescript
describe('ClientAppointmentsSection', () => {
  it('should render appointment count in header', async () => {
    // Test implementation
  });

  it('should filter appointments by status', async () => {
    // Test implementation
  });

  it('should group appointments correctly', async () => {
    // Test implementation
  });

  it('should handle empty state gracefully', async () => {
    // Test implementation
  });

  it('should open new appointment dialog with prefilled client', async () => {
    // Test implementation
  });

  it('should update appointment status optimistically', async () => {
    // Test implementation
  });
});
```

---

## Migration Considerations

### Database Indexes

Ensure optimal query performance:

```sql
-- Already exists from previous migrations
CREATE INDEX idx_appointments_client ON appointments(client_id);

-- Consider adding composite index if needed
CREATE INDEX idx_appointments_client_status_date
  ON appointments(client_id, status, date DESC);
```

### Feature Flag (Optional)

If rolling out gradually:

```typescript
// In ClientDetailPage
{featureFlags.clientAppointmentsEnabled && (
  <ClientAppointmentsSection
    clientId={client.id}
    clientName={`${client.first_name} ${client.last_name}`}
    shopId={shopData.id}
  />
)}
```

---

This implementation specification provides the detailed technical blueprint for building the Client Appointments Section, ensuring consistency with the existing codebase while introducing new functionality in a maintainable and performant manner.
