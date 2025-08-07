import * as React from 'react';

interface EmailTemplateProps {
  title: string;
  content: string;
  details?: Array<{ label: string; value: string }>;
  footer?: string;
}

export function EmailTemplate({
  title,
  content,
  details,
  footer,
}: EmailTemplateProps) {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#ffffff',
      }}
    >
      <h1
        style={{
          color: '#1976d2',
          fontSize: '24px',
          marginBottom: '20px',
          textAlign: 'center',
        }}
      >
        {title}
      </h1>

      <p
        style={{
          color: '#333333',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '20px',
        }}
      >
        {content}
      </p>

      {details && details.length > 0 && (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          <h3
            style={{
              color: '#1976d2',
              fontSize: '18px',
              marginBottom: '10px',
            }}
          >
            Details:
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {details.map((detail, index) => (
              <li
                key={index}
                style={{
                  color: '#333333',
                  fontSize: '14px',
                  marginBottom: '5px',
                }}
              >
                <strong>{detail.label}:</strong> {detail.value}
              </li>
            ))}
          </ul>
        </div>
      )}

      {footer && (
        <p
          style={{
            color: '#666666',
            fontSize: '12px',
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: '30px',
            borderTop: '1px solid #eeeeee',
            paddingTop: '15px',
          }}
        >
          {footer}
        </p>
      )}
    </div>
  );
}
