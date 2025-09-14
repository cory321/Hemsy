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
}

export const EmailLayout: React.FC<EmailLayoutProps> = ({
  preview,
  children,
  shopName,
  shopEmail,
  shopPhone,
  shopAddress,
}) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>{shopName}</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
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

const header = {
  padding: '24px 0',
  borderBottom: '1px solid #e6e6e6',
  marginBottom: '24px',
};

const headerText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#1a1a1a',
  margin: '0',
  textAlign: 'center' as const,
};

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
