# API Design Documentation

## 1. API Design Overview

REST (Representational State Transfer) APIs are a standard architectural style used for building web services. They allow different software systems to communicate over HTTP using standard methods like GET, POST, PUT, and DELETE.

In **PricePilot AI**, we use REST APIs to strictly decouple the React frontend from the FastAPI backend. 
- **Communication Flow**: The React frontend captures user interactions and sends asynchronous HTTP requests (via Axios) containing JSON payloads to the FastAPI backend. FastAPI processes the request, communicates with PostgreSQL or the ML engine, and returns a structured JSON response.
- **Naming Conventions**: All endpoints follow standard RESTful noun-based conventions (e.g., `/api/v1/products` instead of `/api/v1/getProducts`). Plural nouns are used for resource collections.

---

## 2. Authentication APIs

### Register User
- **Endpoint**: `/api/v1/auth/register`
- **Method**: `POST`
- **Purpose**: Creates a new user account.
- **Auth Required**: No (or Admin only depending on business rules; assuming open registration for this doc).
- **Request Body**: `{"username": "jdoe", "email": "jdoe@example.com", "password": "securePass123"}`
- **Success Response (201 Created)**: `{"id": 1, "username": "jdoe", "email": "jdoe@example.com", "role": "pending"}`

### Login User
- **Endpoint**: `/api/v1/auth/login`
- **Method**: `POST`
- **Purpose**: Authenticates a user and returns a JWT.
- **Auth Required**: No.
- **Request Body**: `{"email": "jdoe@example.com", "password": "securePass123"}`
- **Success Response (200 OK)**: `{"access_token": "eyJhbG...", "token_type": "bearer", "role": "Pricing Manager"}`

### Logout User
- **Endpoint**: `/api/v1/auth/logout`
- **Method**: `POST`
- **Purpose**: Invalidates the current user token.
- **Auth Required**: Yes.
- **Success Response (200 OK)**: `{"message": "Successfully logged out"}`

### Get Current User Profile
- **Endpoint**: `/api/v1/auth/me`
- **Method**: `GET`
- **Purpose**: Retrieves the profile of the currently logged-in user.
- **Auth Required**: Yes (Any Role).
- **Success Response (200 OK)**: `{"id": 1, "email": "jdoe@example.com", "role": "Pricing Manager", "last_login": "2026-07-26T10:00:00Z"}`

### Refresh Token
- **Endpoint**: `/api/v1/auth/refresh`
- **Method**: `POST`
- **Purpose**: Issues a new JWT using a valid refresh token.
- **Auth Required**: Yes.
- **Success Response (200 OK)**: `{"access_token": "new_eyJhbG...", "token_type": "bearer"}`

---

## 3. User Management APIs

These APIs are restricted to the **Admin** role for managing platform access.

- **Get All Users**: `GET /api/v1/users` (Returns array of user objects)
- **Get User By ID**: `GET /api/v1/users/{id}` (Returns single user object)
- **Create User**: `POST /api/v1/users` (Payload: user details and role)
- **Update User**: `PUT /api/v1/users/{id}` (Payload: updated user details)
- **Delete User**: `DELETE /api/v1/users/{id}` (Returns 204 No Content)
- **Assign Role**: `PATCH /api/v1/users/{id}/role` 
  - **Payload**: `{"role": "Business Analyst"}`
  - **Success**: `200 OK`

---

## 4. Product Management APIs

Accessible by **Admin** and **Pricing Manager**.

### Get Products
- **Endpoint**: `GET /api/v1/products`
- **Response**: `[{"id": 1, "sku": "IP-15", "name": "iPhone 15", "base_cost": 700.00, "stock": 50}]`

### Get Product Details
- **Endpoint**: `GET /api/v1/products/{id}`

### Add Product
- **Endpoint**: `POST /api/v1/products`
- **Payload**: `{"sku": "MB-14", "name": "MacBook 14", "base_cost": 1200.00, "stock": 100}`

### Update Product
- **Endpoint**: `PUT /api/v1/products/{id}`

### Delete Product
- **Endpoint**: `DELETE /api/v1/products/{id}`

### Update Product Price
- **Endpoint**: `PATCH /api/v1/products/{id}/price`
- **Payload**: `{"new_price": 1299.00, "reason": "AI Recommendation applied"}`

### Get Product Price History
- **Endpoint**: `GET /api/v1/products/{id}/price-history`
- **Response**: `[{"date": "2026-07-20", "price": 1200.00}, {"date": "2026-07-26", "price": 1299.00}]`

---

## 5. Price Prediction APIs

Accessible by **Pricing Manager**.

### Predict Optimal Price
- **Endpoint**: `POST /api/v1/predictions/price`
- **Payload**: `{"product_id": 1, "target_strategy": "maximize_profit", "market_context": "standard"}`
- **Response**: 
  ```json
  {
    "product_id": 1,
    "recommended_price": 1449.00,
    "confidence_score": 0.94,
    "explanation": "High historical demand approaching. Competitor average increased by 2%."
  }
  ```

### Get Prediction History
- **Endpoint**: `GET /api/v1/predictions/history`

### Get Prediction Details
- **Endpoint**: `GET /api/v1/predictions/{id}`

---

## 6. Demand Forecasting APIs

Accessible by **Business Analyst** and **Pricing Manager**.

### Generate Forecast
- **Endpoint**: `POST /api/v1/forecasts/demand`
- **Payload**: `{"product_id": 1, "horizon_days": 30}` *(Supports 7, 14, 30, 90, 180, 365 days)*
- **Response**: 
  ```json
  {
    "product_id": 1,
    "horizon": 30,
    "forecast": [
      {"date": "2026-08-01", "predicted_volume": 145, "min_bound": 130, "max_bound": 160}
    ],
    "overall_confidence": 0.88
  }
  ```

### Get Forecast History
- **Endpoint**: `GET /api/v1/forecasts/history`

### Get Forecast Details
- **Endpoint**: `GET /api/v1/forecasts/{id}`

---

## 7. Competitor Analysis APIs

Accessible by **Business Analyst** and **Pricing Manager**.

### Retrieve Competitor Prices
- **Endpoint**: `GET /api/v1/competitors/prices?product_id=1`
- **Response**: `[{"competitor": "Amazon", "price": 1420.00}, {"competitor": "BestBuy", "price": 1450.00}]`

### Compare Prices
- **Endpoint**: `GET /api/v1/competitors/compare?product_id=1`

### Generate Pricing Recommendation
- **Endpoint**: `POST /api/v1/competitors/recommendations`
- **Payload**: `{"product_id": 1, "strategy": "match_lowest"}`

---

## 8. Revenue Optimization APIs

Accessible by **Admin** and **Business Analyst**.

### Revenue Simulation
- **Endpoint**: `POST /api/v1/revenue/simulate`
- **Payload**: `{"product_id": 1, "price_adjustment_pct": 5.0, "horizon_days": 30}`
- **Response**: `{"projected_revenue": 465000, "projected_volume_drop_pct": 2.1, "profit_delta": 15000}`

### Profitability Analysis
- **Endpoint**: `GET /api/v1/revenue/profitability?product_id=1`

### Generate Pricing Strategy
- **Endpoint**: `POST /api/v1/revenue/strategy`

---

## 9. Analytics Dashboard APIs

Accessible by **Admin** and **Business Analyst**.

- **Dashboard KPIs**: `GET /api/v1/analytics/kpis`
- **Revenue Reports**: `GET /api/v1/analytics/revenue?timeframe=ytd`
- **Product Performance**: `GET /api/v1/analytics/products/top-performers`
- **Demand Reports**: `GET /api/v1/analytics/demand/trends`
- **Prediction Reports**: `GET /api/v1/analytics/predictions/accuracy`

---

## 10. Dataset & AI Model APIs

Restricted to **Admin** only. Used for offline batch processing and ML maintenance.

- **Upload Dataset**: `POST /api/v1/ml/datasets/upload` (Form-data: CSV file)
- **Validate Dataset**: `POST /api/v1/ml/datasets/{id}/validate`
- **Train Model**: `POST /api/v1/ml/models/train` (Payload: `{"model_type": "xgboost", "dataset_id": 1}`)
- **Evaluate Model**: `GET /api/v1/ml/models/{id}/evaluate`
- **Load Trained Model**: `POST /api/v1/ml/models/{id}/load`
- **Model Information**: `GET /api/v1/ml/models/info`

---

## 11. API Security

- **JWT Authentication**: All requests (except login/register) must include an `Authorization: Bearer <token>` header.
- **Role-Based Access Control (RBAC)**: FastAPI dependencies check the role embedded in the JWT before executing the endpoint logic.
- **Authorization Flow**: If a user attempts to access an endpoint outside their role scope, the system aborts the request.
- **Protected Routes**: Defined globally using FastAPI's `Depends(get_current_user)` utility.
- **Input Validation**: Pydantic schemas strictly validate all incoming request bodies (e.g., ensuring `price` is a positive float).
- **Error Handling**: Standardized JSON error responses ensure the frontend can parse and display user-friendly messages without crashing.

---

## 12. API Error Responses

All API errors return a standardized JSON format containing a `detail` message.

**400 Bad Request** (Malformed syntax or invalid input)
`{"detail": "Invalid price parameter. Must be greater than 0."}`

**401 Unauthorized** (Missing or invalid JWT token)
`{"detail": "Could not validate credentials."}`

**403 Forbidden** (Valid token, but insufficient permissions)
`{"detail": "Insufficient role privileges. Admin access required."}`

**404 Not Found** (Resource does not exist)
`{"detail": "Product with ID 45 not found."}`

**409 Conflict** (Resource state conflict)
`{"detail": "A product with SKU 'IP-15' already exists."}`

**422 Validation Error** (FastAPI/Pydantic caught invalid field types)
```json
{
  "detail": [
    {
      "loc": ["body", "horizon_days"],
      "msg": "value is not a valid integer",
      "type": "type_error.integer"
    }
  ]
}
```

**500 Internal Server Error** (Unhandled backend exception)
`{"detail": "An unexpected server error occurred."}`

---

## 13. API Status Codes

| Status Code | Description | When it is used |
|-------------|-------------|-----------------|
| `200 OK` | Success | Standard response for successful GET, PUT, PATCH requests. |
| `201 Created` | Created | Returned when a POST request successfully creates a new database record. |
| `204 No Content` | Success (No data) | Returned after successfully deleting a record. |
| `400 Bad Request` | Client Error | The client sent invalid data or violated business logic rules. |
| `401 Unauthorized` | Auth Error | The user is not logged in or the JWT token is expired. |
| `403 Forbidden` | Permission Error | The logged-in user lacks the required RBAC role. |
| `404 Not Found` | Missing Resource | The requested URL or database ID does not exist. |
| `409 Conflict` | Data Conflict | The request violates a database constraint (e.g., duplicate email). |
| `422 Unprocessable` | Validation Error | Pydantic failed to validate the request payload schema. |
| `500 Internal Server Error`| Server Error | The Python backend crashed due to an unhandled exception. |

---

## 14. API Summary Table

| Module | Endpoint | Method | Auth Required | Allowed Roles |
|--------|----------|--------|---------------|---------------|
| Auth | `/api/v1/auth/login` | POST | No | All |
| Auth | `/api/v1/auth/me` | GET | Yes | All |
| Users | `/api/v1/users` | GET | Yes | Admin |
| Products | `/api/v1/products` | GET | Yes | Admin, Pricing Mgr |
| Products | `/api/v1/products/{id}/price` | PATCH | Yes | Admin, Pricing Mgr |
| Predictions | `/api/v1/predictions/price` | POST | Yes | Pricing Mgr |
| Forecasting | `/api/v1/forecasts/demand` | POST | Yes | Pricing Mgr, Analyst |
| Competitors | `/api/v1/competitors/prices` | GET | Yes | Pricing Mgr, Analyst |
| Revenue | `/api/v1/revenue/simulate` | POST | Yes | Admin, Analyst |
| Analytics | `/api/v1/analytics/kpis` | GET | Yes | Admin, Analyst |
| AI Models | `/api/v1/ml/models/train` | POST | Yes | Admin |
