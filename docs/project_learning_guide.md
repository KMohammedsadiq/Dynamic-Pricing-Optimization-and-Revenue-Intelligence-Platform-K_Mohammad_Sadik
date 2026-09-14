# PricePilot AI - Complete Project Learning Guide

Simple English. Easy to Understand. Everything You Need to Know.

---

## Table of Contents

1. What is PricePilot AI?
2. Why Did We Build It?
3. How Does It Work - Big Picture
4. System Architecture Explained
5. Tools and Technology Stack
6. Database Design
7. Module 1 - User Authentication and Role Management
8. Module 2 - Product Catalog and Data Management
9. Module 3 - Price Prediction Using AI and ML
10. Module 4 - Demand Forecasting
11. Module 5 - Competitor Analysis
12. Module 6 - Revenue Optimization and Analytics
13. Module 7 - Dashboard and Executive BI
14. The Dataset
15. Deployment - How the App Went Live
16. API Design - How Frontend Talks to Backend
17. Complete Workflow End-to-End
18. Milestone Summary and Key Concepts

---

## 1. What is PricePilot AI?

PricePilot AI is a smart web application that helps businesses decide what price to sell their products at - automatically - using Artificial Intelligence.

Think of it like a very smart pricing assistant:
- A supermarket can use it to automatically raise prices when demand is high
- An airline can use it to lower ticket prices when seats are empty
- An e-commerce store can use it to beat competitor prices intelligently

In simple terms: Instead of a human manually checking prices every day, PricePilot AI uses historical sales data, competitor prices, seasonal trends, and machine learning models to suggest or set the perfect price automatically.

---

## 2. Why Did We Build It?

### The Problem
Businesses lose money every day because of bad pricing:
- They price too high - customers go to competitors - low sales
- They price too low - they sell a lot but earn less profit - revenue lost
- They do not know what competitors are charging - they lose market share
- They cannot predict when demand will spike (for example during festivals) - out of stock or too much stock

### The Solution - PricePilot AI
- AI-powered price suggestions based on real data
- Demand forecasting to predict how many units will be sold
- Competitor tracking to know what competitors charge
- Revenue analytics to see which products make the most profit
- One central platform with everything in one place for pricing managers and executives

### Who Can Use This?
- E-commerce companies
- Retail businesses
- Marketplaces
- Airlines and Hotels
- Subscription platforms
- Any sales team that needs smart pricing

---

## 3. How Does It Work - Big Picture

Step 1: User visits the website
Step 2: Logs in (authentication check)
Step 3: Views Dashboard (summary of all data)
Step 4: Uses various modules:
  - Products module to see/manage product catalog
  - Price Prediction to get AI price recommendation
  - Demand Forecast to predict future sales
  - Competitors to compare with market prices
  - Revenue Optimization to maximize profit
Step 5: Backend (FastAPI) processes all requests
Step 6: Database (PostgreSQL) stores all data
Step 7: ML Models (XGBoost) make predictions
Step 8: Results shown back on the website

---

## 4. System Architecture Explained

The system is divided into 4 main layers:

### Layer 1 - Access Layer (What Users See)
This is the frontend - the website that users open in a browser.
- Built with React.js (a JavaScript library for building web pages)
- Hosted on Vercel (a cloud platform for hosting websites for free)
- The user sees charts, tables, forms, and dashboards here

### Layer 2 - Data Pipeline and Processing
This is where raw data gets cleaned and organized before it goes into the database.
- We upload a CSV file with 200,000+ rows of pricing and sales data
- The system cleans bad data (removes missing values, fixes data types)
- Then stores clean data into the database

### Layer 3 - Dynamic Pricing Intelligence Engine (The AI Brain)
This is where all the smart decisions happen:
- Price Prediction Model - XGBoost ML model that predicts the best selling price
- Demand Forecasting Model - predicts how many units will be sold in next 7/14/30/90 days
- Competitor Analysis Engine - compares your price with competitor prices
- Revenue Optimization Engine - suggests strategies to maximize profit

### Layer 4 - Data Foundation (Database)
All data is stored in PostgreSQL - a powerful open-source relational database.

---

## 5. Tools and Technology Stack

### Frontend (What users see in their browser)

React.js - JavaScript library to build the website. Very fast and component-based.
Vite - Build tool to run React during development. Very fast startup.
Tailwind CSS - CSS framework to style the website beautifully.
Recharts / Chart.js - Libraries to draw charts and graphs.
Axios - HTTP client that sends API requests from React to the backend.

### Backend (The engine behind the website)

Python - Programming language. Great for AI/ML and web APIs.
FastAPI - Python web framework to build APIs. Very fast and auto-generates documentation.
SQLAlchemy - ORM that maps Python objects to database tables. We write Python not raw SQL.
Alembic - Database migration tool. Manages changes to database structure over time.
Pydantic - Data validation library. Validates incoming data before it goes to the database.

### Security and Authentication

JWT (JSON Web Token) - A digital pass given to users after login to prove who they are.
bcrypt - Encrypts passwords before storing them. Even we cannot see the real password.
passlib - Python library that manages password hashing using bcrypt.

### AI and Machine Learning

XGBoost - Main ML model used for price prediction. Very powerful and accurate.
Scikit-learn - ML utility library for preprocessing, pipelines, and metrics.
Pandas - Data manipulation library for reading CSV files and cleaning data.
NumPy - Math operations needed for machine learning.
Joblib - Saves (serializes) trained ML models to disk as .pkl files.

### Database

PostgreSQL - Main relational database that stores all product, user, pricing, and sales data.
psycopg2 - Python driver that connects to PostgreSQL.

### Deployment and DevOps

Docker - Packages the app into containers so it runs the same everywhere.
Render - Cloud platform to host the backend server and PostgreSQL database.
Vercel - Cloud platform to host the React frontend.
Git and GitHub - Version control that tracks all code changes.
Nginx - Web server inside the Docker container that serves the React app efficiently.

### Development Tools

VS Code - Code editor used for writing all code.
Postman - Tool for testing APIs before the frontend is ready.
Docker Compose - Runs multiple services (frontend, backend, database) together locally.

---

## 6. Database Design

We use PostgreSQL with the following 6 main tables:

### Table 1 - users
Stores all registered users.
Fields: id, full_name, email, password_hash, role_id, is_active, created_at

Important: password_hash means we NEVER store the actual password. We only store its encrypted version. Even if someone breaks into the database, they cannot read passwords.
role_id links to the roles table so we know if the user is Admin or Viewer.

### Table 2 - roles
Defines what permissions each type of user has.
Fields: id, name
Values: "Admin" or "Viewer"

### Table 3 - product_catalog
The master list of unique products (745 unique products in our system).
Fields: id, product_id (SKU), product_name, category, brand, base_price, current_price, cost_price, initial_inventory, competitor_price, product_lifecycle, supplier_name, status, is_deleted

### Table 4 - products (Historical Data Table)
Stores 200,674 rows of historical sales and pricing records. One row per product per time period. This is the big data table used for ML training and analytics.
Fields: id, product_id, date, category, brand, region, channel, season, base_price, current_price, units_sold, revenue, inventory_level, stockout_flag, demand_index, promotion_type, discount_pct, and more.

### Table 5 - competitor_prices
Stores competitor pricing data for market comparison.
Fields: id, product_id, competitor_name, competitor_price, recorded_at

### Table 6 - dataset_uploads
Audit log of every time a CSV file was uploaded. Like a history book of uploads.
Fields: id, file_name, uploaded_by, total_rows, imported_rows, skipped_rows, status, uploaded_at

---

## 7. Module 1 - User Authentication and Role Management

### What is it?
A system to control who can log in and what they are allowed to do inside PricePilot AI.

### Why do we need it?
Without authentication, anyone could change prices or delete products. We need to know who is who and limit actions based on roles.

### Registration Flow - Step by Step

1. User fills registration form (name, email, password)
2. Frontend sends POST request to /api/v1/auth/register
3. Backend checks: Is this email already in the database?
4. If NO - bcrypt hashes the password. For example "admin123" becomes "$2b$12$xxxx..."
5. Saves user to PostgreSQL with hashed password
6. Returns user data (WITHOUT password) back to frontend

### Login Flow - Step by Step

1. User enters email + password on the login page
2. Frontend sends POST request to /api/v1/auth/login
3. Backend finds user by email in database
4. bcrypt verifies: does the typed password match the stored hash?
5. If YES - Backend creates a JWT Token (like a digital ID card)
6. JWT contains: user_id, email, role (e.g., "Admin")
7. JWT is sent back to frontend
8. Frontend stores JWT in localStorage (browser storage)
9. Every future API request includes this JWT in the Authorization header
10. Backend reads the JWT to know who is making the request

### What is a JWT Token?
A JWT (JSON Web Token) is like a hospital wristband:
- Given to you when you check in (login)
- Contains your info (name, role)
- Every doctor and nurse (API endpoint) checks it before doing anything for you
- It expires after a set time (you must log in again to get a new one)

### Roles and Permissions

Admin role can do everything:
- View all dashboards and analytics
- Upload CSV datasets
- Add, edit, and delete products
- Manage users

Viewer role can only:
- View dashboards and data
- Cannot make any changes

### Google OAuth Login
We also support logging in with a Google account:
1. User clicks "Login with Google"
2. Google verifies the user and sends back their email and name
3. Backend creates an account automatically with "Viewer" role
4. Generates JWT token and logs them in

---

## 8. Module 2 - Product Catalog and Data Management

### What is it?
A place to manage the list of all products being sold and their pricing information.

### Two Types of Data in Our System

Product Catalog Table (product_catalog):
- Think of this as the "master menu" of all products
- Contains 745 unique products
- Has current selling price, cost price, initial inventory
- Admins can Add, Edit, or Delete (soft delete) products here
- Used by the Price Prediction module as the source of product info

Historical Products Table (products):
- Think of this as the "sales history log"
- Contains 200,674 rows - one row per product per week or period
- Contains actual past sales data - units sold, revenue, prices, promotions
- Used by the ML models to learn pricing patterns over time

### How Data Gets Into the System - Upload Flow

1. Admin clicks "Upload Data" in the sidebar
2. Selects a CSV file from their computer
3. Frontend sends the file to /api/v1/products/upload
4. Backend reads CSV with Pandas library
5. Validates: are the right columns present? are numbers valid? are there negative prices?
6. Anti-duplicate check: do not insert rows that already exist in the database
7. Bulk inserts all valid rows into the products table using fast bulk insert
8. Auto-creates entries in product_catalog for any brand new unique products found
9. Records the upload in dataset_uploads audit log with success or failure status

### Cloud Upload - The seed_cloud_db.py Script
For the 200,674-row dataset, we built a special Python script that:
- Reads the CSV in chunks of 2,000 rows at a time to avoid using too much RAM
- Streams each chunk directly to the cloud PostgreSQL database on Render
- Shows progress to the terminal (for example "Chunk 45 of 101 uploaded")
- This chunking approach is needed because Render's free tier only allows 512MB of RAM

### Soft Delete Explained
When an admin "deletes" a product, we do NOT actually remove it from the database.
Instead we set is_deleted = True on that record. This is called a "soft delete".
Why? Because we might need the historical data later for analytics. Data is never truly lost.

---

## 9. Module 3 - Price Prediction Using AI and ML

### What is it?
An AI model that looks at a product's current price, demand level, competitor prices, and promotions, then suggests what the optimal selling price should be right now.

### What Algorithm Do We Use and Why?
We use XGBoost - eXtreme Gradient Boosting.

XGBoost is a machine learning algorithm that:
- Builds many decision trees (like flowcharts) and combines their results
- Each new tree corrects the mistakes of the previous tree
- Learns from patterns in thousands of past pricing decisions
- Is very accurate with tabular (spreadsheet-like) data like our pricing dataset
- Is fast - predictions happen in milliseconds

### How the Model Was Trained - Step by Step

1. Collected all 200,674 rows of historical pricing data
2. Selected 17 important features as inputs to the model:
   - current_price, base_price, cost_price
   - demand_index, competitor_price
   - promotion_type, inventory_level
   - brand, category, product_lifecycle
   - season, launch_year, average_rating, etc.
3. Defined the target (what we want to predict): price_multiplier
   This is a number like 1.05 meaning "multiply current price by 1.05 to get optimal price"
4. Split data: 80% for training, 20% for testing
5. Trained XGBoost model using Scikit-learn Pipeline (includes preprocessing + model)
6. Evaluated performance: checked MAE, RMSE, R-squared on the test set
7. Saved trained model as optimal_price_pipeline.pkl file using Joblib

### How a Real-Time Prediction Works

1. User selects a product from the catalog on the Price Prediction page
2. User fills in today's market conditions: demand level, inventory, competitor price, promotion
3. Frontend sends all this data to /api/v1/predictions/price
4. Backend loads the saved XGBoost model from the .pkl file
5. Model predicts the price_multiplier (for example 1.08)
6. Optimal Price = Current Price times Multiplier (for example 12000 times 1.08 = 12,960)
7. Business Rules are applied:
   - Price must be at least Cost Price times 1.10 (minimum 10% profit guaranteed)
   - If a promotion is active, apply the correct discount (Flash Sale uses 0.92 multiplier)
8. Returns to frontend: recommended price, price change percentage, confidence score

### Two Tabs in the Price Prediction Page

Existing Product tab:
- User types or selects a product name from the catalog
- All product info (cost price, base price, etc.) is auto-filled from the database
- User only needs to enter today's market conditions

New Product tab:
- For products not yet in the catalog
- User manually enters all details: name, brand, category, cost price, competitor price, etc.
- Useful for testing a new product's pricing before adding it to the catalog

### Prediction Stability Score
The model also calculates how confident it is about the prediction:
- It runs the prediction through multiple XGBoost trees incrementally
- Measures how much the predictions vary across trees (standard deviation)
- Low variation = high confidence score (for example 95%)
- High variation = lower confidence score (for example 72%)
- This helps users know whether to trust the recommendation or gather more data

### Promotion Business Rules Built Into the System

When a promotion type is selected, the system applies specific discount rules:
- Flash Sale: price multiplied by 0.92 (8% discount)
- Clearance: price multiplied by 0.90 (10% discount)
- Festival Offer: price multiplied by 0.95 (5% discount)
- Percentage Discount: price multiplied by 0.97 (3% discount)
- Buy One Get One: price multiplied by 0.96 (4% discount)
- Member Offer: price multiplied by 0.98 (2% discount)

---

## 10. Module 4 - Demand Forecasting

### What is it?
A system that predicts how many units of a product will be sold in the future - for the next 7, 14, 30, or 90 days.

### Why is it important?
If a business does not know future demand:
- They stock too little and run out of inventory - lose sales
- They stock too much and money is stuck in warehouse - higher costs
- They cannot plan promotions at the right time

Forecasting helps plan inventory and promotions in advance with confidence.

### How It Works - Step by Step

1. User selects a product and chooses a forecast horizon (7, 14, 30, or 90 days)
2. System loads all historical sales data for that product from the database
3. Creates time-series features called lag features:
   - units_sold_lag_1 = sales from 1 week ago
   - units_sold_lag_2 = sales from 2 weeks ago
   - rolling_4w_sales_mean = average sales over last 4 weeks
   - sales_growth_4w = how much sales changed in last 4 weeks
   - holiday_flag = is this week a holiday?
   - festival_flag = is this week a festival like Diwali or Eid?
4. ML model (trained separately for each horizon) predicts future demand
5. Returns: Predicted Units, Trend (Increasing / Stable / Decreasing), Confidence Score

### Forecast Horizons and Their Accuracy

7-day forecast: R-squared = 0.77 (best accuracy). Use for daily inventory and promotion planning.
14-day forecast: R-squared = 0.69 (good accuracy). Use for restocking decisions.
30-day forecast: R-squared = 0.53 (moderate accuracy). Use for monthly procurement.
90-day forecast: R-squared = 0.39 (lower accuracy). Use for quarterly planning only.

R-squared means: how much of the actual sales variation does the model explain?
A score of 0.77 means the model explains 77% of what determines actual sales.

### What are Lag Features?
Lag features are a way of telling the model "what happened in the past."
For example:
- units_sold_lag_1 = how many units were sold 1 week ago
- rolling_8w_sales_mean = the average units sold per week over the last 8 weeks

The model uses these to find patterns. If sales were high for 3 weeks in a row, the model learns demand is rising and predicts continued growth.

### Model Performance Metrics Explained

MAE (Mean Absolute Error): On average, how many units off is the prediction?
Example: MAE = 54 for 7-day forecast means on average we are off by 54 units.

RMSE (Root Mean Square Error): Like MAE but it penalizes very large errors more.
Useful to see if there are occasional very bad predictions.

R-squared: How much of the real variation does the model explain?
Score closer to 1.0 means better model. Score of 0 means the model is no better than guessing.

sMAPE (Symmetric Mean Absolute Percentage Error): The percentage error of predictions.
Example: sMAPE = 14.5% for 7-day means on average predictions are within 14.5% of actual.

### Holiday Impact on Demand
The system also shows how Indian holidays affect demand:
- New Year: demand goes up by 7.3%
- Holi: demand goes up by 4.3%
- Republic Day: demand goes up by 3.2%
- Independence Day: demand goes down by 39.3% (but this has a special note: promotions were unusually high during this period which confuses the data)
- Diwali and Christmas: not enough data yet to measure reliably

---

## 11. Module 5 - Competitor Analysis

### What is it?
A module that collects and displays competitor pricing data to help businesses stay competitive in the market.

### Why do we need it?
If you are selling a laptop for 80,000 rupees but the same laptop is available on Amazon for 72,000 rupees, customers will buy from Amazon. You need to know this difference quickly and react.

### What the Competitor Analysis Page Shows
- Your product's current price vs competitor prices side by side
- Price gap: are you charging more or less than competitors?
- Price trend: are competitors raising or lowering their prices over time?
- Market positioning: are you the cheapest option, average, or premium?
- Products where competitors are cheaper (opportunities to adjust price)

### Data Sources for Competitor Prices
- Amazon API integration (accessible at /api/v1/amazon endpoint)
- Flipkart API integration (accessible at /api/v1/flipkart endpoint)
- Manual competitor price records stored in the competitor_prices database table

### How Competitor Data Feeds Into Price Prediction
The competitor_price is one of the 17 input features used by the XGBoost price prediction model. This means when competitors lower their prices, the AI model automatically takes that into account when recommending your optimal price.

---

## 12. Module 6 - Revenue Optimization and Analytics

### What is it?
A module that helps businesses understand how much money they are making (revenue analytics) and how to make even more (revenue optimization).

### What the Analytics Page Shows
- Total Revenue broken down by month and year
- Revenue by Category (which product category earns the most?)
- Revenue by Brand (which brand is most profitable?)
- Revenue by Region (where are we selling the most - North, South, East, West?)
- Revenue by Sales Channel (Online vs In-Store vs Wholesale)
- Average Selling Price trends over time
- Discount Impact Analysis (does offering discounts actually increase total revenue?)

### Smart Price Advisor (Revenue Optimization)
The Smart Price Advisor page provides deeper revenue optimization:
- Price Elasticity Simulation: "What if we raised the price by 5%? How much more revenue would we earn?"
- Identifies products with very low profit margins that need a price increase
- Recommends specific products for price increase vs decrease
- Shows demand elasticity: does demand drop sharply when price goes up for this specific product?

### Profitability Metrics Tracked

Profit Margin: (Selling Price minus Cost Price) divided by Selling Price, times 100%
Example: If you sell for 1000 and cost is 700, profit margin = 30%

Revenue: Units Sold multiplied by Selling Price
Example: 100 units at 1000 each = 100,000 revenue

Gross Profit: Revenue minus (Units Sold times Cost Price)
Example: 100,000 minus (100 times 700) = 30,000 gross profit

Discount Rate: How much percentage is discounted from the original base price

---

## 13. Module 7 - Dashboard and Executive BI

### What is it?
The main landing page after login. Shows the most important business numbers at a glance. Designed for executives and managers who need a quick overview without going deep into data.

### Dashboard Summary Cards (From Our Live App)
- Total Records: 200,674 historical data rows uploaded
- Categories: 11 product categories in the dataset
- Brands: 89 unique brands
- Average Price: 13,812 rupees across all products
- Average Discount: 10.7% average discount given
- Total Inventory: 52,536,390 total units currently in stock

### Executive BI Page (Deeper Analytics)
This is a dedicated business intelligence page with:
- Revenue trends chart over months (line chart)
- Top 10 products by revenue (horizontal bar chart)
- Sales by channel breakdown (pie chart: Online vs In-Store vs Wholesale)
- Seasonal sales patterns (which season has highest revenue?)
- Year-over-year growth comparison
- KPI (Key Performance Indicator) scorecards

---

## 14. The Dataset

### What dataset did we use?
File name: retail_price_optimization_dataset_improved.csv

### How big is it?
- 200,674 rows (each row = one product in one time period)
- 31 columns (each column = one piece of information)
- File size: approximately 46 MB

### What does each column mean?

date: The date when this record was captured
product_id: Unique product code (also called SKU - Stock Keeping Unit)
product_name: Name of the product (example: Dell Inspiron 15 Laptop)
category: Product category (Electronics, Clothing, Books, Groceries, etc.)
brand: Brand name (Dell, Apple, Samsung, Nike, etc.)
region: Where it was sold (North, South, East, West India)
sales_channel: How it was sold (Online, In-Store, Wholesale)
season: Season at time of sale (Spring, Summer, Autumn, Winter)
base_price: Original listed price before any discounts
current_price: Actual selling price after discounts applied
discount_pct: What percentage discount was given
promotion_type: Type of promotion used (Flash Sale, Festival Offer, No Promotion, etc.)
units_sold: How many units were sold in this period
revenue: Total money earned (units_sold times current_price)
inventory_level: How many units were in stock
stockout_flag: Was the item out of stock? (1 = yes, 0 = no)
demand_index: A calculated index showing how high demand is
competitor_price: What the closest competitor charges for same product
cost_price: How much it costs us to buy or produce the product
profit_margin: Profit percentage on this product
supplier_name: Name of the product supplier

### Data Cleaning Steps We Performed
Before uploading to the cloud database we had to clean the data:
1. Renamed sales_channel column to channel (to match our database schema)
2. Dropped day_of_week and month columns (these can be derived from the date column)
3. Parsed date column as proper Python DateTime format (not just a text string)
4. Removed rows where product_id or current_price was missing (these are critical)
5. Removed rows where prices were negative (invalid data)
6. Removed exact duplicate rows

---

## 15. Deployment - How the App Went Live

### Local Development Setup
How we ran the app on our own computer:
1. Clone the GitHub repository to local machine
2. Run "docker-compose up" command
   This automatically starts three services:
   - Backend FastAPI server at http://localhost:8000
   - Frontend React server at http://localhost:5173
   - PostgreSQL database at port 5432
3. Open browser at http://localhost:5173

### Cloud Deployment - Backend on Render.com

Step 1: Push code to GitHub
Step 2: Render.com detects the code change automatically
Step 3: Render builds a Docker image using backend/Dockerfile
Step 4: The Dockerfile does:
  - FROM python:3.12-slim (start with Python base image)
  - COPY requirements.txt and run pip install (install all dependencies)
  - COPY the app code into the container
  - CMD: run uvicorn main:app --host 0.0.0.0 --port 10000
Step 5: Backend goes live at https://pricepilot-backend-d12m.onrender.com

### Cloud Deployment - Database on Render PostgreSQL

We created a PostgreSQL database service on Render.
Render gives a DATABASE_URL connection string.
We store this as an environment variable in the backend service.
The backend reads DATABASE_URL at startup to connect to the database.
We uploaded all 200,674 rows using our seed_cloud_db.py Python script.

### Cloud Deployment - Frontend on Vercel

Step 1: Push code to GitHub
Step 2: Vercel detects the code change automatically
Step 3: Vercel runs: npm run build
Step 4: This creates optimized HTML, CSS, JS files in the /dist folder
Step 5: Nginx web server (inside Docker) serves these files
Step 6: Frontend goes live at https://pricepilot-liar.vercel.app

### Environment Variables - What They Are and Why They Matter
Environment variables are secret settings stored in the cloud platform - NOT written in the code.
If we wrote secrets in the code and pushed to GitHub, anyone could steal them.

Variables we use:
DATABASE_URL: The full PostgreSQL connection string with username and password
SECRET_KEY: A long random secret used to sign JWT tokens
ALGORITHM: The JWT signing algorithm (we use HS256)
ACCESS_TOKEN_EXPIRE_MINUTES: How many minutes until JWT tokens expire

### Docker and Docker Compose Explained Simply
Docker is like a shipping container for software.
Just like a shipping container can carry any goods on any ship, a Docker container can run any app on any computer.
Docker Compose is like a multi-container manager - it runs the frontend container, backend container, and database container together with one command.

### The render.yaml File
This file is the deployment instruction manual for Render.com.
It tells Render: what type of service this is, how to build it, what command to run to start it, and what environment variables to use.

---

## 16. API Design - How Frontend Talks to Backend

### What is a REST API?
REST API is a standard way for the frontend and backend to communicate. It is like a restaurant menu system:
- You (Frontend) place an order (HTTP request) from the menu (API endpoints)
- The waiter (API) takes it to the kitchen (Backend server)
- The kitchen prepares the food (processes data) and sends it back (HTTP response)

### Our API Base URL
https://pricepilot-backend-d12m.onrender.com/api/v1/

### HTTP Methods Explained
GET: Read data from the server (like reading a menu)
POST: Send new data to the server (like placing an order)
PUT: Update existing data (like changing your order)
DELETE: Remove data (like canceling your order)

### All API Endpoints

POST /auth/register - Create a new user account. Anyone can call this.
POST /auth/login - Login and receive a JWT token. Anyone can call this.
POST /auth/google - Login with a Google account. Anyone can call this.
GET /products - Get the list of all products with search and filter. Requires login.
POST /products - Add a brand new product to the catalog. Admin only.
POST /products/upload - Upload a CSV dataset file. Admin only.
PUT /products/{id} - Edit an existing product. Admin only.
DELETE /products/{id} - Soft-delete a product. Admin only.
GET /dashboard - Get dashboard summary statistics. Requires login.
GET /analytics - Get detailed revenue and pricing analytics. Requires login.
POST /predictions/price - Get an AI price recommendation. Requires login.
POST /predictions/demand - Get a demand forecast. Requires login.
GET /competitors - Get competitor pricing data. Requires login.
GET /users - List all users in the system. Admin only.

### How Authentication Protects Every Endpoint

1. After login, user receives a JWT token
2. Frontend stores this token in localStorage
3. For every API call, the frontend adds the token to the request header:
   Authorization: Bearer [jwt_token_here]
4. Backend reads this header
5. Backend verifies the signature of the token using the SECRET_KEY
6. Extracts user_id, email, and role from the token
7. If role is "Admin" - allow full access to all features
8. If role is "Viewer" - allow read-only access only
9. If no token or invalid token - return 401 Unauthorized error

---

## 17. Complete Workflow - End to End

This is the complete story of how we built PricePilot AI from nothing to a live deployed platform:

### Phase 1: Foundation Setup
Create GitHub repository and set up project folder structure.
Write docker-compose.yml so the whole system can start with one command locally.
Initialize the FastAPI Python backend with a basic health check endpoint.
Initialize the React frontend with Vite.

### Phase 2: Database Design
Define all SQLAlchemy models (Python classes that represent database tables):
- User model, Role model, Product model, ProductCatalog model, CompetitorPrice model
Run Alembic migrations to create all tables in PostgreSQL.
Test the database connection using the /test-db endpoint.
Set up the auto-create admin system (when the backend starts for the first time, it creates the default admin account admin@pricepilot.com with password "admin").

### Phase 3: Authentication System
Implement bcrypt password hashing in security.py.
Build the /register endpoint that validates email uniqueness and hashes passwords.
Build the /login endpoint that verifies passwords and creates JWT tokens.
Build the /google endpoint for Google OAuth login.
Build the Login and Register pages in React with forms and validation.
Store JWT token in localStorage after successful login.
Add Axios interceptors to automatically attach JWT to every API request.

### Phase 4: Product Management
Build CRUD (Create, Read, Update, Delete) API endpoints for products.
Build the CSV upload endpoint with Pandas data validation.
Create the Product Catalog page in React showing a table of all products.
Add search functionality (search by name or SKU).
Add filter dropdowns (filter by category, brand, status).
Add sort functionality (sort by name, price, category).
Add pagination (20 products per page, navigate with next/prev buttons).
Add the Add Product form (admin only).
Add Edit and Delete buttons (admin only).

### Phase 5: Dataset Upload to Cloud
Prepare the 200,674 row CSV dataset.
Identify and fix column name mismatches (sales_channel needs to become channel).
Write seed_cloud_db.py script that reads CSV in 2000-row chunks.
Run the script and successfully upload all 200,674 rows to the Render PostgreSQL database.
Fix the is_deleted NULL issue discovered after upload (set all NULL values to False in the database and fix the backend query to handle NULLs).

### Phase 6: ML Model Training
Load the full dataset with Pandas.
Perform feature engineering: create lag features, rolling averages, holiday flags.
Split data 80% train, 20% test.
Train XGBoost model using a Scikit-learn Pipeline (Preprocessor + Model).
Evaluate: check MAE, RMSE, R-squared on test set.
Save trained model to optimal_price_pipeline.pkl using Joblib.
Train 4 separate demand forecasting models (for 7, 14, 30, and 90 day horizons).
Save all demand models as .pkl files.

### Phase 7: Prediction API
Build /predictions/price endpoint that loads the XGBoost model and returns price recommendations.
Build /predictions/demand endpoint that loads the demand model and returns forecasts.
Implement business rules: cost floor (10% above cost price minimum), promotion multipliers.
Implement prediction stability calculation using XGBoost tree variance.
Build the Price Prediction page in React with Existing Product and New Product tabs.
Build the Demand Forecast page in React with charts showing predicted units.

### Phase 8: Analytics and Dashboards
Build /dashboard endpoint that aggregates summary statistics from the database.
Build /analytics endpoint with revenue breakdowns by category, brand, region, channel.
Create all React chart components using Recharts.
Build the Executive BI page with deeper analytics and KPI cards.
Build the Profitability Analytics page.

### Phase 9: Competitor Analysis
Build the competitor_prices database model and API endpoints.
Build Amazon and Flipkart API testing pages in React.
Build the Competitors comparison page showing your prices vs competitor prices.

### Phase 10: Deployment to Cloud
Write Dockerfile for the backend Python app.
Write Dockerfile for the frontend React app with Nginx configuration.
Push all code to GitHub.
Connect GitHub repo to Render.com for automatic backend deployment.
Create a PostgreSQL database on Render and configure environment variables.
Connect GitHub repo to Vercel for automatic frontend deployment.
Set VITE_API_URL environment variable in Vercel to point to the Render backend.
Test the live deployment end-to-end.

---

## 18. Milestone Summary and Key Concepts

### Milestone 1 - Weeks 1 and 2: Foundation
Completed: Project architecture designed
Completed: Database schema with all tables created
Completed: JWT authentication system working
Completed: Product CRUD operations working
Completed: Dataset loaded and preprocessed
Completed: Login and Register UI in React built and working

### Milestone 2 - Weeks 3 and 4: AI and ML
Completed: XGBoost price prediction model trained and saved
Completed: Demand forecasting models for 7, 14, 30, and 90 day horizons
Completed: Price Prediction page in React built and connected to API
Completed: Demand Forecast page in React built with charts
Completed: Model confidence and stability scores implemented

### Milestone 3 - Weeks 5 and 6: Analytics and Competitors
Completed: Competitor analysis module built
Completed: Revenue optimization analytics built
Completed: Executive Business Intelligence dashboards built
Completed: Smart Price Advisor feature implemented
Completed: Profitability analytics page built

### Milestone 4 - Weeks 7 and 8: Deployment and Testing
Completed: Docker containerization of both frontend and backend
Completed: Backend deployed on Render cloud platform
Completed: Frontend deployed on Vercel cloud platform
Completed: Cloud PostgreSQL database set up on Render
Completed: All 200,674 rows uploaded to cloud database
Completed: End-to-end testing complete with live URLs

### Key Concepts Glossary

Dynamic Pricing: Prices that change automatically based on supply, demand, competitor prices, and market conditions. Example: Uber surge pricing.

XGBoost: Extreme Gradient Boosting. A powerful machine learning algorithm that builds many decision trees and combines them to make accurate predictions.

JWT: JSON Web Token. A digital ID card given after login that contains user info (encrypted) and is used to prove identity on every API request.

bcrypt: A password hashing algorithm. Takes your password and transforms it into a scrambled string. The transformation is one-way - you cannot reverse it to get the original password.

Hashing: Converting data (like a password) into a fixed-length scrambled string using a mathematical function. You cannot go backwards from hash to original.

REST API: Representational State Transfer. A standard architectural style for building web APIs where each URL represents a resource and HTTP methods define what to do with it.

ORM (Object Relational Mapper): A tool that lets you work with the database using Python objects instead of writing SQL queries directly. SQLAlchemy is our ORM.

Docker: A containerization technology that packages an app with all its dependencies so it runs identically on any machine - your laptop, a test server, or a production cloud server.

Docker Container: A running instance of a Docker image. Like a process that is completely isolated from other processes.

Docker Compose: A tool to define and run multiple Docker containers together using a single YAML configuration file.

CORS (Cross-Origin Resource Sharing): A browser security rule that controls which websites can make API requests to your backend. We configured it to allow our Vercel frontend to call our Render backend.

Feature Engineering: The process of creating new input variables (features) from raw data to help ML models make better predictions. Example: creating a "rolling 4-week sales average" column from raw daily sales data.

Lag Features: Input features that represent past values. For example units_sold_lag_1 is the units sold 1 week ago. Used in time-series forecasting to give the model memory of what happened before.

Soft Delete: Instead of permanently deleting a database record, mark it as deleted with a flag (is_deleted = True). The record stays in the database but is hidden from normal queries.

Alembic: A database migration tool for SQLAlchemy. It tracks changes to your database schema over time and applies them in order - like version control for your database structure.

Chunk Upload: Splitting a large operation (like uploading 200,000 rows) into small pieces (chunks of 2000 rows) to avoid using too much memory at once.

Environment Variables: Configuration values stored outside the code (in the operating system or cloud platform). Used for secrets like database passwords and API keys that should not be in the code repository.

Prediction Pipeline: A Scikit-learn Pipeline that chains multiple steps together. Our pipeline has: Step 1 - Preprocessor (handles missing values, encodes categories), Step 2 - XGBoost Model (makes the prediction).

R-squared (R2): A statistical measure of how well a regression model explains the variance in the data. Value of 1.0 means perfect prediction. Value of 0.0 means the model is no better than predicting the average every time.

SKU (Stock Keeping Unit): A unique identifier code for each product. Example: PROD-001, ELEC-DELL-LAP-001. Used to track individual products in inventory systems.

---

Document created for PricePilot AI - Dynamic Pricing Optimization and Revenue Intelligence Platform
Project by K. Mohammed Sadiq
