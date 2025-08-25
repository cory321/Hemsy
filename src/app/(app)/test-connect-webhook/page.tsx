'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Webhook, CheckCircle, XCircle, Clock, Terminal } from 'lucide-react';

export default function TestConnectWebhookPage() {
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    setIsListening(true);
    // This would be handled by the webhook endpoint
    console.log('Webhook listener started');
  };

  const stopListening = () => {
    setIsListening(false);
    console.log('Webhook listener stopped');
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Webhook className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Connect Webhook Test</h1>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Testing Connect Webhooks:</strong> This page helps you verify
          that Connect webhook events are being received and processed
          correctly.
        </AlertDescription>
      </Alert>

      {/* Webhook Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">
              1. Set up Connect Webhook in Stripe Dashboard
            </h4>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p>
                <strong>URL:</strong>{' '}
                <code>http://localhost:3000/api/webhooks/stripe/connect</code>
              </p>
              <p>
                <strong>Events:</strong> payment_intent.succeeded,
                payment_intent.payment_failed, charge.refunded, refund.created
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Test with Stripe CLI</h4>
            <div className="bg-muted p-3 rounded-md text-sm font-mono">
              <p># Listen for Connect events</p>
              <p>
                stripe listen --forward-connect-to
                localhost:3000/api/webhooks/stripe/connect
              </p>
              <br />
              <p>
                # Trigger test Connect payment (replace with your account ID)
              </p>
              <p>
                stripe trigger payment_intent.succeeded --stripe-account
                acct_your_test_account_id
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Add Environment Variable</h4>
            <div className="bg-muted p-3 rounded-md text-sm font-mono">
              <p>
                STRIPE_CONNECT_WEBHOOK_SECRET=whsec_your_connect_webhook_secret
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Webhook Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <span>Platform Webhook</span>
              <Badge variant="outline">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <span>Connect Webhook</span>
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                Setup Required
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
        </CardHeader>
        <CardContent>
          {webhookEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhook events received yet</p>
              <p className="text-sm">
                Make a test payment to see events appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhookEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <span className="font-medium">{event.type}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {event.id}
                    </span>
                  </div>
                  <Badge variant={event.processed ? 'default' : 'destructive'}>
                    {event.processed ? 'Processed' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">
                Connect webhook endpoint configured in Stripe Dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">
                STRIPE_CONNECT_WEBHOOK_SECRET environment variable set
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Connect webhook handler updated to process payment events
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Webhook handler detects Connect payments
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
