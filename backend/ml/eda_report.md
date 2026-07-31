# PricePilot AI - Exploratory Data Analysis (EDA) Report

## 1. Dataset Summary

- **Total Rows**: 172,800
- **Total Columns**: 17
- **Duplicate Rows**: 0
- **Missing Values**: 
  - `promotion_type`: 100,155 missing values. These represent days without an active promotional campaign. 
    - **Action Plan**: Most ML algorithms cannot natively handle NULLs in categorical features. We will explicitly impute these missing values with the string `"None"` so it acts as its own distinct category during encoding.

### Basic Statistics (Numerical)
| Column | Mean | Min | Max |
| :--- | :--- | :--- | :--- |
| **base_price** | 221.37 | 8.55 | 449.74 |
| **current_price** | 197.83 | 4.28 | 449.74 |
| **discount_pct** | 10.65 | 0 | 50 |
| **units_sold** | 632.74 | 2 | 2665 |
| **revenue** | 120,402.10 | 9.07 | 1,027,511.00 |
| **inventory_level** | 4337.89 | 0 | 18526 |
| **demand_index** | 117.44 | 0 | 365.08 |

### Categorical Columns
- **date**: 90 unique dates (e.g., '2026-01-01' to '2026-03-31')
- **product_id**: 640 unique products
- **category**: 8 unique ('Shoes', 'Apparel', 'Accessories', 'Electronics', 'Beauty', ...)
- **brand**: 33 unique ('Nike', 'Puma', 'Adidas', 'Asics', ...)
- **region**: 6 unique ('AU', 'DE', 'US', 'UK', 'CA', ...)
- **channel**: 3 unique ('mobile', 'web', 'app')
- **season**: 2 unique ('Winter', 'Spring')
- **promotion_type**: 5 unique ('Buy One Get One', 'Member Offer', 'Percentage Discount', 'Flash Sale', NaN)

---

## 2. Selected Target Variable

**Target Variable:** `current_price`
**Reason:** The goal of the Price Prediction module is to predict the optimal selling price for a product. In historical data, `current_price` represents the actual price offered in the market.

---

## 3. Data Leakage Detection

Data leakage occurs when a model is trained on features that will not be available at the time of prediction, or features that are mathematically derived from the target variable. The following columns MUST be excluded from training to prevent false accuracy (leakage):

1. **`revenue`**: Mathematically derived from the price (`units_sold` * `current_price`). The model would learn a perfect mathematical mapping rather than real-world pricing dynamics.
2. **`units_sold`**: This represents the *outcome* of setting the price. When predicting tomorrow's price today, we do not yet know tomorrow's exact units sold.
3. **`discount_pct`**: Directly derived from the target (`base_price` * (1 - `discount_pct`/100) = `current_price`). 
4. **`price_change_pct`**: Another direct mathematical derivative of the target variable compared to the base price.

---

## 4. Feature Selection Analysis

| Column Name | Decision | Reason for Selection |
| :--- | :--- | :--- |
| **date** | Derived Feature | Can be parsed into `day_of_week`, `is_weekend`, or `month` to capture temporal shopping behaviors. |
| **product_id** | Ignore | High cardinality (640 unique). Might cause overfitting in Version 1. Better to rely on `brand` and `category` for generalizability. |
| **category** | Use as Feature | Different categories (e.g., Electronics vs Shoes) have drastically different price elasticities. |
| **brand** | Use as Feature | Premium brands command higher prices regardless of inventory. |
| **region** | Use as Feature | Geographic purchasing power varies significantly across regions. |
| **channel** | Use as Feature | App vs Web often feature different pricing strategies or targeted promotions. |
| **season** | Use as Feature | Seasonal context heavily impacts demand and pricing algorithms. |
| **base_price** | Use as Feature | Provides the foundational anchor price. **Note**: Correlation analysis shows `base_price` and `current_price` have a massive correlation of `0.9497`. While it dominates the prediction, it is absolutely necessary (the model must know the item's baseline value to calculate optimal discounts). |
| **current_price** | **TARGET** | The dependent variable we are predicting. |
| **price_change_pct** | Ignore (Leakage) | Mathematically linked to target. |
| **discount_pct** | Ignore (Leakage) | Mathematically linked to target. |
| **promotion_type** | Use as Feature | Dictates marketing context which directly suppresses or inflates optimal pricing limits. Missing values will be imputed as "None". |
| **units_sold** | Ignore (Leakage) | Happens *after* price is set. Can only be used if transformed into a historical lag (e.g., `units_sold_last_7_days`). |
| **revenue** | Ignore (Leakage) | Represents an outcome, not an input. |
| **inventory_level** | Use as Feature | Scarcity drives price up. Crucial for dynamic pricing. |
| **stockout_flag** | Use as Feature | Boolean indicator of critical supply constraints. |
| **demand_index** | Use as Feature | Direct metric representing current market demand volume. |

---

## 5. Recommended Feature Set for Version 1 (Linear Regression Baseline)

Based on the analysis, the Version 1 model should be trained using the following features to predict `current_price`:

**Categorical Inputs (Requires One-Hot Encoding):**
- `category`
- `brand`
- `region`
- `channel`
- `season`
- `promotion_type`

**Numerical Inputs (Requires Scaling):**
- `base_price`
- `inventory_level`
- `stockout_flag`
- `demand_index`

**Excluded / Dropped:**
- `revenue`, `units_sold`, `discount_pct`, `price_change_pct`, `product_id`, `date` (until parsed).
