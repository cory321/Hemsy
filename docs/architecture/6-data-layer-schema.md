# 6. Data Layer & Schema

**Core Tables:**

- `users(id, clerk_user_id, email, role)`
- `shops(id, owner_user_id, trial_countdown_enabled, …)`
- `clients(...)` (see below)
- `orders(id, shop_id, client_id, status, total)`
- `garments(id, order_id, title, due_date, stage)`
- `services(id, shop_id, name, unit_price, unit)`
- `garment_services(garment_id, service_id, quantity)`
- `invoices(id, order_id, status, stripe_link, due_date)`
- `payments(id, invoice_id, method, amount, stripe_txn_id)`
- `appointments(id, shop_id, client_id, date, start_time, end_time, type)`

## 6.1 Clients Table

| Column          | Type            | Notes         |
| --------------- | --------------- | ------------- |
| id              | UUID PK         |               |
| shop_id         | UUID → shops.id |               |
| first_name      | TEXT            | NOT NULL      |
| last_name       | TEXT            | NOT NULL      |
| email           | TEXT            | NOT NULL      |
| phone_number    | TEXT            | NOT NULL      |
| accept_email    | BOOLEAN         | DEFAULT TRUE  |
| accept_sms      | BOOLEAN         | DEFAULT FALSE |
| notes           | TEXT            | Optional      |
| mailing_address | TEXT            | Optional      |
| created_at      | TIMESTAMP       | now()         |
| updated_at      | TIMESTAMP       | now()         |

---
