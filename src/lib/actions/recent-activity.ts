'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { formatInTimezone } from '@/lib/utils/date-time-utc';
import { getShopTimezone } from '@/lib/utils/timezone-helpers';

export interface ActivityItem {
	id: string;
	type: 'payment' | 'garment' | 'appointment' | 'order' | 'client';
	text: string;
	detail: string;
	timestamp: Date;
	clientName?: string;
	orderNumber?: string;
	amount?: number;
}

export async function getRecentActivity(
	limit: number = 5
): Promise<ActivityItem[]> {
	try {
		const supabase = await createClient();
		const { shop } = await ensureUserAndShop();
		const shopId = shop.id;

		// Get shop timezone for proper time formatting
		const shopTimezone = await getShopTimezone(shopId);

		const activities: ActivityItem[] = [];
		const now = new Date();

		// 1. Payment received (when payment status = completed)
		const { data: payments } = await supabase
			.from('payments')
			.select(
				`
        id,
        amount_cents,
        payment_method,
        processed_at,
        invoice:invoices!inner (
          order:orders!inner (
            order_number,
            shop_id,
            client:clients (
              first_name,
              last_name
            )
          )
        )
      `
			)
			.eq('invoice.order.shop_id', shopId)
			.eq('status', 'completed')
			.not('processed_at', 'is', null)
			.order('processed_at', { ascending: false })
			.limit(5);

		if (payments) {
			payments.forEach((payment) => {
				const invoice = payment.invoice as any;
				const order = invoice?.order;
				const client = order?.client;
				const clientName = client
					? `${client.first_name} ${client.last_name}`
					: 'Unknown Client';
				const amount = payment.amount_cents / 100;

				activities.push({
					id: `payment-${payment.id}`,
					type: 'payment',
					text: 'Payment received',
					detail: `$${amount.toFixed(2)} from ${clientName}`,
					timestamp: new Date(payment.processed_at!),
					clientName,
					orderNumber: order?.order_number,
					amount,
				});
			});
		}

		// 2. Garment completed (stage = 'Done')
		// 3. Garment ready for pickup (stage = 'Ready For Pickup')
		// 4. Garment work started (stage = 'In Progress')
		const { data: garments } = await supabase
			.from('garments')
			.select(
				`
        id,
        name,
        stage,
        updated_at,
        order:orders!inner (
          order_number,
          shop_id,
          client:clients (
            first_name,
            last_name
          )
        )
      `
			)
			.eq('order.shop_id', shopId)
			.in('stage', ['Done', 'Ready For Pickup', 'In Progress'])
			.order('updated_at', { ascending: false })
			.limit(8);

		if (garments) {
			garments.forEach((garment) => {
				const order = garment.order as any;
				const client = order?.client;
				const clientName = client
					? `${client.first_name} ${client.last_name}`
					: 'Unknown Client';

				let text: string;

				switch (garment.stage) {
					case 'Done':
						text = 'Garment completed';
						break;
					case 'Ready For Pickup':
						text = 'Garment ready for pickup';
						break;
					case 'In Progress':
						text = 'Garment work started';
						break;
					default:
						return; // Skip if somehow not one of our target stages
				}

				activities.push({
					id: `garment-${garment.id}`,
					type: 'garment',
					text,
					detail: `${garment.name} for ${clientName}`,
					timestamp: new Date(garment.updated_at!),
					clientName,
					orderNumber: order?.order_number,
				});
			});
		}

		// 5. Appointment confirmed (status = 'confirmed')
		// 6. Appointment scheduled (status = 'pending')
		const { data: appointments } = await supabase
			.from('appointments')
			.select(
				`
        id,
        type,
        status,
        start_at,
        updated_at,
        client:clients (
          first_name,
          last_name
        )
      `
			)
			.eq('shop_id', shopId)
			.in('status', ['confirmed', 'pending'])
			.order('updated_at', { ascending: false })
			.limit(5);

		if (appointments) {
			appointments.forEach((appointment) => {
				const client = appointment.client as any;
				const clientName = client
					? `${client.first_name} ${client.last_name}`
					: 'Unknown Client';

				// Convert UTC start_at to shop timezone for proper display
				const startTimeUTC = new Date(appointment.start_at!);
				const timeStr = formatInTimezone(startTimeUTC, shopTimezone, 'h:mm a');

				// Format dates in shop timezone for comparison
				const appointmentDateStr = formatInTimezone(
					startTimeUTC,
					shopTimezone,
					'yyyy-MM-dd'
				);
				const nowInShopTZ = formatInTimezone(now, shopTimezone, 'yyyy-MM-dd');
				const tomorrowInShopTZ = formatInTimezone(
					new Date(now.getTime() + 24 * 60 * 60 * 1000),
					shopTimezone,
					'yyyy-MM-dd'
				);

				const isToday = appointmentDateStr === nowInShopTZ;
				const isTomorrow = appointmentDateStr === tomorrowInShopTZ;

				let timeDetail = timeStr;
				if (isToday) {
					timeDetail = `today at ${timeStr}`;
				} else if (isTomorrow) {
					timeDetail = `tomorrow at ${timeStr}`;
				} else {
					const monthDay = formatInTimezone(
						startTimeUTC,
						shopTimezone,
						'MMM d'
					);
					timeDetail = `${monthDay} at ${timeStr}`;
				}

				const isConfirmed = appointment.status === 'confirmed';
				const text = isConfirmed
					? 'Appointment confirmed'
					: 'Appointment scheduled';
				const detail = isConfirmed
					? `${clientName} at ${timeStr}`
					: `New ${appointment.type} with ${clientName} ${timeDetail}`;

				activities.push({
					id: `appointment-${appointment.id}`,
					type: 'appointment',
					text,
					detail,
					timestamp: new Date(appointment.updated_at!),
					clientName,
				});
			});
		}

		// 7. New order created
		const { data: newOrders, error: newOrdersError } = await supabase
			.from('orders')
			.select(
				`
        id,
        order_number,
        total_cents,
        created_at,
        client_id
      `
			)
			.eq('shop_id', shopId)
			.order('created_at', { ascending: false })
			.limit(5);

		if (newOrders && newOrders.length > 0) {
			// Get client data separately
			const clientIds = newOrders
				.map((order) => order.client_id)
				.filter((id): id is string => id !== null);
			const { data: clients } =
				clientIds.length > 0
					? await supabase
							.from('clients')
							.select('id, first_name, last_name')
							.in('id', clientIds)
					: { data: [] };

			const clientsMap = new Map();
			clients?.forEach((client) => {
				clientsMap.set(client.id, client);
			});

			newOrders.forEach((order) => {
				const client = clientsMap.get(order.client_id);
				const clientName = client
					? `${client.first_name} ${client.last_name}`
					: 'Unknown Client';
				const amount = order.total_cents / 100;

				activities.push({
					id: `new-order-${order.id}`,
					type: 'order',
					text: 'New order created',
					detail: `${order.order_number} for ${clientName} ($${amount.toFixed(2)})`,
					timestamp: new Date(order.created_at!),
					clientName,
					orderNumber: order.order_number,
					amount,
				});
			});
		}

		// 8. Order completed (status = 'completed')
		// 9. Order ready for pickup (status = 'ready_for_pickup')
		const { data: orderStatusUpdates } = await supabase
			.from('orders')
			.select(
				`
        id,
        order_number,
        total_cents,
        status,
        updated_at,
        client:clients (
          first_name,
          last_name
        )
      `
			)
			.eq('shop_id', shopId)
			.in('status', ['completed', 'ready_for_pickup'])
			.order('updated_at', { ascending: false })
			.limit(5);

		if (orderStatusUpdates) {
			orderStatusUpdates.forEach((order) => {
				const client = order.client as any;
				const clientName = client
					? `${client.first_name} ${client.last_name}`
					: 'Unknown Client';

				const isCompleted = order.status === 'completed';
				const text = isCompleted ? 'Order completed' : 'Order ready for pickup';
				const detail = isCompleted
					? `${order.order_number} completed for ${clientName}`
					: `${order.order_number} ready - ${clientName}`;

				activities.push({
					id: `order-status-${order.id}`,
					type: 'order',
					text,
					detail,
					timestamp: new Date(order.updated_at!),
					clientName,
					orderNumber: order.order_number,
				});
			});
		}

		// 10. New client added
		const { data: newClients } = await supabase
			.from('clients')
			.select(
				`
        id,
        first_name,
        last_name,
        created_at,
        shop_id
      `
			)
			.eq('shop_id', shopId)
			.order('created_at', { ascending: false })
			.limit(3);

		if (newClients) {
			newClients.forEach((client) => {
				const clientName = `${client.first_name} ${client.last_name}`;

				activities.push({
					id: `client-${client.id}`,
					type: 'client',
					text: 'New client added',
					detail: `Welcome new client: ${clientName}`,
					timestamp: new Date(client.created_at!),
					clientName,
				});
			});
		}

		// Sort by timestamp (most recent first), then limit
		const sortedActivities = activities
			.sort((a, b) => {
				return b.timestamp.getTime() - a.timestamp.getTime();
			})
			.slice(0, limit);

		return sortedActivities;
	} catch (error) {
		console.error('Error fetching recent activity:', error);
		// Return empty array on error instead of dummy data
		// This prevents confusion for new users who should see no activity
		return [];
	}
}
