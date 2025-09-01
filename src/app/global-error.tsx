'use client';

import { useEffect } from 'react';
import { Nunito } from 'next/font/google';

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development only
    // In production, this should be sent to an error tracking service
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className={`${nunito.variable} ${nunito.className}`}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: nunito.style.fontFamily,
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              padding: '32px',
              borderRadius: '8px',
              backgroundColor: '#fff',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
          >
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ margin: '0 auto 24px' }}
            >
              <path
                d="M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z"
                stroke="#EF4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: 600,
                marginBottom: '16px',
                color: '#1F2937',
              }}
            >
              Something went wrong!
            </h1>

            <p
              style={{
                fontSize: '16px',
                color: '#6B7280',
                marginBottom: '24px',
                lineHeight: '1.5',
              }}
            >
              We&apos;re sorry, but something unexpected happened. Our team has
              been notified and we&apos;re working to fix the issue.
            </p>

            <div
              style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
            >
              <button
                onClick={() => reset()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#605143',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#605143',
                  border: '2px solid #605143',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
