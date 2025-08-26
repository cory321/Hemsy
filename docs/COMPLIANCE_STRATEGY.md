# Threadfolio Compliance Strategy

## Current Model: Destination Charges

### What This Means

- Threadfolio is the **Merchant of Record**
- Platform bears primary compliance responsibilities
- All payments flow through platform account first

### Compliance Requirements

#### 1. PCI Compliance ✅

- **Handled by Stripe**: Using Stripe Elements and not touching raw card data
- **Action Required**: Annual PCI compliance attestation (SAQ-A)
- **Status**: COMPLIANT - No card data touches our servers

#### 2. Tax Compliance ⚠️

- **Sales Tax**: Platform is responsible for collection and remittance
- **Recommended Solution**:
  - Integrate Stripe Tax for automatic calculation
  - OR partner with Avalara/TaxJar for comprehensive coverage
  - Consider setting up as marketplace facilitator where applicable

#### 3. Business Licensing 📋

- **Required**: Business license in operating jurisdiction
- **May Need**:
  - Money Transmitter License (state by state)
  - Marketplace Facilitator registration
- **Action**: Consult with legal counsel for specific requirements

#### 4. Financial Regulations

- **KYC/AML**: Handled by Stripe for connected accounts
- **Record Keeping**: Maintain transaction records for 7 years
- **Reporting**: 1099-K forms handled by Stripe

### Risk Mitigation Strategies

1. **Terms of Service**
   - Clearly state Threadfolio as payment processor
   - Define relationship with seamstresses
   - Include dispute and refund policies

2. **Insurance**
   - General liability insurance
   - Errors & Omissions (E&O) insurance
   - Cyber liability insurance

3. **Operational**
   - Implement fraud detection rules in Stripe Radar
   - Set up automated dispute handling workflows
   - Maintain platform fee to cover operational costs

### Alternative Model Consideration

If compliance burden becomes too high, consider **Direct Charges with Standard Accounts**:

**Pros:**

- Shifts merchant of record to seamstresses
- Reduces platform compliance burden
- Each seamstress handles own taxes

**Cons:**

- Complex onboarding (seamstresses need full Stripe accounts)
- Less control over user experience
- Potential for higher seamstress churn
- May not work well for hobby seamstresses

### Recommended Next Steps

1. **Immediate (Before Launch)**
   - [ ] Complete PCI compliance attestation
   - [ ] Update Terms of Service with proper disclosures
   - [ ] Set up basic fraud rules in Stripe Radar

2. **Short Term (First 3 months)**
   - [ ] Implement Stripe Tax or similar
   - [ ] Obtain necessary business licenses
   - [ ] Set up proper accounting/bookkeeping

3. **Long Term (6-12 months)**
   - [ ] Evaluate need for money transmitter licenses
   - [ ] Consider marketplace facilitator registration
   - [ ] Review insurance coverage

### Platform Fee Strategy

To cover compliance costs, consider:

- 2.9% + $0.30 payment processing (pass through)
- 1-3% platform fee for compliance and operations
- Total: ~4-6% of transaction value

### Legal Disclaimer

⚠️ **This document is for planning purposes only. Consult with qualified legal and tax professionals for specific compliance requirements in your jurisdiction.**
