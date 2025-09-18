'use client';

import { useState, useEffect } from 'react';
import { useInterval } from '@/lib/hooks/useInterval';
import {
	Box,
	Typography,
	Paper,
	Card,
	CardContent,
	Chip,
	useTheme,
	alpha,
	useMediaQuery,
	Collapse,
	List,
	ListItem,
	ListItemText,
	IconButton,
} from '@mui/material';
import { format, isToday } from 'date-fns';
import {
	getAppointmentColor,
	formatTime,
	formatDuration,
	getDurationMinutes,
	isPastDate,
	canCreateAppointment,
	isPastDateTime,
	canCreateAppointmentAt,
} from '@/lib/utils/calendar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { Appointment } from '@/types';
import { useAppointmentsDisplay } from '@/hooks/useAppointmentDisplay';

interface DayViewProps {
	currentDate: Date;
	appointments: Appointment[];
	shopHours: Array<{
		day_of_week: number;
		open_time: string | null;
		close_time: string | null;
		is_closed: boolean;
	}>;
	onAppointmentClick?: (appointment: Appointment) => void;
	onTimeSlotClick?: (date: Date, time?: string) => void;
	focusAppointmentId?: string;
}

export function DayView({
	currentDate,
	appointments,
	shopHours,
	onAppointmentClick,
	onTimeSlotClick,
	focusAppointmentId,
}: DayViewProps) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const SLOT_HEIGHT_PX = 120; // 30-minute slot height (increased for better readability)

	// State to track current time for the indicator
	const [currentTime, setCurrentTime] = useState(new Date());

	// State for managing overflow appointments expansion
	const [expandedOverflow, setExpandedOverflow] = useState<Set<string>>(
		new Set()
	);

	// Update current time every 5 minutes with automatic cleanup
	useInterval(
		() => setCurrentTime(new Date()),
		5 * 60 * 1000, // 5 minutes
		false // Don't run immediately
	);

	// Convert appointments to display format with timezone support
	const { appointments: displayAppointments } =
		useAppointmentsDisplay(appointments);

	// Filter appointments for current date
	const dateStr = format(currentDate, 'yyyy-MM-dd');
	const dayAppointments = displayAppointments
		.filter((apt) => apt.displayDate === dateStr)
		.sort((a, b) => a.displayStartTime.localeCompare(b.displayStartTime));
	// Scroll focused appointment into view on mount/update
	useEffect(() => {
		if (!focusAppointmentId) return;
		const el = document.querySelector(
			`[data-appointment-id="${focusAppointmentId}"]`
		) as HTMLElement | null;
		if (el && typeof el.scrollIntoView === 'function') {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}, [focusAppointmentId, dateStr]);

	// Get shop hours for current day
	const dayOfWeek = currentDate.getDay();
	const todayHours = shopHours.find((h) => h.day_of_week === dayOfWeek);
	const isOpen = todayHours && !todayHours.is_closed;
	const isPast = isPastDate(currentDate);
	const canCreate = canCreateAppointment(currentDate, shopHours);

	// Generate time slots for the day with 30-minute increments
	const timeSlots = [];
	const shopStartHour = todayHours?.open_time
		? parseInt(todayHours.open_time.split(':')[0] || '8')
		: 8;
	const shopEndHour = todayHours?.close_time
		? parseInt(todayHours.close_time.split(':')[0] || '18')
		: 18;

	for (let hour = shopStartHour; hour <= shopEndHour; hour++) {
		timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
		if (hour < shopEndHour) {
			// Don't add :30 slot for the last hour
			timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
		}
	}

	// Helper: check if an appointment overlaps a 30-minute slot starting at `time`
	const getOverlappingAppointmentsForSlot = (time: string): Appointment[] => {
		const [slotHourStr, slotMinuteStr] = time.split(':');
		const slotHour = parseInt(slotHourStr || '0', 10);
		const slotMinute = parseInt(slotMinuteStr || '0', 10);
		const slotStartMinutes = slotHour * 60 + slotMinute;
		const slotEndMinutes = slotStartMinutes + 30;

		return dayAppointments.filter((apt) => {
			const [sH, sM] = apt.displayStartTime.split(':');
			const [eH, eM] = apt.displayEndTime.split(':');
			const aptStart = parseInt(sH || '0', 10) * 60 + parseInt(sM || '0', 10);
			const aptEnd = parseInt(eH || '0', 10) * 60 + parseInt(eM || '0', 10);
			return aptStart < slotEndMinutes && aptEnd > slotStartMinutes;
		});
	};

	// Helper: calculate layout for overlapping appointments with overflow handling
	const calculateAppointmentLayout = (appointments: typeof dayAppointments) => {
		// Group appointments by time overlap
		const groups: Array<typeof dayAppointments> = [];

		for (const appointment of appointments) {
			const [sH, sM] = appointment.displayStartTime.split(':');
			const [eH, eM] = appointment.displayEndTime.split(':');
			const aptStart = parseInt(sH || '0', 10) * 60 + parseInt(sM || '0', 10);
			const aptEnd = parseInt(eH || '0', 10) * 60 + parseInt(eM || '0', 10);

			// Find existing group that this appointment overlaps with
			let foundGroup = false;
			for (const group of groups) {
				const hasOverlap = group.some((existing) => {
					const [esH, esM] = existing.displayStartTime.split(':');
					const [eeH, eeM] = existing.displayEndTime.split(':');
					const existingStart =
						parseInt(esH || '0', 10) * 60 + parseInt(esM || '0', 10);
					const existingEnd =
						parseInt(eeH || '0', 10) * 60 + parseInt(eeM || '0', 10);

					// Check if appointments overlap
					return aptStart < existingEnd && aptEnd > existingStart;
				});

				if (hasOverlap) {
					group.push(appointment);
					foundGroup = true;
					break;
				}
			}

			// If no overlapping group found, create new group
			if (!foundGroup) {
				groups.push([appointment]);
			}
		}

		// Handle each overlap group separately and limit appointments per group
		const layoutMap = new Map<
			string,
			{
				width: number;
				left: number;
				totalColumns: number;
				isOverflow: boolean;
				hasOverlap: boolean;
				groupId: string;
			}
		>();

		const overflowByGroup = new Map<string, typeof dayAppointments>(); // Group ID -> overflow appointments
		const MAX_VISIBLE_PER_GROUP = 3;

		groups.forEach((group, groupIndex) => {
			const groupId = `group-${groupIndex}`;

			if (group.length === 1) {
				// Single appointment - use full width
				const appointment = group[0];
				if (appointment) {
					layoutMap.set(appointment.id, {
						width: 100,
						left: 0,
						totalColumns: 1,
						isOverflow: false,
						hasOverlap: false,
						groupId,
					});
				}
			} else {
				// Multiple overlapping appointments - limit to 3 visible
				const visibleAppointments = group.slice(0, MAX_VISIBLE_PER_GROUP);
				const overflowFromGroup = group.slice(MAX_VISIBLE_PER_GROUP);

				// Store overflow appointments for this group
				if (overflowFromGroup.length > 0) {
					overflowByGroup.set(groupId, overflowFromGroup);
				}

				// Layout visible appointments side-by-side
				const hasOverflow = overflowFromGroup.length > 0;
				const totalColumns = visibleAppointments.length;
				// When overflow exists, treat it as 4 total columns (3 appointments + 1 overflow)
				const totalLayoutColumns = hasOverflow ? 4 : totalColumns;
				const appointmentWidth = 100 / totalLayoutColumns; // Each gets equal width

				visibleAppointments.forEach((appointment, appointmentIndex) => {
					const width = appointmentWidth;
					const left = appointmentIndex * appointmentWidth;
					layoutMap.set(appointment.id, {
						width,
						left,
						totalColumns: totalLayoutColumns,
						isOverflow: false,
						hasOverlap: true,
						groupId,
					});
				});
			}
		});

		return { layoutMap, overflowByGroup };
	};

	// Calculate layout for all appointments
	const { layoutMap: appointmentLayout, overflowByGroup } =
		calculateAppointmentLayout(dayAppointments);

	// Calculate current time indicator position
	const currentHour = currentTime.getHours();
	const currentMinute = currentTime.getMinutes();
	const currentTimeMinutes = currentHour * 60 + currentMinute;
	const isCurrentDay = isToday(currentDate);

	// Determine displayed range in minutes based on generated time slots
	const displayedStartMinutes = shopStartHour * 60;
	// Last slot starts at `${shopEndHour}:00` and spans 30 minutes
	const displayedEndMinutesExclusive = shopEndHour * 60 + 30;

	// Show indicator only on current day when shop is not closed and within displayed minutes
	const showCurrentTimeIndicator =
		isCurrentDay &&
		!!todayHours &&
		!todayHours.is_closed &&
		currentTimeMinutes >= displayedStartMinutes &&
		currentTimeMinutes < displayedEndMinutesExclusive;

	return (
		<Box>
			{/* Shop hours info */}
			{todayHours && (
				<Card sx={{ mb: 2 }}>
					<CardContent sx={{ py: 2 }}>
						<Typography variant="body2" color="text.secondary">
							{isPast
								? `Past date - No appointments can be created`
								: isOpen
									? `Open ${formatTime(todayHours.open_time!)} - ${formatTime(todayHours.close_time!)}`
									: 'Closed'}
						</Typography>
					</CardContent>
				</Card>
			)}

			{/* No appointments message */}
			{dayAppointments.length === 0 && (
				<Paper sx={{ p: 4, textAlign: 'center', mb: 2 }}>
					<Typography color="text.secondary">
						No appointments scheduled
					</Typography>
				</Paper>
			)}

			{/* Time grid with appointments */}
			<Box sx={{ position: 'relative' }}>
				{timeSlots.map((time) => {
					const slotAppointments = getOverlappingAppointmentsForSlot(time);
					const slotTimeParts = time.split(':');
					const slotHour = parseInt(slotTimeParts[0] || '0', 10);
					const slotMinute = parseInt(slotTimeParts[1] || '0', 10);

					// Determine if current time indicator should be shown in this slot
					const slotStartMinutes = slotHour * 60 + slotMinute;
					const slotEndMinutes = slotStartMinutes + 30; // 30-minute slots
					const currentTimeMinutes = currentHour * 60 + currentMinute;
					const isCurrentTimeSlot =
						showCurrentTimeIndicator &&
						currentTimeMinutes >= slotStartMinutes &&
						currentTimeMinutes < slotEndMinutes;

					// Calculate position within the slot (0-100%)
					const positionInSlot = isCurrentTimeSlot
						? ((currentTimeMinutes - slotStartMinutes) / 30) * 100
						: 0;

					// Check if we have a 15-minute appointment in this slot
					const has15MinAppointment = slotAppointments.some((apt) => {
						const duration = getDurationMinutes(apt.start_time, apt.end_time);
						return duration === 15;
					});

					// Determine if we can add an appointment (either empty slot or 15-min slot with space)
					const canAddInSlot =
						canCreate &&
						!isPastDateTime(currentDate, time) &&
						(slotAppointments.length === 0 || has15MinAppointment);

					// Determine where to position the add button if we have a 15-min appointment
					let addButtonPosition = null;
					if (has15MinAppointment && slotAppointments.length === 1) {
						const apt = slotAppointments[0];
						if (apt && 'displayStartTime' in apt && apt.displayStartTime) {
							const [aptH, aptM] = (apt as any).displayStartTime.split(':');
							const aptStartMinutes =
								parseInt(aptH || '0', 10) * 60 + parseInt(aptM || '0', 10);
							// If appointment starts at the beginning of the slot, add button goes to bottom half
							if (aptStartMinutes === slotStartMinutes) {
								addButtonPosition = 'bottom';
							} else {
								// Otherwise, add button goes to top half
								addButtonPosition = 'top';
							}
						}
					}

					return (
						<Box
							key={time}
							sx={{
								display: 'flex',
								alignItems: 'flex-start',
								height: SLOT_HEIGHT_PX,
								borderBottom: `1px solid ${theme.palette.divider}`,
								cursor: onTimeSlotClick && canAddInSlot ? 'pointer' : 'default',
								position: 'relative',
								bgcolor: isPast
									? alpha(theme.palette.action.disabled, 0.03)
									: 'inherit',
								'&:hover':
									onTimeSlotClick && !isMobile && canAddInSlot
										? {
												bgcolor: alpha(theme.palette.primary.main, 0.04),
												'& .add-appointment-hint': {
													opacity: 1,
												},
											}
										: undefined,
							}}
							onClick={(e) => {
								// Handle click if we can add an appointment
								if (onTimeSlotClick && canAddInSlot) {
									// For 15-min appointments, determine the time based on click position
									if (has15MinAppointment && slotAppointments.length === 1) {
										const rect = e.currentTarget.getBoundingClientRect();
										const clickY = e.clientY - rect.top;
										const clickInBottomHalf = clickY > rect.height / 2;

										// Determine the start time based on where they clicked and where the existing appointment is
										let adjustedTime = time;
										if (addButtonPosition === 'bottom' && clickInBottomHalf) {
											// Existing appointment is in top half, clicked bottom half
											adjustedTime = `${slotHour.toString().padStart(2, '0')}:15`;
										} else if (
											addButtonPosition === 'top' &&
											!clickInBottomHalf
										) {
											// Existing appointment is in bottom half, clicked top half
											adjustedTime = time;
										}
										onTimeSlotClick(currentDate, adjustedTime);
									} else {
										onTimeSlotClick(currentDate, time);
									}
								}
							}}
						>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{
									width: 80,
									flexShrink: 0,
									px: 2,
									display: 'flex',
									alignItems: 'center',
								}}
							>
								{formatTime(time)}
							</Typography>
							<Box sx={{ flex: 1, position: 'relative', pr: 2 }} />

							{/* Add appointment hint for empty slots or slots with 15-min appointments */}
							{onTimeSlotClick && !isMobile && canAddInSlot && (
								<Box
									className="add-appointment-hint"
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										gap: 0.5,
										opacity: 0,
										transition: 'opacity 0.2s',
										pointerEvents: 'none',
										position: 'absolute',
										top: addButtonPosition === 'bottom' ? '50%' : 0,
										left: '96px', // 80px label + 16px padding
										right: '16px',
										bottom: addButtonPosition === 'top' ? '50%' : 0,
										height: has15MinAppointment ? '50%' : '100%',
										zIndex: 0,
										backgroundColor: alpha(theme.palette.background.paper, 0.7),
									}}
								>
									<AddIcon fontSize="small" color="action" />
									<Typography variant="caption" color="text.secondary">
										Add
									</Typography>
								</Box>
							)}

							{/* Current time indicator */}
							{isCurrentTimeSlot && (
								<Box
									data-testid="current-time-indicator"
									sx={{
										position: 'absolute',
										top: `${positionInSlot}%`,
										left: 0,
										right: 0,
										height: 2,
										bgcolor: 'error.main',
										zIndex: 5,
										'&::before': {
											content: '""',
											position: 'absolute',
											left: 70, // Position after the time label
											top: -4,
											width: 10,
											height: 10,
											borderRadius: '50%',
											bgcolor: 'error.main',
										},
									}}
								/>
							)}
						</Box>
					);
				})}

				{/* Overlay absolute-positioned appointments spanning across slots */}
				{dayAppointments
					.filter((apt) => appointmentLayout.get(apt.id)?.isOverflow === false)
					.map((appointment) => {
						const startParts = appointment.start_time.split(':');
						const startHour = parseInt(startParts[0] || '0', 10);
						const startMinute = parseInt(startParts[1] || '0', 10);
						const endParts = appointment.end_time.split(':');
						const endHour = parseInt(endParts[0] || '0', 10);
						const endMinute = parseInt(endParts[1] || '0', 10);
						const topPx =
							((startHour - shopStartHour) * 60 + startMinute) *
							(SLOT_HEIGHT_PX / 30);
						const heightPx =
							((endHour - startHour) * 60 + (endMinute - startMinute)) *
							(SLOT_HEIGHT_PX / 30);
						const duration = getDurationMinutes(
							appointment.start_time,
							appointment.end_time
						);
						// Always use regular layout for consistent typography
						const density = 'regular';
						const color = getAppointmentColor(appointment.type);

						// Get layout properties for this appointment
						const layout = appointmentLayout.get(appointment.id) || {
							width: 100,
							left: 0,
							totalColumns: 1,
							hasOverlap: false,
						};

						return (
							<Paper
								key={appointment.id}
								data-testid={`dayview-appointment-${appointment.id}`}
								data-appointment-id={appointment.id}
								data-focused={
									appointment.id === focusAppointmentId ? 'true' : undefined
								}
								data-top={topPx}
								data-height={heightPx}
								data-density={density}
								data-columns={layout.totalColumns}
								data-column-index={Math.floor(
									layout.left / (layout.width || 100)
								)}
								elevation={2}
								sx={{
									position: 'absolute',
									top: `${topPx}px`,
									height: `${heightPx}px`,
									// Conditional positioning based on overlap
									...(layout.hasOverlap
										? {
												// Side-by-side layout for overlapping appointments
												left: `calc(96px + ${layout.left}%)`,
												width: `${layout.width}%`,
												minWidth: '100px',
												marginRight: '4px',
											}
										: {
												// Full width for non-overlapping appointments
												left: '96px',
												right: '16px',
											}),
									cursor: 'pointer',
									overflow: 'hidden',
									zIndex: 2,
									display: 'flex',
									flexDirection: 'column',
									borderLeft: `4px solid ${appointment.status === 'canceled' || appointment.status === 'no_show' || appointment.status === 'declined' ? theme.palette.text.disabled : color}`,
									borderStyle:
										appointment.status === 'canceled' ||
										appointment.status === 'no_show' ||
										appointment.status === 'declined'
											? 'dashed'
											: 'solid',
									bgcolor:
										appointment.status === 'canceled' ||
										appointment.status === 'no_show' ||
										appointment.status === 'declined'
											? alpha(theme.palette.action.disabled, 0.05)
											: appointment.id === focusAppointmentId
												? alpha(color, 0.2)
												: alpha(color, 0.06),
									opacity:
										appointment.status === 'canceled' ||
										appointment.status === 'no_show' ||
										appointment.status === 'declined'
											? 0.6
											: 1,
									'&:hover': {
										zIndex: 3,
										boxShadow: theme.shadows[4],
										bgcolor:
											appointment.status === 'canceled' ||
											appointment.status === 'no_show' ||
											appointment.status === 'declined'
												? alpha(theme.palette.action.disabled, 0.1)
												: appointment.id === focusAppointmentId
													? alpha(color, 0.25)
													: alpha(color, 0.1),
									},
								}}
								onClick={(e) => {
									e.stopPropagation();
									onAppointmentClick?.(appointment);
								}}
							>
								{/* Content area with progressive disclosure */}
								<Box
									sx={{
										position: 'relative',
										p: layout.hasOverlap && layout.totalColumns > 1 ? 0.75 : 1, // Tighter padding for narrow columns
										flex: 1,
										overflow: 'hidden',
									}}
								>
									{/* Status badge */}
									{appointment.status === 'confirmed' && (
										<CheckCircleIcon
											sx={{
												position: 'absolute',
												top: 6,
												right: 6,
												fontSize: 14,
												color,
											}}
										/>
									)}

									{/* Client name and time - responsive layout */}
									<Box
										sx={{
											display: 'flex',
											flexDirection:
												layout.hasOverlap && layout.totalColumns > 1
													? 'column'
													: 'row',
											alignItems:
												layout.hasOverlap && layout.totalColumns > 1
													? 'flex-start'
													: 'center',
											gap:
												layout.hasOverlap && layout.totalColumns > 1 ? 0.25 : 1,
											mb: 0.5,
										}}
									>
										{/* Client name - responsive sizing */}
										<Typography
											variant={
												layout.hasOverlap && layout.totalColumns > 1
													? 'body1'
													: 'h6'
											}
											fontWeight="medium"
											sx={{
												color:
													appointment.status === 'canceled' ||
													appointment.status === 'no_show' ||
													appointment.status === 'declined'
														? 'text.disabled'
														: 'text.primary',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
												flex:
													layout.hasOverlap && layout.totalColumns > 1
														? 'none'
														: 1,
												minWidth: 0,
												fontSize:
													layout.hasOverlap && layout.totalColumns > 1
														? '0.9rem'
														: '1rem',
												textDecoration:
													appointment.status === 'canceled' ||
													appointment.status === 'no_show' ||
													appointment.status === 'declined'
														? 'line-through'
														: 'none',
											}}
										>
											{appointment.client
												? `${appointment.client.first_name} ${appointment.client.last_name}`
												: 'No Client'}
										</Typography>

										{/* Time - responsive layout */}
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 0.5,
												color: 'text.secondary',
												flexShrink: 0,
												flexWrap:
													layout.hasOverlap && layout.totalColumns > 2
														? 'wrap'
														: 'nowrap',
											}}
										>
											<AccessTimeIcon
												sx={{
													fontSize:
														layout.hasOverlap && layout.totalColumns > 1
															? 14
															: 16,
												}}
											/>
											<Typography
												variant={
													layout.hasOverlap && layout.totalColumns > 1
														? 'caption'
														: 'body2'
												}
												sx={{
													whiteSpace:
														layout.hasOverlap && layout.totalColumns > 2
															? 'normal'
															: 'nowrap',
												}}
											>
												{formatTime(appointment.start_time)} -{' '}
												{formatTime(appointment.end_time)}
											</Typography>
											{!(layout.hasOverlap && layout.totalColumns > 2) && (
												<Typography
													variant={
														layout.hasOverlap && layout.totalColumns > 1
															? 'caption'
															: 'body2'
													}
													sx={{ color: 'text.secondary' }}
												>
													({formatDuration(duration)})
												</Typography>
											)}
										</Box>
									</Box>

									{/* Type - always visible but compact when squeezed */}
									<Typography
										variant="caption"
										sx={{
											color: 'text.secondary',
											textTransform: 'capitalize',
											display: 'block',
											mt:
												layout.hasOverlap && layout.totalColumns > 2 ? 0 : 0.25, // Reduce margin when cramped
											fontSize:
												layout.hasOverlap && layout.totalColumns > 2
													? '0.6rem' // Extra small for 3+ columns
													: layout.hasOverlap && layout.totalColumns > 1
														? '0.7rem' // Small for 2 columns
														: '0.75rem', // Normal for single column
											lineHeight:
												layout.hasOverlap && layout.totalColumns > 2
													? 1.1
													: 1.2, // Tighter line height when cramped
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{appointment.type.replace('_', ' ')}
									</Typography>
								</Box>
							</Paper>
						);
					})}

				{/* Overflow indicators for each group with 4+ appointments */}
				{Array.from(overflowByGroup.entries()).map(
					([groupId, groupOverflowAppointments]) => {
						// Find the earliest appointment in this group to position the indicator
						const earliestAppointment = groupOverflowAppointments.reduce(
							(earliest, apt) => {
								return apt.start_time < earliest.start_time ? apt : earliest;
							}
						);

						const startParts = earliestAppointment.start_time.split(':');
						const startHour = parseInt(startParts[0] || '0', 10);
						const startMinute = parseInt(startParts[1] || '0', 10);
						const topPx =
							((startHour - shopStartHour) * 60 + startMinute) *
							(SLOT_HEIGHT_PX / 30);

						return (
							<Box
								key={`overflow-${groupId}`}
								sx={{
									position: 'absolute',
									top: `${topPx}px`,
									left: 'calc(96px + 75%)', // Position at the 4th column
									width: 'calc(25% - 8px)',
									height: `${SLOT_HEIGHT_PX}px`,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									zIndex: 5,
									maxWidth: '100px',
								}}
							>
								<Paper
									elevation={1}
									sx={{
										width: '80%',
										height: '80%',
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										justifyContent: 'center',
										bgcolor: 'grey.50',
										border: '1px dashed',
										borderColor: 'grey.300',
										borderRadius: 1,
										cursor: 'pointer',
										margin: 'auto',
										'&:hover': {
											bgcolor: 'primary.50',
											borderColor: 'primary.main',
										},
									}}
									onClick={() => {
										const key = groupId;
										setExpandedOverflow((prev) => {
											const newSet = new Set(prev);
											if (newSet.has(key)) {
												newSet.delete(key);
											} else {
												newSet.add(key);
											}
											return newSet;
										});
									}}
								>
									<Typography
										variant="caption"
										fontWeight="bold"
										color="primary.main"
										sx={{
											textAlign: 'center',
											fontSize: '0.8rem',
											lineHeight: 1,
										}}
									>
										+{groupOverflowAppointments.length}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{
											textAlign: 'center',
											fontSize: '0.7rem',
											lineHeight: 1,
										}}
									>
										more
									</Typography>
								</Paper>

								{/* Expandable list for this specific group */}
								<Collapse in={expandedOverflow.has(groupId)}>
									<Paper
										elevation={3}
										sx={{
											position: 'absolute',
											top: '100%',
											right: 0,
											mt: 1,
											minWidth: '250px',
											maxHeight: '300px',
											overflow: 'hidden',
											zIndex: 20,
										}}
									>
										<Box
											sx={{
												p: 1,
												bgcolor: 'primary.main',
												color: 'white',
											}}
										>
											<Typography variant="body2" fontWeight={600}>
												{formatTime(earliestAppointment.start_time)} Overflow
											</Typography>
										</Box>
										<List dense sx={{ maxHeight: '250px', overflow: 'auto' }}>
											{groupOverflowAppointments
												.sort((a, b) =>
													a.start_time.localeCompare(b.start_time)
												)
												.map((appointment) => (
													<ListItem
														key={appointment.id}
														onClick={() => {
															onAppointmentClick?.(appointment);
															// Close the overflow panel after clicking
															setExpandedOverflow((prev) => {
																const newSet = new Set(prev);
																newSet.delete(groupId);
																return newSet;
															});
														}}
														sx={{
															borderLeft: `4px solid ${getAppointmentColor(appointment.type)}`,
															cursor: 'pointer',
															'&:hover': {
																bgcolor: 'action.hover',
															},
															py: 1,
														}}
													>
														<ListItemText
															primary={
																<Typography
																	variant="body2"
																	sx={{
																		fontWeight: 500,
																		textDecoration:
																			appointment.status === 'canceled' ||
																			appointment.status === 'no_show' ||
																			appointment.status === 'declined'
																				? 'line-through'
																				: 'none',
																		color:
																			appointment.status === 'canceled' ||
																			appointment.status === 'no_show' ||
																			appointment.status === 'declined'
																				? 'text.disabled'
																				: 'text.primary',
																	}}
																>
																	{appointment.client?.first_name}{' '}
																	{appointment.client?.last_name}
																</Typography>
															}
															secondary={
																<>
																	{formatTime(appointment.start_time)} -{' '}
																	{formatTime(appointment.end_time)} •{' '}
																	{appointment.type.replace('_', ' ')}
																	{appointment.status !== 'pending' &&
																		appointment.status !== 'confirmed' &&
																		` • ${appointment.status}`}
																</>
															}
														/>
													</ListItem>
												))}
										</List>
									</Paper>
								</Collapse>
							</Box>
						);
					}
				)}
			</Box>
		</Box>
	);
}
