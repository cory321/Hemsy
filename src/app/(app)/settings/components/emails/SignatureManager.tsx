'use client';

import { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	TextField,
	Button,
	Alert,
	CircularProgress,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';

import { EmailSignature } from '@/types/email';
import { useToast } from '@/hooks/useToast';
import { updateEmailSignature } from '@/lib/actions/emails/email-signatures';

interface SignatureManagerProps {
	shopData?: any;
	initialSignature?: any;
}

export function SignatureManager({
	shopData,
	initialSignature,
}: SignatureManagerProps) {
	const [signature, setSignature] = useState<EmailSignature | null>(
		initialSignature || null
	);
	const [loading, setLoading] = useState(false); // No loading needed since data is pre-fetched
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [signatureContent, setSignatureContent] = useState(
		initialSignature?.content || ''
	);
	const { showToast } = useToast();

	const generateDefaultSignature = (shop: any): string => {
		let content = '';

		// Add shop name
		if (shop.businessName || shop.name) {
			content += shop.businessName || shop.name;
		}

		// Add email
		if (shop.email) {
			if (content) content += '\n';
			content += `Email: ${shop.email}`;
		}

		// Add phone
		if (shop.businessPhone) {
			if (content) content += '\n';
			content += `Phone: ${shop.businessPhone}`;
		}

		// Add address
		if (shop.businessAddress) {
			if (content) content += '\n';
			content += shop.businessAddress;
		}

		return content;
	};

	// Update default signature content when shop data changes and no signature exists
	useEffect(() => {
		if (shopData && !signature && !signatureContent) {
			const defaultContent = generateDefaultSignature(shopData);
			setSignatureContent(defaultContent);
		}
	}, [shopData, signature, signatureContent]);

	const handleEdit = () => {
		setEditing(true);
	};

	const handleCancel = () => {
		setEditing(false);
		setSignatureContent(signature?.content || '');
	};

	const handleSave = async () => {
		if (!signatureContent.trim()) {
			showToast('Please enter signature content', 'error');
			return;
		}

		try {
			setSaving(true);
			const result = await updateEmailSignature(signatureContent);

			if (result.success) {
				showToast('Signature updated successfully', 'success');
				setEditing(false);
				// Update local state instead of reloading
				setSignature((prev) =>
					prev ? { ...prev, content: signatureContent } : null
				);
			} else {
				showToast(result.error || 'Failed to update signature', 'error');
			}
		} catch (error) {
			showToast('Failed to update signature', 'error');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" p={4}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={2}
			>
				<Typography variant="h6">Email Signature</Typography>
				{!editing && (
					<Button
						variant="contained"
						startIcon={<EditIcon />}
						onClick={handleEdit}
					>
						Edit Signature
					</Button>
				)}
			</Box>

			<Alert severity="info" sx={{ mb: 2 }}>
				Your email signature will be automatically included at the bottom of all
				emails sent from Hemsy.
			</Alert>

			<Card>
				<CardContent>
					{editing ? (
						<>
							<TextField
								fullWidth
								multiline
								rows={6}
								label="Signature Content"
								value={signatureContent}
								onChange={(e) => setSignatureContent(e.target.value)}
								margin="normal"
								helperText="This will appear at the bottom of your emails"
								disabled={saving}
							/>
							<Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
								<Button onClick={handleCancel} disabled={saving}>
									Cancel
								</Button>
								<Button
									onClick={handleSave}
									variant="contained"
									disabled={saving}
								>
									{saving ? 'Saving...' : 'Save'}
								</Button>
							</Box>
						</>
					) : (
						<>
							{signatureContent ? (
								<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
									{signatureContent}
								</Typography>
							) : (
								<Typography variant="body2" color="text.secondary">
									No signature set. Click &quot;Edit Signature&quot; to add one.
								</Typography>
							)}
						</>
					)}
				</CardContent>
			</Card>
		</Box>
	);
}
