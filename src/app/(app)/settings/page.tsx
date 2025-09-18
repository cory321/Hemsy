import { Suspense } from 'react';
import { getShopBusinessInfo } from '@/lib/actions/shops';
import { getEmailSignature } from '@/lib/actions/emails/email-signatures';
import { SettingsClient } from './SettingsClient';

// Server Component that fetches data on the server
export default async function SettingsPage() {
	// Fetch data in parallel on the server
	const [shopResult, signatureResult] = await Promise.all([
		getShopBusinessInfo(),
		getEmailSignature(),
	]);

	// Handle errors
	if (!shopResult.success) {
		throw new Error(shopResult.error || 'Failed to load shop data');
	}

	// Pass all data to client component
	return (
		<SettingsClient
			initialShopData={shopResult.data}
			initialSignature={signatureResult.success ? signatureResult.data : null}
		/>
	);
}
