'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Webhook, CheckCircle, XCircle } from 'lucide-react';

export default function WebhookDebugPage() {
  const [paymentIntentId, setPaymentIntentId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleCheckPayment = async () => {
    if (!paymentIntentId.trim()) {
      setResult('❌ Please enter a Payment Intent ID');
      return;
    }

    setIsChecking(true);
    setResult('');

    try {
      // Call our webhook handler directly to test
      const response = await fetch('/api/test-webhook-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentIntentId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(
          `✅ Payment Status Check Results:\n${JSON.stringify(data, null, 2)}`
        );
      } else {
        setResult(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Network Error: ${errorMsg}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsChecking(true);
    setResult('');

    try {
      const response = await fetch('/api/test-webhook-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_webhook' }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Webhook Test Results:\n${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Network Error: ${errorMsg}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Webhook className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Webhook Debug Tool</h1>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Debug Tool:</strong> Use this to test webhook processing and
          check payment status updates. This helps diagnose why payments might
          be stuck in &quot;pending&quot; status.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Check Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Check Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="paymentIntentId">Payment Intent ID</Label>
              <Input
                id="paymentIntentId"
                value={paymentIntentId}
                onChange={(e) => setPaymentIntentId(e.target.value)}
                placeholder="pi_1234567890abcdef"
              />
            </div>

            <Button
              onClick={handleCheckPayment}
              disabled={isChecking}
              className="w-full"
            >
              {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Payment Status
            </Button>
          </CardContent>
        </Card>

        {/* Test Webhook Processing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Test Webhook Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Test the webhook processing system to ensure it&apos;s working
              correctly.
            </p>

            <Button
              onClick={handleTestWebhook}
              disabled={isChecking}
              variant="outline"
              className="w-full"
            >
              {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Webhook System
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-x-auto">
              {result}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Debug Webhook Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Get Payment Intent ID</h4>
            <p className="text-sm text-muted-foreground">
              After making a test payment, copy the Payment Intent ID from your
              browser network tab or Stripe dashboard.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Check Payment Status</h4>
            <p className="text-sm text-muted-foreground">
              Use the tool above to check if the payment was processed correctly
              in your database.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Verify Webhook Delivery</h4>
            <p className="text-sm text-muted-foreground">
              Go to Stripe Dashboard → Developers → Webhooks → [Your Endpoint] →
              Recent deliveries to see if webhooks are being sent and received.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">4. Test with Stripe CLI</h4>
            <p className="text-sm text-muted-foreground">
              Run:{' '}
              <code>
                stripe listen --forward-to localhost:3000/api/webhooks/stripe
              </code>
              to test webhooks locally.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
