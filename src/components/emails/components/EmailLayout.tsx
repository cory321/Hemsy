import React from 'react';
import {
	Html,
	Head,
	Preview,
	Body,
	Container,
	Section,
	Text,
	Hr,
	Link,
} from '@react-email/components';

interface EmailLayoutProps {
	preview: string;
	children: React.ReactNode;
	shopName: string;
	shopEmail?: string | undefined;
	shopPhone?: string | undefined;
	shopAddress?: string | undefined;
	signature?: string | undefined;
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
	preview,
	children,
	shopName,
	shopEmail,
	shopPhone,
	shopAddress,
	signature,
}) => {
	// Debug logging for email layout props
	console.log('📧 EmailLayout props:', {
		shopName,
		shopEmail,
		shopPhone,
		shopAddress,
		signature,
		hasSignature: !!signature,
	});

	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={main}>
				<Container style={container}>
					{/* Main Content - templates now handle their own headers */}
					<Section style={content}>{children}</Section>

					{/* Footer */}
					<Hr style={hr} />
					<Section style={footer}>
						{/* Custom signature if provided */}
						{signature && (
							<>
								<Text style={signatureText}>{signature}</Text>
								<Hr style={signatureHr} />
							</>
						)}

						{/* Default shop info - only show if no custom signature */}
						{!signature && (
							<>
								<Text style={footerText}>{shopName}</Text>
								{shopEmail && (
									<Text style={footerText}>
										Email:{' '}
										<Link href={`mailto:${shopEmail}`} style={link}>
											{shopEmail}
										</Link>
									</Text>
								)}
								{shopPhone && (
									<Text style={footerText}>
										Phone:{' '}
										<Link href={`tel:${shopPhone}`} style={link}>
											{shopPhone}
										</Link>
									</Text>
								)}
								{shopAddress && <Text style={footerText}>{shopAddress}</Text>}
							</>
						)}
						<Text style={footerSmall}>
							This email was sent from Hemsy on behalf of {shopName}
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
};

// Styles
const main = {
	backgroundColor: '#ffffff',
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
	margin: '0 auto',
	padding: '20px 0 48px',
	maxWidth: '560px',
};

// Header styles removed - templates now handle their own headers

const content = {
	padding: '0',
};

const hr = {
	borderColor: '#e6e6e6',
	margin: '32px 0',
};

const footer = {
	color: '#666666',
	fontSize: '14px',
	lineHeight: '24px',
};

const footerText = {
	margin: '0 0 8px 0',
	fontSize: '14px',
	lineHeight: '20px',
	color: '#666666',
};

const footerSmall = {
	margin: '16px 0 0 0',
	fontSize: '12px',
	lineHeight: '16px',
	color: '#999999',
};

const link = {
	color: '#2563eb',
	textDecoration: 'underline',
};

const signatureText = {
	margin: '0 0 16px 0',
	fontSize: '14px',
	lineHeight: '20px',
	color: '#666666',
	whiteSpace: 'pre-wrap' as const,
};

const signatureHr = {
	borderColor: '#e6e6e6',
	margin: '16px 0',
};
