'use client';

import React, {
	createContext,
	useContext,
	useReducer,
	useCallback,
	useRef,
	useEffect,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useInterval, useVisibilityInterval } from '@/lib/hooks/useInterval';
import {
	appointmentReducer,
	initialAppointmentState,
	AppointmentState,
	AppointmentActionType,
	AppointmentAction,
} from '@/lib/reducers/appointments-reducer';
import {
	getAppointmentsByTimeRange,
	createAppointment as createAppointmentAction,
	updateAppointment as updateAppointmentAction,
	CreateAppointmentData,
	UpdateAppointmentData,
} from '@/lib/actions/appointments';
import { Appointment } from '@/types';
import { CalendarView } from '@/lib/queries/appointment-keys';
import { calculateDateRange } from '@/lib/queries/appointment-queries';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

interface AppointmentContextValue {
	state: AppointmentState;
	dispatch: React.Dispatch<AppointmentAction>;

	// Data fetching
	loadAppointments: (
		shopId: string,
		dateRange: { startDate: string; endDate: string }
	) => Promise<void>;

	// CRUD operations
	createAppointment: (
		shopId: string,
		data: CreateAppointmentData
	) => Promise<{ success: boolean; error?: string }>;

	updateAppointment: (
		id: string,
		data: UpdateAppointmentData
	) => Promise<{ success: boolean; error?: string }>;

	cancelAppointment: (id: string) => Promise<void>;

	// Helpers
	getAppointmentsForDateRange: (
		startDate: string,
		endDate: string
	) => Appointment[];

	isDateRangeLoaded: (startDate: string, endDate: string) => boolean;

	clearStaleData: () => void;
}

const AppointmentContext = createContext<AppointmentContextValue | null>(null);

export function useAppointments() {
	const context = useContext(AppointmentContext);
	if (!context) {
		throw new Error('useAppointments must be used within AppointmentProvider');
	}
	return context;
}

interface AppointmentProviderProps {
	children: React.ReactNode;
	shopId: string;
}

export function AppointmentProvider({
	children,
	shopId,
}: AppointmentProviderProps) {
	const [state, dispatch] = useReducer(
		appointmentReducer,
		initialAppointmentState
	);
	const queryClient = useQueryClient();
	const supabase = createClient();
	const subscriptionRef = useRef<any>(null);

	// Load appointments for a date range
	const loadAppointments = useCallback(
		async (
			shopId: string,
			dateRange: { startDate: string; endDate: string }
		) => {
			const requestId = uuidv4();

			// Check if we already have fresh data for this range
			const existingRange = state.loadedRanges.find(
				(r) =>
					r.startDate <= dateRange.startDate &&
					r.endDate >= dateRange.endDate &&
					r.staleAt > Date.now()
			);

			if (existingRange) {
				// Data is already loaded and fresh
				return;
			}

			dispatch({
				type: AppointmentActionType.LOAD_APPOINTMENTS_START,
				payload: { dateRange, requestId },
			});

			try {
				const appointments = await getAppointmentsByTimeRange(
					shopId,
					dateRange.startDate,
					dateRange.endDate
				);

				dispatch({
					type: AppointmentActionType.LOAD_APPOINTMENTS_SUCCESS,
					payload: { appointments, dateRange, requestId },
				});
			} catch (error) {
				dispatch({
					type: AppointmentActionType.LOAD_APPOINTMENTS_ERROR,
					payload: {
						error:
							error instanceof Error
								? error.message
								: 'Failed to load appointments',
						dateRange,
						requestId,
					},
				});
				toast.error('Failed to load appointments');
			}
		},
		[state.loadedRanges]
	);

	// Create appointment with optimistic update
	const createAppointment = useCallback(
		async (
			shopId: string,
			data: CreateAppointmentData
		): Promise<{ success: boolean; error?: string }> => {
			const tempId = `temp-${uuidv4()}`;
			if (!data.clientId) {
				throw new Error('Client ID is required to create an appointment');
			}

			const optimisticAppointment: Appointment = {
				id: tempId,
				shop_id: shopId,
				client_id: data.clientId,
				date: data.date,
				start_time: data.startTime,
				end_time: data.endTime,
				type: data.type,
				status: 'pending',
				notes: data.notes || null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				// client will be populated by the server
			};

			// Optimistic update
			dispatch({
				type: AppointmentActionType.CREATE_APPOINTMENT_OPTIMISTIC,
				payload: { appointment: optimisticAppointment, tempId },
			});

			try {
				const appointment = await createAppointmentAction(data);

				dispatch({
					type: AppointmentActionType.CREATE_APPOINTMENT_SUCCESS,
					payload: { appointment, tempId },
				});

				// Invalidate all appointment-related queries to ensure UI updates
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: ['appointments'] }),
					queryClient.invalidateQueries({
						queryKey: ['appointments', 'timeRange'],
					}),
					queryClient.invalidateQueries({ queryKey: ['appointments', 'view'] }),
					queryClient.invalidateQueries({
						queryKey: ['appointments', 'count'],
					}),
				]);
				if (data.clientId) {
					// Invalidate all client appointment queries including infinite queries
					await queryClient.invalidateQueries({
						queryKey: ['appointments', 'client', data.clientId],
					});
				}

				// Format date and time for the toast message
				const appointmentDate = new Date(
					`${appointment.date}T${appointment.start_time}`
				);
				const formattedDate = appointmentDate.toLocaleDateString('en-US', {
					weekday: 'short',
					month: 'short',
					day: 'numeric',
				});
				const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true,
				});

				// Get client name if available
				const clientName = appointment.client
					? `${appointment.client.first_name} ${appointment.client.last_name}`
					: '';

				// Create a styled toast message
				const typeFormatted =
					appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1);
				const description = `${typeFormatted} appointment${clientName ? ` with ${clientName}` : ''}`;

				toast.success(
					<div>
						<div>
							Appointment scheduled successfully for {formattedDate} at{' '}
							{formattedTime}
						</div>
						<div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
							{description}
						</div>
					</div>,
					{ duration: 5000 }
				);

				return { success: true };
			} catch (error) {
				dispatch({
					type: AppointmentActionType.CREATE_APPOINTMENT_ERROR,
					payload: {
						tempId,
						error:
							error instanceof Error
								? error.message
								: 'Failed to create appointment',
					},
				});

				// Return error instead of throwing for inline display
				const errorMessage =
					error instanceof Error
						? error.message
						: 'Failed to create appointment';

				// Enhanced error message for overlapping appointments
				if (
					error instanceof Error &&
					error.message.includes('already booked')
				) {
					const enhancedMessage =
						'This time conflicts with an existing appointment. To schedule overlapping appointments, click the gear icon (⚙️) in the calendar header and enable "Allow Overlapping Appointments".';
					toast.error(enhancedMessage);
					return {
						success: false,
						error: enhancedMessage,
					};
				}

				// Show error toast
				toast.error(errorMessage);

				return {
					success: false,
					error: errorMessage,
				};
			}
		},
		[]
	);

	// Update appointment with optimistic update
	const updateAppointment = useCallback(
		async (
			id: string,
			data: UpdateAppointmentData
		): Promise<{ success: boolean; error?: string }> => {
			const currentAppointment = state.appointments.get(id);

			// If appointment is not in state, we can still proceed with the update
			// This happens when appointments are loaded via React Query on other pages
			if (currentAppointment) {
				// Optimistic update only if we have the appointment in state
				const updates: Partial<Appointment> = {};
				Object.entries(data).forEach(([key, value]) => {
					if (value !== undefined) {
						(updates as any)[key] = value;
					}
				});

				dispatch({
					type: AppointmentActionType.UPDATE_APPOINTMENT_OPTIMISTIC,
					payload: {
						id,
						updates,
						previousData: currentAppointment,
					},
				});
			}

			try {
				const appointment = await updateAppointmentAction(data);

				dispatch({
					type: AppointmentActionType.UPDATE_APPOINTMENT_SUCCESS,
					payload: { appointment },
				});

				// Always show toast for significant updates
				if (data.status || data.date || data.startTime) {
					// Check if this is a reschedule (date or time changed)
					const isReschedule =
						data.date !== undefined || data.startTime !== undefined;

					if (isReschedule) {
						// Format date and time for the toast message
						const appointmentDate = new Date(
							`${appointment.date}T${appointment.start_time}`
						);
						const formattedDate = appointmentDate.toLocaleDateString('en-US', {
							weekday: 'short',
							month: 'short',
							day: 'numeric',
						});
						const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
							hour: 'numeric',
							minute: '2-digit',
							hour12: true,
						});

						// Get client name if available
						const clientName = appointment.client
							? `${appointment.client.first_name} ${appointment.client.last_name}`
							: '';

						// Create a styled toast message
						const typeFormatted =
							appointment.type.charAt(0).toUpperCase() +
							appointment.type.slice(1);
						const description = `${typeFormatted} appointment${clientName ? ` with ${clientName}` : ''}`;

						toast.success(
							<div>
								<div>
									Appointment rescheduled successfully for {formattedDate} at{' '}
									{formattedTime}
								</div>
								<div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
									{description}
								</div>
							</div>,
							{ duration: 5000 }
						);
					} else {
						// For status changes or other updates, show generic message
						toast.success('Appointment updated successfully');
					}
				}

				// Invalidate all appointment-related queries to ensure UI updates
				// This includes time ranges, views, counts, and lists
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: ['appointments'] }),
					queryClient.invalidateQueries({
						queryKey: ['appointments', 'timeRange'],
					}),
					queryClient.invalidateQueries({ queryKey: ['appointments', 'view'] }),
					queryClient.invalidateQueries({
						queryKey: ['appointments', 'count'],
					}),
				]);

				return { success: true };
			} catch (error) {
				if (currentAppointment) {
					dispatch({
						type: AppointmentActionType.UPDATE_APPOINTMENT_ERROR,
						payload: {
							id,
							previousData: currentAppointment,
							error:
								error instanceof Error
									? error.message
									: 'Failed to update appointment',
						},
					});
				}
				// Return error instead of throwing for inline display
				const errorMessage =
					error instanceof Error
						? error.message
						: 'Failed to update appointment';

				// Enhanced error message for overlapping appointments
				if (
					error instanceof Error &&
					error.message.includes('already booked')
				) {
					return {
						success: false,
						error:
							'This time conflicts with an existing appointment. To schedule overlapping appointments, click the gear icon (⚙️) in the calendar header and enable "Allow Overlapping Appointments".',
					};
				}

				return {
					success: false,
					error: errorMessage,
				};
			}
		},
		[state.appointments]
	);

	// Cancel appointment with optimistic update
	const cancelAppointment = useCallback(
		async (id: string) => {
			const currentAppointment = state.appointments.get(id);
			if (!currentAppointment) {
				toast.error('Appointment not found');
				return;
			}

			// Optimistic update
			dispatch({
				type: AppointmentActionType.CANCEL_APPOINTMENT_OPTIMISTIC,
				payload: {
					id,
					previousData: currentAppointment,
				},
			});

			try {
				// Cancel by updating status to 'canceled'
				const appointment = await updateAppointmentAction({
					id,
					status: 'canceled',
				});

				dispatch({
					type: AppointmentActionType.CANCEL_APPOINTMENT_SUCCESS,
					payload: { appointment },
				});

				toast.success('Appointment canceled successfully');
			} catch (error) {
				dispatch({
					type: AppointmentActionType.CANCEL_APPOINTMENT_ERROR,
					payload: {
						id,
						previousData: currentAppointment,
						error:
							error instanceof Error
								? error.message
								: 'Failed to cancel appointment',
					},
				});
				toast.error(
					error instanceof Error
						? error.message
						: 'Failed to cancel appointment'
				);
				throw error;
			}
		},
		[state.appointments]
	);

	// Get appointments for a specific date range
	const getAppointmentsForDateRange = useCallback(
		(startDate: string, endDate: string): Appointment[] => {
			const appointments: Appointment[] = [];

			for (const appointment of state.appointments.values()) {
				if (appointment.date >= startDate && appointment.date <= endDate) {
					appointments.push(appointment);
				}
			}

			return appointments.sort((a, b) => {
				const dateCompare = a.date.localeCompare(b.date);
				if (dateCompare !== 0) return dateCompare;
				return a.start_time.localeCompare(b.start_time);
			});
		},
		[state.appointments]
	);

	// Check if a date range is loaded
	const isDateRangeLoaded = useCallback(
		(startDate: string, endDate: string): boolean => {
			return state.loadedRanges.some(
				(range) =>
					range.startDate <= startDate &&
					range.endDate >= endDate &&
					range.staleAt > Date.now()
			);
		},
		[state.loadedRanges]
	);

	// Clear stale data
	const clearStaleData = useCallback(() => {
		dispatch({
			type: AppointmentActionType.CLEAR_STALE_DATA,
			payload: {},
		});
	}, []);

	// Set up real-time subscriptions with improved cleanup
	useEffect(() => {
		if (!shopId) return;

		// Create a unique channel name to avoid conflicts
		const channelName = `appointments:${shopId}:${Date.now()}`;

		const channel = supabase
			.channel(channelName)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'appointments',
					filter: `shop_id=eq.${shopId}`,
				},
				async (payload) => {
					console.log(
						'[AppointmentProvider] Real-time INSERT event received:',
						payload.new.id
					);

					// Fetch full appointment data with client info
					const { data } = await supabase
						.from('appointments')
						.select(
							`
              *,
              client:clients(*)
            `
						)
						.eq('id', payload.new.id)
						.single();

					if (data) {
						dispatch({
							type: AppointmentActionType.APPOINTMENT_CREATED_REMOTE,
							payload: { appointment: data as Appointment },
						});

						// Invalidate queries for this client and all appointments to refresh lists
						console.log(
							'[AppointmentProvider] Invalidating appointment queries...'
						);
						await queryClient.invalidateQueries({ queryKey: ['appointments'] });
						if ((payload.new as any)?.client_id) {
							await queryClient.invalidateQueries({
								queryKey: [
									'appointments',
									'client',
									(payload.new as any).client_id,
								],
							});
							console.log(
								'[AppointmentProvider] Client queries invalidated for:',
								(payload.new as any).client_id
							);
						}
					}
				}
			)
			.on(
				'postgres_changes',
				{
					event: 'UPDATE',
					schema: 'public',
					table: 'appointments',
					filter: `shop_id=eq.${shopId}`,
				},
				async (payload) => {
					// Skip if we have an optimistic update in progress
					if (state.optimisticUpdates.has(payload.new.id)) {
						return;
					}

					// Fetch full appointment data with client info
					const { data } = await supabase
						.from('appointments')
						.select(
							`
              *,
              client:clients(*)
            `
						)
						.eq('id', payload.new.id)
						.single();

					if (data) {
						dispatch({
							type: AppointmentActionType.APPOINTMENT_UPDATED_REMOTE,
							payload: { appointment: data as Appointment },
						});

						// Invalidate queries to ensure lists reflect updates
						await queryClient.invalidateQueries({ queryKey: ['appointments'] });
						if ((payload.new as any)?.client_id) {
							await queryClient.invalidateQueries({
								queryKey: [
									'appointments',
									'client',
									(payload.new as any).client_id,
								],
							});
						}
					}
				}
			)
			// Note: We don't subscribe to DELETE events because appointments are never deleted,
			// only canceled (which is handled by UPDATE events)
			.subscribe();

		subscriptionRef.current = channel;

		// Cleanup function with improved error handling
		return () => {
			if (subscriptionRef.current) {
				try {
					// Unsubscribe from the channel before removing
					const unsubscribeResult = subscriptionRef.current.unsubscribe();

					// Check if unsubscribe returns a promise (real Supabase) or undefined (mocked)
					if (
						unsubscribeResult &&
						typeof unsubscribeResult.then === 'function'
					) {
						unsubscribeResult
							.then(() => {
								if (subscriptionRef.current) {
									supabase.removeChannel(subscriptionRef.current);
									subscriptionRef.current = null;
								}
							})
							.catch((error: unknown) => {
								console.warn(
									'Error unsubscribing from appointments channel:',
									error
								);
								// Still try to remove the channel even if unsubscribe fails
								if (subscriptionRef.current) {
									supabase.removeChannel(subscriptionRef.current);
									subscriptionRef.current = null;
								}
							});
					} else {
						// Synchronous unsubscribe (likely in tests)
						if (subscriptionRef.current) {
							supabase.removeChannel(subscriptionRef.current);
							subscriptionRef.current = null;
						}
					}
				} catch (error) {
					console.warn('Error during appointment subscription cleanup:', error);
					// Still try to clean up
					if (subscriptionRef.current) {
						try {
							supabase.removeChannel(subscriptionRef.current);
						} catch (removeError) {
							console.warn('Error removing channel:', removeError);
						}
						subscriptionRef.current = null;
					}
				}
			}
		};
	}, [shopId, state.optimisticUpdates, supabase]);

	// Clean up stale data periodically with visibility-aware interval
	// Pauses when tab is hidden to save CPU/battery
	useVisibilityInterval(
		clearStaleData,
		60 * 1000, // Every minute
		true // Pause when tab is hidden
	);

	const value: AppointmentContextValue = {
		state,
		dispatch,
		loadAppointments,
		createAppointment,
		updateAppointment,
		cancelAppointment,
		getAppointmentsForDateRange,
		isDateRangeLoaded,
		clearStaleData,
	};

	return (
		<AppointmentContext.Provider value={value}>
			{children}
		</AppointmentContext.Provider>
	);
}
