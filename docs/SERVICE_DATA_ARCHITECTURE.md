# Service Data Architecture: Catalog vs Applied Services

## 📋 Overview

Our application has a **two-tier service architecture** that distinguishes between service templates and actual services applied to garments. This design provides flexibility while maintaining data integrity.

---

## 🏗️ Data Architecture

### **1. Service Catalog (`services` table)**

**Purpose**: Template/catalog of services that the shop offers
**Scope**: Shop-wide service definitions
**Usage**: Templates for creating garment services

**Schema**:

```sql
services:
├── id (UUID)
├── shop_id (UUID)
├── name (text) - "Hem Pants", "Tailor Jacket", etc.
├── description (text, nullable)
├── default_unit (text) - 'flat_rate', 'hour', 'day'
├── default_qty (integer) - Default quantity
├── default_unit_price_cents (integer) - Default price
├── frequently_used (boolean) - Quick access flag
├── frequently_used_position (integer, nullable)
├── created_at, updated_at
```

**Characteristics**:

- ✅ **No archiving mechanism** (services are rarely deleted)
- ✅ **Template-based** (defines what services shop offers)
- ✅ **Shop-wide scope** (available for all orders)
- ✅ **Static-ish data** (changes infrequently)

### **2. Applied Services (`garment_services` table)**

**Purpose**: Actual services applied to specific garments
**Scope**: Garment-specific service instances
**Usage**: Track work done, pricing, completion status

**Schema**:

```sql
garment_services:
├── id (UUID)
├── garment_id (UUID) - Links to specific garment
├── service_id (UUID, nullable) - Reference to catalog service
├── name (text) - Service name (can be custom)
├── description (text, nullable)
├── quantity (integer)
├── unit (text) - 'flat_rate', 'hour', 'day'
├── unit_price_cents (integer)
├── line_total_cents (computed) - quantity * unit_price_cents
├── is_done (boolean) - Completion status
├── is_removed (boolean) - Soft delete flag ⭐
├── removed_at, removed_by - Soft delete metadata
├── paid_amount_cents, refunded_amount_cents
├── payment_status (computed)
├── invoice_id (nullable)
├── created_at, updated_at
```

**Characteristics**:

- ✅ **Has soft delete** (`is_removed`, `removed_at`, `removed_by`)
- ✅ **Instance-based** (specific to individual garments)
- ✅ **Dynamic data** (changes as work progresses)
- ✅ **Payment tracking** (paid amounts, refunds)

---

## 🎯 Key Differences

| **Aspect**    | **Service Catalog (`services`)** | **Applied Services (`garment_services`)** |
| ------------- | -------------------------------- | ----------------------------------------- |
| **Purpose**   | Templates/catalog                | Actual work instances                     |
| **Scope**     | Shop-wide                        | Garment-specific                          |
| **Archiving** | ❌ No archiving                  | ✅ Soft delete (`is_removed`)             |
| **Pricing**   | Default pricing                  | Actual pricing for garment                |
| **Status**    | No completion tracking           | ✅ Completion status (`is_done`)          |
| **Payment**   | No payment data                  | ✅ Payment tracking                       |
| **Frequency** | Changes rarely                   | Changes frequently                        |

---

## 🔧 Caching Strategy Implications

### **Service Catalog Caching** (What we implemented)

```typescript
// ✅ CORRECT: Cache service catalog (templates)
export const getServices = cache(async (shopId: string) => {
  return supabase.from('services').select('*').eq('shop_id', shopId);
  // No .eq('is_archived', false) because services table doesn't have this column
});
```

**Why this works for caching**:

- Service catalog changes infrequently
- No user-specific data (shop-wide templates)
- Good candidate for persistent caching when service role available

### **Garment Services** (Different caching needs)

```typescript
// Applied services are dynamic and user-specific
export const getGarmentServices = cache(async (garmentId: string) => {
  return supabase
    .from('garment_services')
    .select('*')
    .eq('garment_id', garmentId)
    .eq('is_removed', false); // ✅ This table HAS soft delete
});
```

**Why this needs different caching**:

- Changes frequently (completion status, payments)
- User-specific data (requires auth context)
- Should use request-level caching only

---

## 📊 Usage Patterns

### **When to Use Service Catalog**

1. **Order Creation**: Show available services to add to garments
2. **Service Management**: Shop owner manages their service offerings
3. **Pricing Templates**: Default pricing for new garment services
4. **Quick Service Selection**: Frequently used services

### **When to Use Applied Services**

1. **Garment Detail Pages**: Show services applied to specific garment
2. **Progress Tracking**: Mark services as complete (`is_done`)
3. **Payment Processing**: Track payment status per service
4. **Service Removal**: Soft delete services from garments (`is_removed`)

---

## 🎯 Our Phase 3 Implementation Impact

### **✅ What We Fixed**

1. **Removed incorrect `is_archived` filter** from service catalog queries
2. **Clarified data architecture** with proper documentation
3. **Maintained caching benefits** for service catalog (templates)

### **✅ What We Achieved**

1. **Service catalog caching**: Templates cached at request level
2. **Proper data separation**: Catalog vs applied services clearly distinguished
3. **Performance optimization**: Static catalog data benefits from caching

### **🔄 Future Opportunities**

1. **Service role caching**: Catalog could use persistent caching (templates rarely change)
2. **Applied services optimization**: Different caching strategy for dynamic garment services
3. **Hybrid approach**: Cache catalog persistently, applied services per-request

---

## 🚀 Corrected Understanding

**The error occurred because**:

- We tried to filter `services` table by `is_archived` (doesn't exist)
- We confused service catalog with applied services
- Service catalog doesn't need archiving (just stop using unwanted templates)

**The fix was**:

- Remove `is_archived` filter from service catalog queries
- Keep archiving logic for `garment_services` where it belongs (`is_removed`)
- Maintain proper separation between catalog and applied services

**Result**: Dashboard should now load successfully with proper service catalog caching! ✅
