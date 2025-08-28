'use client';

import { useState } from 'react';
import {
  createTestMerchant,
  updateConnectAccountWithTestData,
  getCurrentShopConnectInfo,
  diagnoseConnectAccount,
  clearConnectAccount,
} from '@/lib/actions/stripe-connect';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TestTube, CreditCard, Building2 } from 'lucide-react';

export default function TestStripeConnectPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [email, setEmail] = useState('test-seamstress@example.com');
  const [businessName, setBusinessName] = useState('Test Seamstress Shop');
  const [businessType, setBusinessType] = useState<'individual' | 'company'>(
    'individual'
  );
  const [country, setCountry] = useState('US');
  const [result, setResult] = useState<string>('');
  const { toast } = useToast();

  const handleCreateTestMerchant = async () => {
    setIsCreating(true);
    setResult('');

    try {
      const result = await createTestMerchant({
        email,
        businessName,
        country,
        businessType,
      });

      if (result.success) {
        setResult(
          `✅ Test merchant created successfully!\nAccount ID: ${result.accountId}`
        );
        toast({
          title: 'Success!',
          description: 'Test merchant created and activated',
        });
      } else {
        setResult(`❌ Failed to create test merchant: ${result.error}`);
        toast({
          title: 'Error',
          description: result.error || 'Failed to create test merchant',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMsg}`);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivateExisting = async () => {
    setIsActivating(true);
    setResult('');

    try {
      const result = await updateConnectAccountWithTestData();

      if (result.success) {
        setResult('✅ Existing Connect account activated with test data!');
        toast({
          title: 'Success!',
          description: 'Connect account activated for testing',
        });
      } else {
        setResult(`❌ Failed to activate account: ${result.error}`);
        toast({
          title: 'Error',
          description: result.error || 'Failed to activate account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMsg}`);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const info = await getCurrentShopConnectInfo();
      if (info.success && info.connectInfo) {
        const { connectInfo } = info;
        setResult(`
📊 Current Connect Account Status:
• Account ID: ${connectInfo.accountId || 'None'}
• Status: ${connectInfo.status}
• Charges Enabled: ${connectInfo.chargesEnabled ? '✅' : '❌'}
• Payouts Enabled: ${connectInfo.payoutsEnabled ? '✅' : '❌'}
• Requirements: ${JSON.stringify(connectInfo.requirements, null, 2)}
        `);
      } else {
        setResult(`❌ Failed to get status: ${info.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMsg}`);
    }
  };

  const handleDiagnose = async () => {
    try {
      const diagnosis = await diagnoseConnectAccount();
      if (diagnosis.success && diagnosis.diagnosis) {
        const { diagnosis: d } = diagnosis;
        setResult(`
🔍 Connect Account Diagnosis:
• Has Account: ${d.hasAccount ? '✅' : '❌'}
• Account ID: ${d.accountId || 'None'}
• Account Type: ${d.accountType || 'Unknown'}
• Status: ${d.accountStatus}
• Access Error: ${d.accessError ? '❌' : '✅'}

📋 Recommendations:
${d.recommendations.map((rec) => `• ${rec}`).join('\n')}
				`);
      } else {
        setResult(`❌ Failed to diagnose: ${diagnosis.error}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMsg}`);
    }
  };

  const handleClearAccount = async () => {
    setIsClearing(true);
    setResult('');

    try {
      const result = await clearConnectAccount();

      if (result.success) {
        setResult(
          '✅ Connect account cleared from settings! You can now create a new test merchant.'
        );
        toast({
          title: 'Success!',
          description: 'Connect account cleared from settings',
        });
      } else {
        setResult(`❌ Failed to clear account: ${result.error}`);
        toast({
          title: 'Error',
          description: result.error || 'Failed to clear account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setResult(`❌ Error: ${errorMsg}`);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <TestTube className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Stripe Connect Testing</h1>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Development Mode Only:</strong> This page creates{' '}
          <strong>Custom Connect accounts</strong> with test data pre-populated
          for immediate testing. These are different from the Standard accounts
          used in production, but allow full testing of payment flows without
          verification requirements.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertDescription>
          <strong>⚠️ Standard Account Issue Detected:</strong> Your current
          Connect account (acct_1Rz3h0JgSoa6DjVF) is a Standard account with
          unfulfilled requirements. Standard accounts cannot be bypassed with
          test data. Use &quot;🔍 Diagnose Issues&quot; to see recommendations,
          then &quot;🗑️ Clear Account&quot; to remove it and create a new Custom
          account for testing.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create New Test Merchant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Create Test Merchant
            </CardTitle>
            <CardDescription>
              Create a new Custom Connect account with test data pre-populated
              (bypasses verification)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test-seamstress@example.com"
              />
            </div>

            <div>
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Test Seamstress Shop"
              />
            </div>

            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={businessType}
                onValueChange={(value) =>
                  setBusinessType(value as 'individual' | 'company')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateTestMerchant}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Test Merchant
            </Button>
          </CardContent>
        </Card>

        {/* Manage Existing Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Manage Existing Account
            </CardTitle>
            <CardDescription>
              For existing Standard accounts - limited test data can be applied
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleActivateExisting}
              disabled={isActivating}
              variant="outline"
              className="w-full"
            >
              {isActivating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Activate Existing Account
            </Button>

            <Button
              onClick={handleCheckStatus}
              variant="outline"
              className="w-full"
            >
              Check Account Status
            </Button>

            <Button
              onClick={handleDiagnose}
              variant="outline"
              className="w-full"
            >
              🔍 Diagnose Issues
            </Button>

            <Button
              onClick={handleClearAccount}
              disabled={isClearing}
              variant="destructive"
              className="w-full"
            >
              {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              🗑️ Clear Account
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
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
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">
              1. Create Test Merchant (Custom Account)
            </h4>
            <p className="text-sm text-muted-foreground">
              Creates a <strong>Custom Connect account</strong> with test data
              pre-populated. This bypasses all verification requirements and
              enables charges immediately for testing. Different from production
              Standard accounts but allows full payment testing.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">2. Test Payments</h4>
            <p className="text-sm text-muted-foreground">
              Once your merchant is active, you can create invoices and test
              payments using test card numbers:
            </p>
            <ul className="text-sm text-muted-foreground ml-4 mt-1">
              <li>
                • <code>4242424242424242</code> - Visa (succeeds)
              </li>
              <li>
                • <code>4000000000000002</code> - Card declined
              </li>
              <li>
                • <code>4000000000009995</code> - Insufficient funds
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. View in Stripe Dashboard</h4>
            <p className="text-sm text-muted-foreground">
              Log into your Stripe Dashboard → Connect → Accounts to see all
              connected merchants and their transaction history.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
