# Sales Tax Strategy Proposal for Hemsy

**Prepared By:** AI SaaS Architect  
**Date:** September 30, 2025  
**Status:** Research & Proposal

---

## 📋 **Executive Summary**

Hemsy serves tailors across the United States using **Stripe Connect Direct Charges** where each seamstress operates as an independent merchant. This creates a **decentralized tax liability model** where each seamstress is responsible for their own sales tax compliance.

**Current Implementation:** Fixed `tax_percent` per shop (simple but risky)  
**Recommended Approach:** Hybrid model with path to Stripe Tax automation

---

## 🔍 **Current State Analysis**

### **Your Current Implementation**

```typescript
// shops table has: tax_percent (e.g., 7.5 for 7.5%)
const taxAmount = Math.round(afterDiscount * taxPercent);
```

### **Problems with Current Approach**

❌ **Inaccurate:** Single rate doesn't account for:

- Different cities/counties in same state
- Product-specific exemptions
- Destination-based vs origin-based rules
- Rate changes over time

❌ **Compliance Risk:**

- Each seamstress responsible for correct rates
- No threshold monitoring
- No filing assistance
- Audit risk if incorrect

❌ **Manual Burden:**

- Seamstresses must update rates manually
- No automatic compliance updates
- Complex multi-jurisdiction rules

---

## 🎯 **Tax Liability Model for Hemsy**

### **Who Pays Taxes?**

Based on Stripe Connect Direct Charges:

```
Customer (Client)
    ↓ Pays total + tax
Connected Account (Seamstress) ← Merchant of Record
    ↓ Collects tax
    ↓ Files & remits to state
Tax Authority (State/Local)
```

**Key Finding from Stripe Docs:**

> "For Direct Charges with Standard accounts, connected accounts handle their own tax compliance."

### **NOT a Marketplace Facilitator**

Hemsy is a **Software Platform**, not a marketplace facilitator because:

- ✅ Seamstresses control their own pricing
- ✅ Direct charges (not platform facilitated)
- ✅ Each seamstress has their own Stripe account
- ✅ Platform doesn't hold/transfer funds

**Result:** Each seamstress is individually responsible for sales tax.

---

## 💡 **Recommended Solutions**

### **Option 1: Enhanced Manual System** ⭐ MVP Recommended

**What:** Improve current system with better tooling

**Implementation:**

1. **Address Collection** - Require customer address (already have `mailing_address`)
2. **State-Based Rates** - Store rates per shop + state lookup
3. **Rate Management UI** - Easy tax rate updates in settings
4. **Educational Resources** - Link to state tax resources

**Pros:**

- ✅ $0 additional cost
- ✅ Simple to implement
- ✅ Seamstress maintains full control
- ✅ Works for MVP

**Cons:**

- ❌ Manual rate updates required
- ❌ No automatic compliance
- ❌ Risk of incorrect rates
- ❌ No multi-jurisdiction support

**Cost:** $0  
**Implementation Time:** 1-2 days

---

### **Option 2: Stripe Tax for Connected Accounts** ⭐ Post-MVP Recommended

**What:** Enable automatic tax calculation per seamstress

**How It Works:**

```typescript
// Each connected account configures Stripe Tax
// Platform provides UI via Connect Embedded Components

// When creating PaymentIntent:
const paymentIntent = await stripe.paymentIntents.create(
	{
		amount: totalCents,
		currency: 'usd',
		automatic_tax: { enabled: true }, // ← Stripe calculates automatically
		customer: customerWithAddress,
	},
	{
		stripeAccount: connectedAccountId,
	}
);
```

**Setup Required:**

**Per Connected Account (Seamstress):**

1. **Head Office Address** - Business location (origin for tax)
2. **Tax Registrations** - States where registered to collect
3. **Product Tax Code** - "Apparel alterations and repairs" (txcd_99999999)

**Platform Provides:**

- Connect Embedded Component for tax settings
- UI for managing registrations
- Guidance on registration requirements

**Pros:**

- ✅ **Automatic calculation** - Correct rates always
- ✅ **Multi-jurisdiction** - Handles complex scenarios
- ✅ **Threshold monitoring** - Alerts when to register
- ✅ **Filing integration** - Partners with Taxually
- ✅ **Rate updates** - Automatic when laws change
- ✅ **Audit trail** - Complete tax reports

**Cons:**

- ⚠️ **Cost:** $0.025 per transaction (2.5¢ per invoice)
- ⚠️ **Setup complexity** - Each seamstress must configure
- ⚠️ **Address required** - Customer zip code mandatory

**Cost Breakdown:**

```
$50,000 annual volume = 500 invoices/year (avg $100)
500 × $0.025 = $12.50/year per seamstress

For 100 seamstresses: $1,250/year total platform
```

**Implementation Time:** 3-5 days

---

### **Option 3: Third-Party Integration** (Advanced)

**Available Integrations:**

- **Avalara** - Enterprise-grade
- **Anrok** - Modern API-first
- **Sphere** - SMB-focused

**Use Case:** Large-scale operations (500+ merchants)

**Cost:** Typically more expensive than Stripe Tax

---

## 📊 **Detailed Comparison**

| Feature          | Current (Manual) | Enhanced Manual | Stripe Tax        | Third-Party  |
| ---------------- | ---------------- | --------------- | ----------------- | ------------ |
| **Accuracy**     | ❌ Low           | ⚠️ Medium       | ✅ High           | ✅ High      |
| **Cost/year**    | $0               | $0              | ~$12.50           | ~$50+        |
| **Setup Time**   | 0                | 1-2 days        | 3-5 days          | 1-2 weeks    |
| **Compliance**   | ❌ Manual        | ❌ Manual       | ✅ Automated      | ✅ Automated |
| **Multi-state**  | ❌ No            | ⚠️ Limited      | ✅ Yes            | ✅ Yes       |
| **Filing Help**  | ❌ No            | ❌ No           | ✅ Yes (Taxually) | ✅ Yes       |
| **Rate Updates** | ❌ Manual        | ❌ Manual       | ✅ Automatic      | ✅ Automatic |

---

## 🚀 **Recommended Implementation Roadmap**

### **Phase 1: MVP (Current State + Improvements)**

**Keep current system, add:**

1. ✅ Require customer address collection
2. ✅ Add tax rate management UI in settings
3. ✅ Display tax disclaimer: "Tax calculated at shop's default rate"
4. ✅ Link to state tax resources

**Why:** Get to market faster, defer complexity

### **Phase 2: Post-MVP (Stripe Tax Integration)**

**When to implement:**

- 10+ active seamstresses using the platform
- User feedback requests better tax handling
- Compliance concerns arise

**Implementation Steps:**

#### **1. Database Updates**

```sql
-- Add Stripe Tax tracking fields
ALTER TABLE shops
  ADD COLUMN stripe_tax_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN tax_registrations JSONB DEFAULT '[]';

ALTER TABLE invoices
  ADD COLUMN automatic_tax_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN tax_calculation_id TEXT,
  ADD COLUMN tax_breakdown JSONB;
```

#### **2. Connect Embedded Components**

```typescript
// In settings page, add tax configuration UI
<ConnectEmbeddedComponent
  type="tax-settings"
  accountId={connectedAccountId}
  features={['tax_settings', 'tax_registrations']}
/>
```

#### **3. PaymentIntent Integration**

```typescript
// Update createPaymentIntent to support automatic tax
const paymentIntent = await stripe.paymentIntents.create(
	{
		amount: amountCents,
		currency: 'usd',
		automatic_tax: {
			enabled: shopSettings.stripe_tax_enabled,
		},
		customer: stripeCustomerId, // Must have address!
	},
	{
		stripeAccount: connectedAccountId,
	}
);
```

#### **4. Customer Address Enforcement**

```typescript
// Require full address when Stripe Tax enabled
if (shopSettings.stripe_tax_enabled && !customer.address.postal_code) {
	throw new Error('Customer zip code required for tax calculation');
}
```

---

## 💰 **Pricing Analysis**

### **Stripe Tax Pricing**

**Pricing Tiers:**

1. **Pay-as-you-go:** $0.025/transaction (2.5¢)
2. **Tax Starter:** $200/month + volume discounts
3. **Tax Complete:** $500/month + filing services

**For Small Seamstress (Example):**

```
Annual Revenue: $50,000
Average Invoice: $100
Invoices/year: 500

Cost: 500 × $0.025 = $12.50/year
ROI: Peace of mind + compliance = priceless!
```

**For Hemsy Platform:**

```
Stripe Tax fees are charged to connected accounts, NOT platform
Platform cost: $0 (seamstresses pay)

OR

Platform can absorb fees:
100 seamstresses × $12.50 = $1,250/year
Add to platform costs, increase subscription fee
```

---

## 🎯 **MVP Recommendation: Hybrid Approach**

### **Phase 1: Launch with Enhanced Manual** (Now)

**Keep it simple for MVP:**

1. **Improve Tax Rate Setting**

   ```typescript
   // Settings page
   <TextField
     label="Sales Tax Rate"
     value={taxPercent}
     helperText="Contact your local tax authority for accurate rates"
   />
   ```

2. **Add Tax Disclaimer**

   ```
   "Tax calculated at shop's configured rate. Seamstresses are
   responsible for accurate tax collection and filing."
   ```

3. **Collect Customer Address**

   ```typescript
   // Already have mailing_address field!
   // Just enforce it more strictly
   ```

4. **Link to Resources**
   - State-by-state tax guides
   - Registration links
   - Rate lookup tools

### **Phase 2: Offer Stripe Tax as Premium Feature** (Post-MVP)

**Positioning:**

- Basic Plan: Manual tax (current system)
- Pro Plan: Stripe Tax automation (+$10/month)

**Value Proposition:**

- "Never worry about tax rates again"
- "Automatic compliance across all states"
- "Filing assistance included"

---

## 📝 **Technical Implementation Plan (Phase 2)**

### **1. Database Schema**

```sql
-- Migration: Add Stripe Tax support
ALTER TABLE shops
  ADD COLUMN stripe_tax_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN stripe_tax_head_office JSONB,
  ADD COLUMN stripe_tax_preset_code TEXT DEFAULT 'txcd_99999999';

ALTER TABLE clients
  ADD COLUMN stripe_customer_id TEXT UNIQUE,
  ADD COLUMN tax_exempt BOOLEAN DEFAULT FALSE;

ALTER TABLE invoices
  ADD COLUMN automatic_tax_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN tax_calculation JSONB;
```

### **2. Service Tax Codes**

Stripe Tax Code for alterations: **`txcd_99999999`** (General services)

Or more specific codes if available:

- Apparel alterations
- Textile repairs
- Custom tailoring

### **3. API Integration**

```typescript
// Create Stripe Customer with address
const customer = await stripe.customers.create(
	{
		name: `${client.first_name} ${client.last_name}`,
		email: client.email,
		phone: client.phone_number,
		address: {
			line1: client.mailing_address?.line1,
			city: client.mailing_address?.city,
			state: client.mailing_address?.state,
			postal_code: client.mailing_address?.postal_code,
			country: 'US',
		},
		tax: {
			validate_location: 'immediately',
		},
	},
	{
		stripeAccount: connectedAccountId,
	}
);

// Create PaymentIntent with automatic tax
const paymentIntent = await stripe.paymentIntents.create(
	{
		amount: subtotalCents, // Tax calculated separately
		currency: 'usd',
		customer: customer.id,
		automatic_tax: { enabled: true },
		metadata: {
			invoice_id: invoiceId,
		},
	},
	{
		stripeAccount: connectedAccountId,
	}
);

// Tax is automatically calculated and added
// Access via: paymentIntent.automatic_tax
```

### **4. UI Components**

**Settings Page: Tax Configuration**

```tsx
<Card>
	<CardHeader title="Tax Settings" />
	<CardContent>
		<FormControlLabel
			control={
				<Switch checked={stripeTaxEnabled} onChange={handleStripeTaxToggle} />
			}
			label="Use Stripe Tax (Automatic Calculation)"
		/>

		{!stripeTaxEnabled && (
			<TextField
				label="Default Tax Rate (%)"
				value={taxPercent}
				helperText="Manual tax rate - you're responsible for accuracy"
			/>
		)}

		{stripeTaxEnabled && (
			<Alert severity="info">
				Tax will be calculated automatically based on customer location.
				Configure your tax registrations below.
			</Alert>
		)}
	</CardContent>
</Card>;

{
	/* Stripe Tax Embedded Component */
}
{
	stripeTaxEnabled && <ConnectTaxSettings accountId={connectedAccountId} />;
}
```

---

## ⚠️ **Important Considerations**

### **1. Tax Liability**

Each seamstress (connected account) is **individually liable** for:

- Determining nexus (where they need to register)
- Registering with states
- Collecting correct tax
- Filing returns
- Remitting collected tax

**Platform responsibility:** Provide tools, NOT tax advice

### **2. Service Taxability**

**Varies by State!**

- **Texas:** Alterations are taxable
- **Pennsylvania:** Alterations exempt
- **California:** Depends on fabric cost vs labor
- **New York:** Generally taxable

**Stripe Tax handles this automatically** based on:

- Product tax code
- Customer location
- Registered jurisdictions

### **3. Nexus Rules**

**When to register:**

- Physical presence (shop location)
- Economic nexus (sales volume thresholds)
  - Example: California = $500,000/year
  - Example: Texas = $500,000/year

**Stripe Tax monitors this:**

- Tracks sales by jurisdiction
- Alerts when approaching thresholds
- Suggests where to register

---

## 💵 **Cost-Benefit Analysis**

### **Scenario: Medium-sized Tailor Shop**

**Annual Stats:**

- Revenue: $75,000
- Average order: $125
- Orders/year: 600
- States with nexus: 2 (home state + neighboring)

**Current System (Manual):**

```
Cost: $0
Risk: Audit could cost $5,000-$50,000 if incorrect
Time: 10 hours/year managing rates & filing
```

**Stripe Tax:**

```
Cost: 600 orders × $0.025 = $15/year
Risk: Minimal (Stripe handles calculations)
Time: 2 hours/year (initial setup only)

Net Benefit: ~$500-$5,000 in risk reduction
```

---

## 📋 **Implementation Proposal**

### **Phase 1: MVP (Launch Now)**

**Keep Current System Enhanced:**

```typescript
// ✅ Already have:
- tax_percent per shop
- Customer mailing_address
- Tax calculation in order flow

// ➕ Add minimal improvements:
1. Better UI for tax rate setting
2. Tax disclaimer on invoices
3. Address validation
4. Educational links
```

**Effort:** 4-8 hours  
**Cost:** $0  
**Risk:** Acceptable for MVP with proper disclaimers

---

### **Phase 2: Stripe Tax Integration** (Month 3-6)

**Gradual Rollout:**

#### **Month 1-2: Foundation**

1. Add Stripe Customer creation for all clients
2. Store `stripe_customer_id` in database
3. Enforce address collection
4. Add tax_enabled toggle to shop settings

#### **Month 3-4: Integration**

5. Integrate Stripe Tax API
6. Add Connect Embedded Tax components
7. Create migration path from manual → automatic
8. Beta test with 5-10 seamstresses

#### **Month 5-6: Rollout**

9. Document setup process
10. Offer as premium feature
11. Migrate willing users
12. Monitor and optimize

**Effort:** 2-3 weeks development  
**Cost:** Per-transaction fees (seamstress pays)

---

### **Phase 3: Advanced Features** (Year 2)

- Tax filing automation via Taxually integration
- Multi-state registration assistance
- Tax exemption certificate management
- Resale certificate handling
- Tax reporting dashboard

---

## 🔧 **Code Changes Required (Phase 2)**

### **1. Database Migration**

```sql
-- Add Stripe Tax fields
ALTER TABLE shops
  ADD COLUMN stripe_tax_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN stripe_tax_head_office JSONB,
  ADD COLUMN tax_registrations JSONB DEFAULT '[]';

ALTER TABLE clients
  ADD COLUMN stripe_customer_id TEXT UNIQUE,
  ADD COLUMN tax_exempt BOOLEAN DEFAULT FALSE,
  ADD COLUMN tax_exempt_certificate TEXT;

ALTER TABLE invoices
  ADD COLUMN automatic_tax_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN stripe_tax_calculation_id TEXT,
  ADD COLUMN tax_breakdown JSONB;
```

### **2. Create Stripe Customer**

```typescript
// lib/actions/stripe-customers.ts
export async function createOrUpdateStripeCustomer(
	clientId: string,
	connectedAccountId: string
) {
	const client = await getClient(clientId);

	const customer = await stripe.customers.create(
		{
			name: `${client.first_name} ${client.last_name}`,
			email: client.email,
			phone: client.phone_number,
			address: parseMailingAddress(client.mailing_address),
			tax: { validate_location: 'immediately' },
			metadata: { hemsy_client_id: clientId },
		},
		{
			stripeAccount: connectedAccountId,
		}
	);

	// Save stripe_customer_id to database
	await supabase
		.from('clients')
		.update({ stripe_customer_id: customer.id })
		.eq('id', clientId);

	return customer;
}
```

### **3. Update PaymentIntent Creation**

```typescript
// Modify: lib/actions/payments.ts

// Check if Stripe Tax is enabled
const { data: shopSettings } = await supabase
	.from('shop_settings')
	.select('stripe_tax_enabled, stripe_connect_account_id')
	.eq('shop_id', shop.id)
	.single();

// Get or create Stripe Customer
let stripeCustomer;
if (shopSettings.stripe_tax_enabled) {
	stripeCustomer = await ensureStripeCustomer(
		invoice.client_id,
		shopSettings.stripe_connect_account_id
	);
}

const paymentIntentConfig: Stripe.PaymentIntentCreateParams = {
	amount: amountCents,
	currency: 'usd',
	...(shopSettings.stripe_tax_enabled && {
		automatic_tax: { enabled: true },
		customer: stripeCustomer.id,
	}),
	// ... rest of config
};
```

### **4. Settings UI Enhancement**

```tsx
// app/(app)/settings/tax/page.tsx

<Box>
	<Typography variant="h6">Tax Collection</Typography>

	<FormControl fullWidth>
		<FormLabel>Tax Calculation Method</FormLabel>
		<RadioGroup value={taxMethod}>
			<FormControlLabel
				value="manual"
				label="Manual Rate (Current)"
				control={<Radio />}
			/>
			<FormControlLabel
				value="stripe_tax"
				label="Stripe Tax (Automatic)"
				control={<Radio />}
			/>
		</RadioGroup>
	</FormControl>

	{taxMethod === 'manual' && (
		<TextField
			label="Tax Rate (%)"
			value={taxPercent}
			helperText="You're responsible for maintaining accurate rates"
		/>
	)}

	{taxMethod === 'stripe_tax' && (
		<>
			<Alert severity="warning">
				Stripe Tax costs $0.025 per transaction. Automatic calculation ensures
				compliance.
			</Alert>

			<ConnectTaxSettings accountId={connectAccountId} />
		</>
	)}
</Box>
```

---

## 🎯 **My Recommendation as a SaaS Architect**

### **For MVP Launch:**

**✅ Use Enhanced Manual System**

**Rationale:**

1. **Speed to Market** - Don't let tax complexity delay launch
2. **User Validation** - Prove product-market fit first
3. **Simple UX** - Easy for seamstresses to understand
4. **Low Risk** - With proper disclaimers and education
5. **$0 Cost** - Maximize runway

**Implementation:**

```
1. Keep current tax_percent system ✅
2. Add better UI for rate management (4 hours)
3. Add tax disclaimer to invoices (1 hour)
4. Link to state tax resources (1 hour)
5. Enforce address collection (2 hours)

Total: 8 hours work
```

### **For Post-MVP (Month 3-6):**

**✅ Migrate to Stripe Tax**

**Offer as tiered feature:**

- **Basic Plan:** Manual tax (free, current system)
- **Pro Plan:** Stripe Tax automation ($10/month or absorb fees)

**Benefits:**

- Differentiator from competitors
- Reduces seamstress burden
- Demonstrates platform sophistication
- Unlocks enterprise customers

**Migration path:**

- Seamstresses opt-in (not forced)
- Provide setup guidance
- Show cost/benefit clearly
- Help with initial registrations

---

## 📚 **Resources for Seamstresses**

**Provide links in app:**

1. [Sales Tax Institute State Guides](https://www.salestaxinstitute.com/)
2. [Avalara State Tax Guides](https://www.avalara.com/taxrates/en/state-rates.html)
3. [Stripe's Tax Guide](https://stripe.com/guides/tax-guides)
4. State-specific registration portals

---

## ⚠️ **Legal Disclaimers Required**

**Add to Terms of Service:**

```
"Tax Compliance: Merchants using Hemsy are solely responsible for
determining, collecting, reporting, and remitting all applicable
taxes. Hemsy provides tools to assist with tax calculation but
does not provide tax advice. Consult a tax professional for
compliance guidance."
```

**Add to Invoices:**

```
"Tax calculated at merchant's configured rate.
Merchant is responsible for tax compliance."
```

---

## 🎬 **Decision Framework**

### **Choose Manual If:**

- ✅ MVP / Early stage
- ✅ Limited budget
- ✅ Most seamstresses in one state
- ✅ Low transaction volume
- ✅ Technical seamstresses

### **Choose Stripe Tax If:**

- ✅ Post-MVP / Growth stage
- ✅ Multi-state operations
- ✅ High transaction volume
- ✅ Compliance concerns
- ✅ Less technical users
- ✅ Want to offer premium service

---

## 📊 **Implementation Checklist**

### **MVP (Phase 1) - 8 hours**

- [ ] Improve tax rate UI in settings
- [ ] Add tax disclaimer to invoices
- [ ] Enforce customer address collection
- [ ] Add educational links
- [ ] Update Terms of Service

### **Post-MVP (Phase 2) - 2-3 weeks**

- [ ] Database schema updates
- [ ] Stripe Customer creation
- [ ] PaymentIntent automatic_tax integration
- [ ] Connect Embedded Components
- [ ] Migration UI for existing users
- [ ] Documentation & training
- [ ] Beta testing
- [ ] Full rollout

---

## 🏆 **Final Recommendation**

**For Hemsy's current stage (MVP):**

### **Action Plan:**

1. **Keep current system** - It works!
2. **Add improvements** (8 hours of work):
   - Better tax rate management UI
   - Tax compliance disclaimer
   - Educational resources
   - Address validation
3. **Plan for Stripe Tax** - Research complete, ready when needed
4. **Set trigger point** - "When 10+ active merchants request it"

**Why This Works:**

- ✅ Fastest path to launch
- ✅ Legally defensible with disclaimers
- ✅ Upgrade path exists
- ✅ Competitive for MVP
- ✅ Can iterate based on feedback

### **Long-term Vision:**

Stripe Tax becomes a **premium differentiator** that positions Hemsy as the professional choice for serious tailoring businesses.

---

**Questions for consideration:**

1. What's your target market - local single-state shops or multi-state operations?
2. Are your users tech-savvy enough to manage manual tax rates?
3. What's your pricing model - can you absorb Stripe Tax fees or pass through?
4. Timeline to launch - is 8 hours acceptable or need to ship faster?
