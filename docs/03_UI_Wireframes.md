# UI/UX Design & Wireframes

This document outlines the complete UI/UX strategy, wireframes, and screen planning for the **PricePilot AI – Dynamic Pricing Optimization & Revenue Intelligence System**.

---

## 1. Application Navigation

The application uses a standard enterprise sidebar navigation approach, keeping all modules accessible within one click from the main dashboard.

```text
Login
↓
Dashboard (Overview)
├── Product Management (View, Add, Edit Products)
├── Price Prediction (AI-driven optimal pricing)
├── Demand Forecasting (Sales volume predictions)
├── Competitor Analysis (Market price comparisons)
├── Revenue Optimization (Profit and revenue simulations)
├── Analytics Dashboard (Deep-dive reports)
└── User Management (Admin-only role assignment)
```

**Navigation Flow Explanation:**
Users enter the system via the `Login` page. Upon successful authentication, they land on the `Dashboard`, which aggregates high-level KPIs from all modules. The sidebar remains fixed on the left, providing direct access to specific operational modules (`Product Management`, `Price Prediction`, etc.). The `User Management` module is conditionally rendered only if the logged-in user has the 'Admin' role.

---

## 2. Complete List of Pages

### 1. Dashboard
- **Purpose**: A high-level operational overview of revenue, predictions, and system health.
- **Access**: Admin, Pricing Manager, Business Analyst
- **Components**: Sidebar, Topbar, KPI Cards, Summary Charts (Revenue, Demand, Trends), Recent Activity.
- **User Actions**: View stats, click quick links to specific modules.
- **API Interactions**: `GET /api/dashboard/kpis`, `GET /api/dashboard/charts`

### 2. Login & Authentication
- **Purpose**: Secure access to the platform.
- **Access**: Unauthenticated users.
- **Components**: Email/Password fields, Login Button, Forgot Password link.
- **User Actions**: Submit credentials.
- **API Interactions**: `POST /api/auth/login`

### 3. Product Management
- **Purpose**: Manage the core product catalog.
- **Access**: Admin, Pricing Manager
- **Components**: Data Table (Search, Filter, Sort), Add/Edit Modal.
- **User Actions**: Search products, update base costs, manage stock levels.
- **API Interactions**: `GET /api/products`, `POST /api/products`, `PUT /api/products/{id}`

### 4. Price Prediction
- **Purpose**: Generate AI recommendations for optimal product pricing.
- **Access**: Pricing Manager
- **Components**: Product Selector, Input Parameters (Date range, stock), Output display (Recommended Price, Confidence Score, AI Explanation).
- **User Actions**: Run prediction, apply recommended price.
- **API Interactions**: `POST /api/ml/predict-price`

### 5. Demand Forecasting
- **Purpose**: Predict future sales volumes.
- **Access**: Pricing Manager, Business Analyst
- **Components**: Date range filters, Line Chart (Forecast vs Historical), Data Table.
- **User Actions**: Select time horizons, export forecast data.
- **API Interactions**: `GET /api/ml/forecast-demand`

### 6. Competitor Analysis
- **Purpose**: Track market positioning.
- **Access**: Pricing Manager, Business Analyst
- **Components**: Competitor Table, Price Difference Delta, Market Position Gauge.
- **User Actions**: View competitor disparities, trigger price match evaluations.
- **API Interactions**: `GET /api/competitors/analysis`

### 7. Revenue Optimization
- **Purpose**: Simulate financial outcomes based on different pricing strategies.
- **Access**: Admin, Business Analyst
- **Components**: Simulation Sliders (Price/Demand elasticity), Profit Analysis Chart.
- **User Actions**: Adjust simulation sliders, view projected revenue changes.
- **API Interactions**: `POST /api/ml/simulate-revenue`

### 8. Analytics Dashboard
- **Purpose**: Deep dive reporting.
- **Access**: Admin, Business Analyst
- **Components**: Granular filters, complex multi-axis charts, Data Grid, Export Button.
- **User Actions**: Slice and dice data, download CSV/PDF reports.
- **API Interactions**: `GET /api/analytics/reports`

### 9. User Management
- **Purpose**: System administration.
- **Access**: Admin only
- **Components**: User List Table, Add/Edit User Modal, Role Dropdowns.
- **User Actions**: Create users, revoke access, assign roles.
- **API Interactions**: `GET /api/users`, `POST /api/users`

---

## 3. Dashboard Design

```text
+-------------------------------------------------------------------------+
| [Logo] PricePilot AI     [ Search Products... ]     [Notification] [JD] |
+---------------+---------------------------------------------------------+
| [Main Menu]   |  [ Total Revenue ]  [ Avg Margin ]  [ Pending AI Recs ] |
| ⌂ Dashboard   |  $1.2M (+4%)        32% (+1%)       14 Items            |
|               |---------------------------------------------------------|
| 📦 Products   |  +-----------------------+  +------------------------+  |
| 📈 Prediction |  | Revenue Trend         |  | Demand Forecast (30d)  |  |
| 📊 Forecast   |  | [ Area Chart ]        |  | [ Bar Chart ]          |  |
| 🎯 Competitor |  |                       |  |                        |  |
| 💰 Rev. Opt   |  +-----------------------+  +------------------------+  |
|               |---------------------------------------------------------|
| [Reports]     |  +-----------------------+  +------------------------+  |
| 📑 Analytics  |  | Price Trend vs Comp   |  | Recent AI Predictions  |  |
|               |  | [ Line Chart ]        |  | 1. iPhone 15: $940     |  |
| [Admin]       |  |                       |  | 2. AirPods:   $195     |  |
| ⚙️ Users      |  +-----------------------+  +------------------------+  |
+---------------+---------------------------------------------------------+
```
**Component Needs:** 
- **KPI Cards**: Instantly show the user the health of the business.
- **Revenue/Demand Charts**: Provide visual context to the numbers.
- **Recent Predictions**: A quick-action list prompting the Pricing Manager to review new AI suggestions.

---

## 4. Authentication Pages

```text
+-----------------------------------------------------------+
|                                                           |
|             [Logo] PricePilot AI                          |
|                                                           |
|             +---------------------------------+           |
|             | Sign In to your account         |           |
|             |                                 |           |
|             | Email Address                   |           |
|             | [ user@company.com            ] |           |
|             |                                 |           |
|             | Password                        |           |
|             | [ ******************          ] |           |
|             |                                 |           |
|             | [x] Remember me  (Forgot Pass?) |           |
|             |                                 |           |
|             | [       SIGN IN BUTTON        ] |           |
|             |                                 |           |
|             | Need access? Contact Admin      |           |
|             +---------------------------------+           |
|                                                           |
+-----------------------------------------------------------+
```

---

## 5. Product Management Module

```text
+---------------+---------------------------------------------------------+
| 📦 Products   |  Products Catalog                     [ + Add Product ] |
|               |---------------------------------------------------------|
|               | Filter: [Category v] [Stock v]   Search: [Name/SKU...]  |
|               |                                                         |
|               | SKU    | Name         | Base Cost | Stock | Actions     |
|               | ------ | ------------ | --------- | ----- | -------     |
|               | AP-01  | AirPods Pro  | $150.00   | 432   | [Edit]      |
|               | MB-14  | MacBook 14"  | $1200.00  | 14    | [Edit]      |
|               | IP-15  | iPhone 15    | $700.00   | 0     | [Edit]      |
|               |                                                         |
|               | < Previous | Page 1 of 12 | Next >                      |
+---------------+---------------------------------------------------------+
```

---

## 6. Price Prediction Module

```text
+---------------+---------------------------------------------------------+
| 📈 Prediction |  AI Price Optimization                                  |
|               |---------------------------------------------------------|
|               | 1. Select Product: [ MacBook 14" (MB-14)         | v ]  |
|               | 2. Target Strategy: [ Maximize Profit Margin     | v ]  |
|               | 3. Market Context:  [ Standard (No active promos)| v ]  |
|               |                                                         |
|               |                  [ RUN AI PREDICTION ]                  |
|               |---------------------------------------------------------|
|               | RESULT:                                                 |
|               | Recommended Price: $1,449.00  (Current: $1,399.00)      |
|               | Confidence Score:  94% [||||||||||||||||||| ]           |
|               |                                                         |
|               | AI Explanation:                                         |
|               | - Competitor 'TechStore' raised price to $1499.         |
|               | - High historical demand for upcoming month (+15%).     |
|               |                                                         |
|               | [ APPLY NEW PRICE ]     [ REJECT RECOMMENDATION ]       |
+---------------+---------------------------------------------------------+
```

---

## 7. Demand Forecasting Module

```text
+---------------+---------------------------------------------------------+
| 📊 Forecast   |  Demand Forecasting (30 Days)                           |
|               |---------------------------------------------------------|
|               | Product Group: [ Electronics ] Horizon: [ Next 30 Days] |
|               |---------------------------------------------------------|
|               | Predicted Demand Trend                                  |
|               | +---------------------------------------------------+   |
|               | |    *   *  *                                       |   |
|               | |  *         *   *(Predicted Peak: Holiday)         |   |
|               | | *            *                                    |   |
|               | | Historical | Predicted                            |   |
|               | +---------------------------------------------------+   |
|               | Overall Model Confidence: 88%                           |
|               |                                                         |
|               | Date       | Est. Volume | Min Bound | Max Bound        |
|               | ---------- | ----------- | --------- | ---------        |
|               | 2026-08-01 | 145 units   | 130       | 160              |
|               | 2026-08-02 | 152 units   | 135       | 168              |
+---------------+---------------------------------------------------------+
```

---

## 8. Competitor Analysis Module

```text
+---------------+---------------------------------------------------------+
| 🎯 Competitor |  Market Positioning                                     |
|               |---------------------------------------------------------|
|               | Product         | Our Price | Competitor | Diff  | Pos  |
|               | --------------- | --------- | ---------- | ----- | ---  |
|               | AirPods Pro     | $195.00   | $199.00    | -$4   | Low  |
|               | MacBook 14"     | $1449.00  | $1420.00   | +$29  | High |
|               | Sony WH-1000XM5 | $348.00   | $348.00    | $0    | Match|
|               |                                                         |
|               | AI Recommendation:                                      |
|               | "MacBook 14 is priced 2% above market average. Demand   |
|               | is elastic; consider matching $1420 to increase volume."|
+---------------+---------------------------------------------------------+
```

---

## 9. Revenue Optimization Module

```text
+---------------+---------------------------------------------------------+
| 💰 Rev. Opt   |  Revenue Strategy Simulation                            |
|               |---------------------------------------------------------|
|               | Simulation Parameters:                                  |
|               | Price Adjustment: [-] =====|===== [+] (+5.0%)           |
|               | Est. Demand Drop: 2.1%                                  |
|               |                                                         |
|               | Projection Results (30 Days):                           |
|               | Current Projected Rev: $450,000                         |
|               | Simulated Projected Rev: $465,000 (+ $15k)              |
|               |                                                         |
|               | [ Area Chart comparing Current vs Simulated Revenue ]   |
|               |                                                         |
|               | AI Conclusion: "A 5% price increase will likely yield   |
|               | higher total revenue despite a minor drop in volume."   |
+---------------+---------------------------------------------------------+
```

---

## 10. Analytics Dashboard & 11. User Management

**Analytics Dashboard**
Contains massive Data Grids, multi-select filter dropdowns (Date, Region, Category), and a large "Export to CSV/PDF" button. Features complex charts combining Price, Demand, and Cost layers into single views.

**User Management (Admin Only)**
A standard CRUD table displaying Users (Name, Email, Role, Last Login). An "Add User" button opens a modal allowing the Admin to assign roles (`Admin`, `Pricing Manager`, `Business Analyst`).

---

## 12. User Journey

### Admin
1. Logs into the system.
2. Navigates to **User Management** to provision accounts for the Pricing and Analytics teams.
3. Accesses the **Dashboard** to ensure all background AI jobs and databases are healthy and connected.

### Pricing Manager
1. Logs into the system and checks the **Dashboard** for alerts (e.g., "Competitor price drop detected").
2. Opens the **Competitor Analysis** module to review the threat.
3. Opens the **Price Prediction** module, selects the affected product, and runs the AI model.
4. Reviews the AI's explanation and confidence score, then clicks "Apply New Price" to push the optimal price to the storefront.

### Business Analyst
1. Logs into the system at the end of the month.
2. Opens the **Demand Forecasting** module to prepare the supply chain for next month's volume.
3. Opens the **Revenue Optimization** module to simulate Q4 pricing strategies.
4. Uses the **Analytics Dashboard** to export comprehensive CSV reports for executive stakeholders.

---

## 13. UI Design Guidelines

To ensure a modern, enterprise-grade feel suitable for an AI platform:

- **Color Theme**: 
  - **Primary**: Deep Indigo/Blue (`#4F46E5`) for primary actions and brand identity, conveying trust and intelligence.
  - **Background**: Very light gray (`#F9FAFB`) for the main canvas, stark white (`#FFFFFF`) for cards.
  - **Accents**: Emerald Green for positive trends/profit, Rose Red for negative trends/stockouts.
- **Typography**: `Inter` or `Roboto`. Clean, highly legible sans-serif fonts. Use `Medium` (500) and `Semibold` (600) weights for data labels to enhance readability.
- **Card Layout**: All data should be contained within subtly shadowed, rounded-corner cards (Glassmorphism or flat Material styling) to separate content visually from the background.
- **Tables**: Use striped rows for readability. Sticky headers are mandatory for large datasets. Ensure numerical data (Prices) is right-aligned for easy scanning.
- **Charts**: Recharts will be used with smooth curves (`monotone`) for line charts. Tooltips must be enabled on all charts to provide exact data points on hover.
- **Icons**: Heroicons (Outline variants) to keep the interface feeling lightweight and modern.
- **Responsive Layout**: The sidebar should collapse into a hamburger menu on smaller screens. Data tables should allow horizontal scrolling on mobile/tablet devices.

*End of UI Wireframes Document.*
