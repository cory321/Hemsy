'use client';

import { useState } from 'react';
import { useInterval } from '@/lib/hooks/useInterval';
import {
	Box,
	Typography,
	Paper,
	useTheme,
	alpha,
	Chip,
	Avatar,
	Stack,
	useMediaQuery,
} from '@mui/material';
import { format, isToday } from 'date-fns';
import {
	generateWeekDays,
	getAppointmentColor,
	formatTime,
	formatDuration,
	getDurationMinutes,
	isShopOpen,
	isPastDate,
	canCreateAppointment,
	isPastDateTime,
	canCreateAppointmentAt,
} from '@/lib/utils/calendar';
import type { Appointment } from '@/types';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface WeekViewDesktopProps {
	currentDate: Date;
	appointments: Appointment[];
	shopHours: Array<{
		day_of_week: number;
		open_time: string | null;
		close_time: string | null;
		is_closed: boolean;
	}>;

	onAppointmentClick?: (appointment: Appointment) => void;

	onDateClick?: (date: Date) => void;

	onTimeSlotClick?: (date: Date, time?: string) => void;
}

// Helper function to check if appointments overlap
function checkOverlap(apt1: Appointment, apt2: Appointment): boolean {
	return (
		apt1.date === apt2.date &&
		apt1.start_time < apt2.end_time &&
		apt1.end_time > apt2.start_time
	);
}

// Helper function to arrange overlapping appointments with overflow handling
function arrangeAppointments(appointments: Appointment[]): {
	visible: Array<Appointment & { column: number; totalColumns: number }>;
	overflow: Map<string, Appointment[]>; // Map of time slots to overflow appointments
} {
	const arranged: Array<
		Appointment & { column: number; totalColumns: number }
	> = [];
	const overflow = new Map<string, Appointment[]>();
	const columns: Appointment[][] = [];

	appointments.forEach((apt) => {
		let placed = false;
		for (let col = 0; col < columns.length; col++) {
			let canPlace = true;
			for (const existingApt of columns[col] || []) {
				if (checkOverlap(apt, existingApt)) {
					canPlace = false;
					break;
				}
			}
			if (canPlace) {
				columns[col]?.push(apt);
				placed = true;
				break;
			}
		}
		if (!placed) {
			columns.push([apt]);
		}
	});

	// Separate visible appointments (max 2 columns) from overflow
	const MAX_VISIBLE_COLUMNS = 2;
	const visibleColumns = columns.slice(0, MAX_VISIBLE_COLUMNS);
	const overflowColumns = columns.slice(MAX_VISIBLE_COLUMNS);

	// Process visible appointments
	visibleColumns.forEach((col, colIndex) => {
		col.forEach((apt) => {
			arranged.push({
				...apt,
				column: colIndex,
				totalColumns: Math.min(columns.length, MAX_VISIBLE_COLUMNS),
			});
		});
	});

	// Process overflow appointments - group by time slot
	overflowColumns.forEach((col) => {
		col.forEach((apt) => {
			// Create a time slot key for grouping
			const timeSlotKey = `${apt.date}-${apt.start_time}`;
			if (!overflow.has(timeSlotKey)) {
				overflow.set(timeSlotKey, []);
			}
			overflow.get(timeSlotKey)!.push(apt);
		});
	});

	return { visible: arranged, overflow };
}

export function WeekViewDesktop({
	currentDate,
	appointments,
	shopHours,
	onAppointmentClick,
	onDateClick,
	onTimeSlotClick,
}: WeekViewDesktopProps) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
	const weekDays = generateWeekDays(currentDate);

	// State to track current time for the indicator
	const [currentTime, setCurrentTime] = useState(new Date());

	// Update current time every 5 minutes with automatic cleanup
	useInterval(
		() => setCurrentTime(new Date()),
		5 * 60 * 1000, // 5 minutes
		false // Don't run immediately
	);

	// Group appointments by date
	const appointmentsByDate = appointments.reduce(
		(acc, appointment) => {
			const dateKey = appointment.date;
			if (!acc[dateKey]) {
				acc[dateKey] = [];
			}
			acc[dateKey].push(appointment);
			return acc;
		},
		{} as Record<string, Appointment[]>
	);

	// Generate time slots with 30-minute intervals based on shop hours
	const timeSlots: string[] = [];

	// Find the earliest open time and latest close time across all days
	const openDays = shopHours.filter((h) => !h.is_closed);
	const earliestHour = openDays.reduce((earliest, hours) => {
		if (!hours.open_time) return earliest;
		const hour = parseInt(hours.open_time.split(':')[0] || '0');
		return Math.min(earliest, hour);
	}, 24);
	const latestHour = openDays.reduce((latest, hours) => {
		if (!hours.close_time) return latest;
		const hour = parseInt(hours.close_time.split(':')[0] || '0');
		return Math.max(latest, hour);
	}, 0);

	// Default to 8 AM - 6 PM if no shop hours found (matching DayView behavior)
	const gridStartHour = earliestHour === 24 ? 8 : earliestHour;
	const gridEndHour = latestHour === 0 ? 18 : latestHour;

	for (let hour = gridStartHour; hour <= gridEndHour; hour++) {
		timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
		timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
	}

	// Current time indicator
	const currentTimeMinutes =
		currentTime.getHours() * 60 + currentTime.getMinutes();
	const currentTimePosition =
		(currentTimeMinutes - gridStartHour * 60) * (100 / 30); // 100px per 30 minutes (further increased to fully show all data)

	return (
		<Box
			sx={{
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
			}}
		>
			{/* Header with day columns */}
			<Box
				sx={{
					display: 'flex',
					borderBottom: `2px solid ${theme.palette.divider}`,
				}}
			>
				{/* Time column header */}
				<Box
					sx={{
						width: { xs: 80, md: 90 },
						flexShrink: 0,
						p: 2,
						borderRight: `1px solid ${theme.palette.divider}`,
					}}
				/>

				{/* Day headers */}
				{weekDays.map((day, dayIndex) => {
					const isCurrentDay = isToday(day);
					const dateStr = format(day, 'yyyy-MM-dd');
					const dayAppointments = appointmentsByDate[dateStr] || [];
					const isOpen = isShopOpen(day, shopHours);
					const isPast = isPastDate(day);
					const canCreate = canCreateAppointment(day, shopHours);

					return (
						<Box
							key={dayIndex}
							sx={{
								flex: 1,
								p: 2,
								borderRight:
									dayIndex < 6 ? `1px solid ${theme.palette.divider}` : 'none',
								bgcolor: isPast
									? alpha(theme.palette.action.disabled, 0.08)
									: isCurrentDay
										? alpha(theme.palette.primary.main, 0.05)
										: 'inherit',
								cursor: 'pointer',
								'&:hover': {
									bgcolor: !canCreate
										? alpha(theme.palette.action.disabled, 0.12)
										: alpha(theme.palette.primary.main, 0.08),
								},
							}}
							onClick={() => onDateClick?.(day)}
						>
							<Typography
								variant="caption"
								color={isPast ? 'text.disabled' : 'text.secondary'}
								sx={{ textTransform: 'uppercase' }}
							>
								{format(day, 'EEE')}
							</Typography>
							<Typography
								variant="h5"
								fontWeight={isCurrentDay ? 'bold' : 'normal'}
								color={
									isPast
										? 'text.disabled'
										: isCurrentDay
											? 'primary'
											: 'text.primary'
								}
							>
								{format(day, 'd')}
							</Typography>
							{dayAppointments.length > 0 && (
								<Typography variant="caption" color="text.secondary">
									{dayAppointments.length} appointments
								</Typography>
							)}
							{!isOpen && <Chip label="Closed" size="small" sx={{ mt: 0.5 }} />}
						</Box>
					);
				})}
			</Box>

			{/* Time grid */}
			<Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
				<Box
					sx={{
						display: 'flex',
						position: 'relative',
						minHeight: timeSlots.length * 100,
					}}
				>
					{/* Time labels */}
					<Box sx={{ width: { xs: 80, md: 90 }, flexShrink: 0 }}>
						{timeSlots.map((time, index) => (
							<Box
								key={time}
								sx={{
									height: 100,
									px: 2,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'flex-end',
									borderBottom:
										index % 2 === 1
											? `1px solid ${theme.palette.divider}`
											: 'none',
								}}
							>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ whiteSpace: 'nowrap' }}
								>
									{formatTime(time)}
								</Typography>
							</Box>
						))}
					</Box>

					{/* Day columns with appointments */}
					{weekDays.map((day, dayIndex) => {
						const dateStr = format(day, 'yyyy-MM-dd');
						const dayAppointments = (appointmentsByDate[dateStr] || []).sort(
							(a, b) => a.start_time.localeCompare(b.start_time)
						);
						const {
							visible: arrangedAppointments,
							overflow: overflowAppointments,
						} = arrangeAppointments(dayAppointments);
						const isOpen = isShopOpen(day, shopHours);
						const isPast = isPastDate(day);

						return (
							<Box
								key={dayIndex}
								sx={{
									flex: 1,
									position: 'relative',
									borderRight:
										dayIndex < 6
											? `1px solid ${theme.palette.divider}`
											: 'none',
									bgcolor: isPast
										? alpha(theme.palette.action.disabled, 0.08)
										: !isOpen
											? alpha(theme.palette.action.disabled, 0.02)
											: 'background.paper',
								}}
							>
								{/* Time slot lines */}
								{timeSlots.map((time, index) => {
									// Check if this time slot has appointments
									const timeHour = parseInt(time.split(':')[0] || '0');
									const timeMinute = parseInt(time.split(':')[1] || '0');
									const slotAppointments = dayAppointments.filter((apt) => {
										const startHour = parseInt(
											apt.start_time.split(':')[0] || '0'
										);
										const startMinute = parseInt(
											apt.start_time.split(':')[1] || '0'
										);
										const endHour = parseInt(apt.end_time.split(':')[0] || '0');
										const endMinute = parseInt(
											apt.end_time.split(':')[1] || '0'
										);

										// Check if appointment overlaps with this 30-minute slot
										const slotStartMinutes = timeHour * 60 + timeMinute;
										const slotEndMinutes = slotStartMinutes + 30;
										const aptStartMinutes = startHour * 60 + startMinute;
										const aptEndMinutes = endHour * 60 + endMinute;

										return (
											aptStartMinutes < slotEndMinutes &&
											aptEndMinutes > slotStartMinutes
										);
									});

									const canCreate = canCreateAppointment(day, shopHours);
									const isPastSlot = isPastDateTime(day, time);

									// Check if we have a 15-minute appointment in this slot
									const has15MinAppointment = slotAppointments.some((apt) => {
										const duration = getDurationMinutes(
											apt.start_time,
											apt.end_time
										);
										return duration === 15;
									});

									// Determine if we can add an appointment
									const canAddInSlot =
										canCreate &&
										!isPastSlot &&
										(slotAppointments.length === 0 || has15MinAppointment);

									// Determine where to position the add button if we have a 15-min appointment
									let addButtonPosition = null;
									if (has15MinAppointment && slotAppointments.length === 1) {
										const apt = slotAppointments[0];
										if (apt) {
											const [aptH, aptM] = apt.start_time.split(':');
											const aptStartMinutes =
												parseInt(aptH || '0', 10) * 60 +
												parseInt(aptM || '0', 10);
											const slotStartMinutes = timeHour * 60 + timeMinute;

											// If appointment starts at the beginning of the slot, add button goes to bottom half
											if (aptStartMinutes === slotStartMinutes) {
												addButtonPosition = 'bottom';
											} else {
												// Otherwise, add button goes to top half
												addButtonPosition = 'top';
											}
										}
									}

									const canClickTimeSlot = onTimeSlotClick && canAddInSlot;

									return (
										<Box
											key={time}
											sx={{
												position: 'absolute',
												top: index * 100,
												left: 0,
												right: 0,
												height: 100,
												borderBottom:
													index % 2 === 1
														? `1px solid ${theme.palette.divider}`
														: 'none',
												borderTop:
													index % 2 === 0
														? `1px dotted ${alpha(theme.palette.divider, 0.5)}`
														: 'none',
												cursor: canClickTimeSlot ? 'pointer' : 'default',
												'&:hover':
													canClickTimeSlot && !isMobile
														? {
																bgcolor: alpha(
																	theme.palette.primary.main,
																	0.04
																),
																'& .add-appointment-hint': {
																	opacity: 1,
																},
															}
														: undefined,
											}}
											data-testid={
												format(day, 'yyyy-MM-dd') ===
												format(currentDate, 'yyyy-MM-dd')
													? `week-slot-${time}`
													: undefined
											}
											onClick={(e) => {
												if (canClickTimeSlot) {
													// For 15-min appointments, determine the time based on click position
													if (
														has15MinAppointment &&
														slotAppointments.length === 1
													) {
														const rect =
															e.currentTarget.getBoundingClientRect();
														const clickY = e.clientY - rect.top;
														const clickInBottomHalf = clickY > rect.height / 2;

														// Determine the start time based on where they clicked
														let adjustedTime = time;
														if (
															addButtonPosition === 'bottom' &&
															clickInBottomHalf
														) {
															// Existing appointment is in top half, clicked bottom half
															adjustedTime = `${timeHour.toString().padStart(2, '0')}:15`;
														} else if (
															addButtonPosition === 'top' &&
															!clickInBottomHalf
														) {
															// Existing appointment is in bottom half, clicked top half
															adjustedTime = time;
														}
														onTimeSlotClick(day, adjustedTime);
													} else {
														onTimeSlotClick(day, time);
													}
												}
											}}
										>
											{/* Add appointment hint for empty slots */}
											{canClickTimeSlot && !isMobile && (
												<Box
													className="add-appointment-hint"
													sx={{
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														height: '100%',
														gap: 0.5,
														opacity: 0,
														transition: 'opacity 0.2s',
														pointerEvents: 'none',
														position: 'absolute',
														top: 0,
														left: 0,
														right: 0,
														zIndex: 1,
													}}
												>
													<AddIcon fontSize="small" color="action" />
													<Typography variant="caption" color="text.secondary">
														Add appointment
													</Typography>
												</Box>
											)}
										</Box>
									);
								})}

								{/* Appointments */}
								{arrangedAppointments.map((appointment) => {
									const startHour = parseInt(
										appointment.start_time.split(':')[0] || '0'
									);
									const startMinute = parseInt(
										appointment.start_time.split(':')[1] || '0'
									);
									const endHour = parseInt(
										appointment.end_time.split(':')[0] || '0'
									);
									const endMinute = parseInt(
										appointment.end_time.split(':')[1] || '0'
									);

									const top =
										((startHour - gridStartHour) * 60 + startMinute) *
										(100 / 30); // 100px per 30 minutes
									const height =
										((endHour - startHour) * 60 + (endMinute - startMinute)) *
										(100 / 30);
									const width = 100 / appointment.totalColumns;
									const left = appointment.column * width;
									const isCompact = false; // Always use regular layout for consistent typography
									const is15MinAppointment =
										(endHour - startHour) * 60 + (endMinute - startMinute) ===
										15;

									return (
										<Paper
											key={appointment.id}
											elevation={2}
											sx={{
												position: 'absolute',
												top: `${top}px`,
												left: `${left}%`,
												width: `calc(${width}% - 4px)`,
												height: `${Math.max(height, 50)}px`,
												cursor: 'pointer',
												overflow: 'hidden',
												zIndex: 2,
												transition: 'all 0.2s',
												display: 'flex',
												flexDirection: isCompact ? 'row' : 'column',
												opacity:
													appointment.status === 'canceled' ||
													appointment.status === 'no_show' ||
													appointment.status === 'declined'
														? 0.6
														: 1,
												border:
													appointment.status === 'canceled' ||
													appointment.status === 'no_show' ||
													appointment.status === 'declined'
														? '1px dashed'
														: 'none',
												borderColor: 'text.disabled',
												'&:hover': {
													zIndex: 3,
													transform: 'scale(1.02)',
													boxShadow: theme.shadows[6],
												},
											}}
											onClick={() => onAppointmentClick?.(appointment)}
										>
											{isCompact ? (
												// Compact single-row layout for 15-minute appointments
												<Box
													sx={{
														display: 'flex',
														alignItems: 'center',
														width: '100%',
														bgcolor: 'background.paper',
														borderTop: `3px ${appointment.status === 'canceled' || appointment.status === 'no_show' || appointment.status === 'declined' ? 'dashed' : 'solid'} ${appointment.status === 'canceled' || appointment.status === 'no_show' || appointment.status === 'declined' ? theme.palette.text.disabled : getAppointmentColor(appointment.type)}`,
														px: 1,
														gap: 0.5,
													}}
												>
													<Typography
														variant="caption"
														fontWeight="medium"
														sx={{
															color:
																appointment.status === 'canceled' ||
																appointment.status === 'no_show' ||
																appointment.status === 'declined'
																	? 'text.disabled'
																	: 'text.primary',
															fontSize: '0.625rem', // 10px - Extra small for compact week view
															overflow: 'hidden',
															textOverflow: 'ellipsis',
															whiteSpace: 'nowrap',
															flex: 1,
															minWidth: 0,
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
													<Typography
														variant="caption"
														sx={{
															color: 'text.secondary',
															fontSize: '0.625rem', // 10px - Extra small for compact week view
															whiteSpace: 'nowrap',
															flexShrink: 0,
														}}
													>
														{formatTime(appointment.start_time)}
													</Typography>
													{appointment.status === 'confirmed' && (
														<CheckCircleIcon
															sx={{
																fontSize: 10,
																color: getAppointmentColor(appointment.type),
																flexShrink: 0,
															}}
														/>
													)}
												</Box>
											) : (
												<>
													{/* Regular layout for longer appointments */}
													{/* Colored header strip */}
													<Box
														sx={{
															bgcolor:
																appointment.status === 'canceled' ||
																appointment.status === 'no_show' ||
																appointment.status === 'declined'
																	? theme.palette.action.disabled
																	: getAppointmentColor(appointment.type),
															color: 'white',
															px: 1,
															py: 0.5,
															minHeight: 24,
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'space-between',
															flexShrink: 0,
														}}
													>
														<Typography
															variant="caption"
															fontWeight="bold"
															sx={{
																lineHeight: 1.2,
															}}
														>
															{formatTime(appointment.start_time)}
														</Typography>
														{appointment.status === 'confirmed' && (
															<CheckCircleIcon sx={{ fontSize: 12, ml: 0.5 }} />
														)}
													</Box>
													{/* White content area */}
													<Box
														sx={{
															flex: 1,
															bgcolor: 'background.paper',
															p: is15MinAppointment ? 0 : 1,
															pt: is15MinAppointment ? 0 : 1,
															px: 1,
															pb: 1,
															overflow: 'hidden',
														}}
													>
														<Typography
															variant="body2"
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

														{/* Appointment type - show for all except 15-minute appointments */}
														{!is15MinAppointment && (
															<Typography
																variant="caption"
																sx={{
																	color: 'text.secondary',
																	textTransform: 'capitalize',
																	display: 'block',
																	mt: 0.25,
																}}
															>
																{appointment.type.replace('_', ' ')}
															</Typography>
														)}

														{appointment.notes && (
															<Typography
																variant="caption"
																display="block"
																sx={{ mt: 0.5 }}
															>
																{appointment.notes}
															</Typography>
														)}
													</Box>
												</>
											)}
										</Paper>
									);
								})}

								{/* Overflow badges for appointments beyond 2 columns */}
								{Array.from(overflowAppointments.entries()).map(
									([timeSlotKey, overflowApts]) => {
										// Parse the time slot to get positioning
										const [dateStr, timeStr] = timeSlotKey.split('-');
										if (dateStr !== format(day, 'yyyy-MM-dd') || !timeStr)
											return null;

										const [timeHour, timeMinute] = timeStr
											.split(':')
											.map(Number);
										if (timeHour === undefined || timeMinute === undefined)
											return null;

										const top =
											((timeHour - gridStartHour) * 60 + timeMinute) *
											(100 / 30);
										const overflowCount = overflowApts.length;

										return (
											<Box
												key={timeSlotKey}
												sx={{
													position: 'absolute',
													top: `${top + 5}px`, // Slight offset from top
													right: '4px',
													zIndex: 3,
													cursor: 'pointer',
													'&:hover': {
														transform: 'scale(1.1)',
													},
												}}
												onClick={() => onDateClick?.(day)} // Navigate to day view
											>
												<Chip
													label={`+${overflowCount} more`}
													size="small"
													sx={{
														height: '20px',
														fontSize: '0.625rem', // 10px - Extra small for compact chip
														bgcolor: 'primary.main',
														color: 'white',
														'&:hover': {
															bgcolor: 'primary.dark',
														},
													}}
												/>
											</Box>
										);
									}
								)}

								{/* Current time indicator */}
								{(() => {
									// Determine today's shop hours
									const dayOfWeek = day.getDay();
									const hoursForDay = shopHours.find(
										(h) => h.day_of_week === dayOfWeek
									);
									const isCurrentDay = isToday(day);
									const displayedStartMinutes = gridStartHour * 60;
									// The generated grid includes a :30 slot for the last hour
									const displayedEndMinutesExclusive = gridEndHour * 60 + 30;

									// Require: today, hours defined and not closed, within both displayed grid and that day's hours
									const withinDisplayedGrid =
										currentTimeMinutes >= displayedStartMinutes &&
										currentTimeMinutes < displayedEndMinutesExclusive;
									const withinDayHours =
										hoursForDay && !hoursForDay.is_closed
											? (() => {
													const openHour = hoursForDay.open_time
														? parseInt(
																hoursForDay.open_time.split(':')[0] || '0'
															)
														: gridStartHour;
													const openMinute = hoursForDay.open_time
														? parseInt(
																hoursForDay.open_time.split(':')[1] || '0'
															)
														: 0;
													const closeHour = hoursForDay.close_time
														? parseInt(
																hoursForDay.close_time.split(':')[0] || '0'
															)
														: gridEndHour;
													const closeMinute = hoursForDay.close_time
														? parseInt(
																hoursForDay.close_time.split(':')[1] || '0'
															)
														: 0;
													const start = openHour * 60 + openMinute;
													const endExclusive =
														closeHour * 60 + closeMinute + 30; // include last slot span
													return (
														currentTimeMinutes >= start &&
														currentTimeMinutes < endExclusive
													);
												})()
											: false;

									const showIndicator =
										isCurrentDay && withinDisplayedGrid && withinDayHours;

									return (
										showIndicator && (
											<Box
												data-testid="current-time-indicator"
												sx={{
													position: 'absolute',
													top: `${currentTimePosition}px`,
													left: 0,
													right: 0,
													height: 2,
													bgcolor: 'error.main',
													zIndex: 4,
													'&::before': {
														content: '""',
														position: 'absolute',
														left: -6,
														top: -4,
														width: 10,
														height: 10,
														borderRadius: '50%',
														bgcolor: 'error.main',
													},
												}}
											/>
										)
									);
								})()}
							</Box>
						);
					})}
				</Box>
			</Box>
		</Box>
	);
}
