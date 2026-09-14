# PricePilot AI - Mentor Q&A Preparation Guide

Prepare for your mentor session with these 60+ likely questions and simple, clear answers.

---

## SECTION 1 - Project Overview Questions

### Q1: What is PricePilot AI? Explain it in simple words.

PricePilot AI is a web application that helps businesses set the right price for their products using Artificial Intelligence.

Instead of a manager sitting and manually checking competitor prices and guessing what price to use, PricePilot AI automatically analyzes thousands of rows of past sales data, looks at competitor prices, considers current demand and promotions, and recommends the optimal price that will maximize revenue without losing customers.

It has 7 main features: product management, price prediction, demand forecasting, competitor analysis, revenue analytics, executive dashboards, and data upload.

---

### Q2: Why did you choose to build a pricing system specifically?

Pricing is one of the biggest levers businesses have to increase profit. Even a 1% improvement in pricing can increase profit by 8-10% for a typical company. But most small and medium businesses do not have the tools or expertise to price dynamically. They either under-price (and lose potential revenue) or over-price (and lose customers to competitors).

By using AI and historical data, PricePilot AI makes intelligent pricing accessible to any retail or e-commerce business.

---

### Q3: Who would use this platform in a real company?

Pricing Managers: They use the Price Prediction and Smart Price Advisor modules to set and adjust prices.
Business Analysts: They use the Analytics and Executive BI dashboards to understand revenue trends.
Executives and CEOs: They use the Dashboard for a quick overview of business performance.
Data Administrators: They use the Upload Data feature to keep the system's dataset updated.

---

### Q4: What are the 7 main modules in PricePilot AI?

1. User Authentication and Role Management - controls who can login and what they can do
2. Product Catalog and Data Management - manages the list of products and historical sales data
3. Price Prediction - AI model that recommends optimal selling price
4. Demand Forecasting - predicts how many units will be sold in next 7/14/30/90 days
5. Competitor Analysis - compares your prices with competitor prices from Amazon and Flipkart
6. Revenue Optimization and Analytics - shows revenue trends and profit analysis
7. Dashboard and Executive BI - high-level summary for quick business insights

---

### Q5: What is dynamic pricing? Give a real-world example.

Dynamic pricing means prices change automatically based on real-time factors like supply, demand, competition, and time.

Real-world examples:
- Uber: prices go up when there are many ride requests and few drivers (surge pricing)
- Airlines: plane tickets cost more when fewer seats remain
- Amazon: prices change multiple times per day based on competitor prices and demand
- Hotels: room prices spike during festival seasons or big events

Our PricePilot AI does this for retail products by recommending the right price based on current demand, inventory levels, competitor prices, and promotions.

---

## SECTION 2 - Architecture Questions

### Q6: Explain the system architecture of PricePilot AI.

Our system has 4 layers:

Layer 1 - Access Layer (Frontend): The React.js web application hosted on Vercel. This is what users see and interact with in their browser.

Layer 2 - API and Business Logic Layer (Backend): The FastAPI Python application hosted on Render. It handles all requests from the frontend, processes business logic, and communicates with the database and ML models.

Layer 3 - AI/ML Intelligence Layer: XGBoost models for price prediction and demand forecasting. These are trained offline and saved as .pkl files. They are loaded by the backend to make real-time predictions.

Layer 4 - Data Foundation Layer: PostgreSQL database hosted on Render. Stores all users, products, historical sales data, competitor prices, and audit logs.

---

### Q7: Why did you use React.js for the frontend?

React.js is the industry standard for building interactive web applications. It uses a component-based architecture where each part of the UI (like a chart, a table, or a form) is a reusable component. This makes development faster and code more organized.

React also has a virtual DOM which makes updates to the page very fast without reloading the whole page. This gives users a smooth and responsive experience.

---

### Q8: Why did you choose FastAPI for the backend instead of Flask or Django?

FastAPI has several advantages:
1. It is extremely fast - one of the fastest Python web frameworks available
2. It automatically generates API documentation (Swagger UI) at /docs
3. It uses Python type hints which catches errors early during development
4. It has built-in support for async operations
5. It uses Pydantic for automatic data validation - if someone sends wrong data, FastAPI rejects it automatically with a clear error message

---

### Q9: Why PostgreSQL and not MongoDB or SQLite?

PostgreSQL is the best choice for our use case because:
- Our data is structured and relational (products relate to users, orders relate to products)
- We need complex queries with joins, filters, and aggregations for analytics
- PostgreSQL supports ACID transactions (data is always consistent and reliable)
- It handles large datasets well - our 200,674 rows are fine for PostgreSQL
- It is open-source and widely supported on cloud platforms like Render

SQLite was used locally for early development because it requires no setup, but for cloud deployment with multiple users accessing data simultaneously, PostgreSQL is far more robust.

MongoDB would be better if our data was unstructured (like documents or JSON blobs), but our pricing data has a clear, consistent structure with defined columns.

---

### Q10: What is Docker and why did you use it?

Docker is a tool that packages an application along with all its dependencies (libraries, Python packages, environment settings) into a container.

Think of it like this: without Docker, "it works on my computer" is a common problem. Code runs fine locally but breaks on the server because of different Python versions or missing libraries.

With Docker, we package everything the app needs into a container image. When this image runs on any machine (laptop, Render's servers, AWS), it always works the same way.

We used Docker Compose during development to run the frontend container, backend container, and PostgreSQL container together with a single command: docker-compose up.

---

## SECTION 3 - Authentication Questions

### Q11: How does the login system work?

Step 1: User enters email and password on the login page.
Step 2: React frontend sends a POST request to /api/v1/auth/login.
Step 3: Backend finds the user record by email in the PostgreSQL database.
Step 4: Backend uses bcrypt to verify the password. It computes the hash of what the user typed and compares it to the stored hash. If they match, the password is correct.
Step 5: If correct, the backend generates a JWT (JSON Web Token) containing the user's id, email, and role.
Step 6: This JWT is returned to the React frontend.
Step 7: React stores the JWT in localStorage.
Step 8: For every API request after this, React automatically adds the JWT to the request header as "Authorization: Bearer [token]".
Step 9: The backend reads and verifies this token on every request to know who is making the request.

---

### Q12: What is JWT and how does it work?

JWT stands for JSON Web Token. It is a standard format for transmitting information securely between parties.

A JWT has 3 parts separated by dots:
1. Header: contains the algorithm used (we use HS256)
2. Payload: contains the data (user_id, email, role, expiry time)
3. Signature: a cryptographic hash of the header and payload using our SECRET_KEY

When the backend receives a JWT, it uses the SECRET_KEY to verify the signature. If the signature is valid, the token has not been tampered with. If someone changes even one character of the payload, the signature verification fails and access is denied.

JWT is stateless - the backend does not need to look up a database session. All the user information is inside the token itself.

---

### Q13: Why do we store password hashes and not the actual passwords?

If we stored actual passwords and a hacker accessed our database, they would immediately have everyone's passwords. Since people reuse passwords across websites, this could compromise their email, bank accounts, and other services too.

By storing only the bcrypt hash of the password, even if the database is compromised, the hacker gets useless scrambled strings. bcrypt is a one-way function - you cannot reverse a hash to get the original password. The only way to crack it is to try millions of passwords and see which one produces the same hash, which takes enormous computing power.

---

### Q14: What is CORS and why did you configure it?

CORS stands for Cross-Origin Resource Sharing. It is a browser security feature that blocks web pages from making API requests to a different domain than the one they were loaded from.

Our frontend runs at pricepilot-liar.vercel.app and our backend runs at pricepilot-backend-d12m.onrender.com. These are different domains, so by default the browser would block the frontend from calling the backend API.

We configured CORS in FastAPI with allow_origins=["*"] which tells the browser that our backend accepts requests from any origin. This allows our React frontend to successfully communicate with our FastAPI backend.

---

### Q15: What is the difference between Admin and Viewer roles?

Admin role:
- Can view all dashboards and analytics
- Can upload CSV datasets
- Can add new products to the catalog
- Can edit existing products (price, status, description)
- Can soft-delete products
- Can view and manage all users

Viewer role:
- Can only view dashboards, analytics, and product listings
- Cannot upload data, add, edit, or delete products
- Cannot manage users
- Read-only access to all features

This role separation follows the principle of least privilege - users only get the permissions they actually need, reducing the risk of accidental or malicious data changes.

---

## SECTION 4 - Database Questions

### Q16: What tables does your database have and what is each one for?

users table: Stores all registered users with their name, email, hashed password, role, and active status.

roles table: Stores the two role types: Admin and Viewer. Each user has a foreign key linking to their role.

product_catalog table: The master list of 745 unique products. Stores current price, cost price, inventory, brand, category, supplier, and product lifecycle information.

products table: The large historical data table with 200,674 rows. Each row is one product in one time period with its sales, pricing, promotions, inventory, and demand data. Used by ML models.

competitor_prices table: Stores competitor pricing records for market comparison.

dataset_uploads table: An audit log recording every CSV upload - who uploaded it, how many rows, success or failure.

---

### Q17: What is the difference between the products table and the product_catalog table?

product_catalog is the master reference list - it contains one row per unique product (745 rows). Think of it as the menu. It stores the latest current pricing and product metadata.

products is the historical transaction log - it contains 200,674 rows representing each product's sales data across multiple time periods. Think of it as the order history. It is used for analytics and ML training.

When a new CSV is uploaded, new records go into the products table. Simultaneously, the system auto-creates new entries in product_catalog for any brand new product_ids discovered in the CSV that are not already in the catalog.

---

### Q18: What is a soft delete and why do you use it?

A soft delete means marking a record as deleted without actually removing it from the database. We do this by setting is_deleted = True on the product_catalog row.

When the frontend requests products, the backend query adds: WHERE is_deleted = False (or IS NULL). So soft-deleted products are invisible to users but still exist in the database.

We use soft deletes because:
1. The product may have associated historical sales data that we want to keep for analytics
2. If a product was deleted by mistake, we can easily restore it by setting is_deleted back to False
3. It provides an audit trail - we can see what was deleted and when

---

### Q19: What is an ORM? What is SQLAlchemy?

ORM stands for Object Relational Mapper. It is a tool that lets you interact with a relational database using your programming language (Python) instead of writing raw SQL queries.

Without ORM you would write:
SELECT * FROM products WHERE category = 'Electronics' ORDER BY current_price DESC LIMIT 20

With SQLAlchemy ORM you write Python:
db.query(Product).filter(Product.category == 'Electronics').order_by(Product.current_price.desc()).limit(20).all()

Benefits:
- Safer (protects against SQL injection attacks)
- Easier to read and write
- Works with multiple database engines (PostgreSQL, MySQL, SQLite) with minimal code changes

---

### Q20: What is Alembic and why do you need it?

Alembic is a database migration tool for SQLAlchemy.

Imagine you have your app running in production with real user data. Now you need to add a new column to the products table. You cannot just delete and recreate the table - all the data would be lost. And you cannot just add the column manually on the server - it would not be tracked and might be missed on other environments.

Alembic solves this by creating migration scripts - small Python files that describe exactly what changed (added a column, renamed a table, changed a data type). These scripts run in order and transform the database structure step by step.

Running alembic upgrade head applies all pending migrations and brings the database to the latest version.

---

## SECTION 5 - Machine Learning Questions

### Q21: What machine learning algorithm did you use for price prediction and why?

We used XGBoost (eXtreme Gradient Boosting) for price prediction.

Why XGBoost:
1. Excellent performance on tabular/structured data like our pricing dataset
2. Handles missing values automatically
3. Built-in handling of categorical features (with preprocessing)
4. Very fast training and inference compared to deep learning models
5. Provides feature importance scores so we can understand which factors matter most
6. Industry proven for pricing and demand forecasting tasks

We considered and rejected deep learning (LSTM, Neural Networks) because they require much more data, are harder to interpret, and the performance gains would be marginal for our tabular dataset size.

---

### Q22: What is XGBoost? How does it work?

XGBoost is an ensemble learning algorithm based on decision trees and gradient boosting.

Think of it like this:
- A single decision tree is like one employee making a pricing decision based on rules
- XGBoost builds hundreds of these decision trees
- Each new tree focuses on correcting the mistakes of the previous trees
- The final prediction is a weighted combination of all trees

The "gradient" in gradient boosting means each tree is trained to minimize the error (or loss) of the previous trees using calculus gradient descent - the same technique used in neural networks but applied to decision trees.

---

### Q23: What features (inputs) does your price prediction model use?

Our XGBoost price prediction model uses 17 features:

Pricing features: current_price, base_price, cost_price
Market features: demand_index, competitor_price
Inventory features: inventory_level
Promotion features: promotion_type (one-hot encoded)
Product attributes: brand, category, product_lifecycle, launch_year, average_rating, historical_sales
Seasonal features: season
Time features: days_since_launch

---

### Q24: What does the price prediction model actually predict? What is the target variable?

The model predicts a price_multiplier - a number that represents how much to multiply the current price by to get the optimal price.

For example:
- If multiplier = 1.05, the optimal price is 5% higher than current price
- If multiplier = 0.95, the optimal price is 5% lower than current price
- If multiplier = 1.00, the current price is already optimal

We then compute: Optimal Price = Current Price times Multiplier

We predict a multiplier rather than predicting the absolute price directly because:
- It generalizes better across products with very different price ranges
- A model predicting "1.05" works for both a 100 rupee item and a 100,000 rupee item

---

### Q25: How did you train and save the ML model?

Training process:
1. Loaded the 200,674 row dataset using Pandas
2. Selected the 17 input features and the target variable (price multiplier)
3. Created a Scikit-learn Pipeline with:
   - Step 1: ColumnTransformer for preprocessing (StandardScaler for numbers, OneHotEncoder for categories)
   - Step 2: XGBoost regressor
4. Split data: 80% training, 20% testing
5. Trained the pipeline: pipeline.fit(X_train, y_train)
6. Evaluated on test set: calculated MAE, RMSE, R-squared
7. Saved the entire trained pipeline using: joblib.dump(pipeline, 'optimal_price_pipeline.pkl')

At runtime, the backend loads this file once at startup using joblib.load() and uses it for all predictions.

---

### Q26: What are the business rules applied after the ML prediction?

We apply two important business rules after the model makes a raw prediction:

Rule 1 - Cost Floor:
The system must never recommend a price below cost_price times 1.10. This guarantees a minimum 10% profit margin on every recommendation. If the model predicts a price lower than this floor, we override it and set the price to cost_price times 1.10.

Rule 2 - Promotion Multiplier:
If a promotion type is active (like Flash Sale or Festival Offer), we apply a specific discount multiplier to the recommended price:
- Flash Sale: multiply by 0.92 (8% discount)
- Clearance: multiply by 0.90 (10% discount)
- Festival Offer: multiply by 0.95 (5% discount)

After applying the promotion multiplier, we re-check the cost floor to ensure even the discounted price does not go below minimum profit margin.

---

### Q27: What is a Scikit-learn Pipeline and why did you use it?

A Scikit-learn Pipeline chains multiple processing steps into a single object.

Our pipeline has two steps:
1. Preprocessor: handles data preparation (scales numbers, encodes categories)
2. Model: the XGBoost regressor

Why use a pipeline?
- It prevents data leakage during cross-validation (preprocessing is fitted only on training data)
- It makes prediction simpler - you call pipeline.predict(new_data) and preprocessing + prediction happen automatically
- It is easier to save and load as a single .pkl file
- It ensures training and prediction use exactly the same preprocessing steps

Without a pipeline, there is a risk of accidentally fitting the scaler on test data (data leakage), which would give falsely optimistic accuracy metrics.

---

### Q28: What evaluation metrics did you use for the ML models?

We used four metrics:

MAE (Mean Absolute Error): Average absolute difference between predictions and actual values.
Formula: average of |predicted - actual|
Example: MAE = 54 units for 7-day demand forecast means on average we are 54 units off.
Advantage: Easy to understand, in the same units as the target.

RMSE (Root Mean Square Error): Square root of the average squared differences.
Formula: square root of average of (predicted - actual) squared
Example: RMSE = 97 for 7-day forecast.
Advantage: Penalizes large errors more than MAE. Useful to see if there are outlier predictions.

R-squared (R2): Proportion of variance explained by the model.
Range: 0.0 to 1.0. Higher is better.
Example: R2 = 0.77 for 7-day forecast means the model explains 77% of variation in actual demand.

sMAPE (Symmetric Mean Absolute Percentage Error): Average percentage error.
Example: sMAPE = 14.5% means predictions are within 14.5% of actual values on average.
Advantage: Scale-independent, useful when comparing across different products with different price ranges.

---

### Q29: What is feature engineering? What feature engineering did you do for demand forecasting?

Feature engineering is the process of creating new input variables from raw data that help the ML model make better predictions.

For demand forecasting we created:

Lag features (memory of past sales):
- units_sold_lag_1 = units sold 1 week ago
- units_sold_lag_2 = units sold 2 weeks ago
- units_sold_lag_4 = units sold 4 weeks ago
- units_sold_lag_8 = units sold 8 weeks ago

Rolling window features (trends):
- rolling_4w_sales_mean = average units sold in last 4 weeks
- rolling_8w_sales_mean = average units sold in last 8 weeks
- rolling_4w_sales_max = maximum weekly sales in last 4 weeks
- rolling_4w_sales_std = standard deviation of sales in last 4 weeks

Growth features:
- sales_growth_4w = percentage change in sales over last 4 weeks

Calendar features:
- holiday_flag = 1 if this week contains a major holiday, 0 otherwise
- festival_flag = 1 if this is a festival period, 0 otherwise
- week, month, quarter, year, day_of_week, season

Product history features:
- days_since_first_observed = how long has this product been in the dataset

---

### Q30: Why do the demand forecasts for longer horizons (90 days) have lower accuracy?

The further into the future we try to predict, the more uncertain it becomes. This is a fundamental property of time series forecasting.

For 7-day forecast (R2 = 0.77): the model mostly needs to extrapolate from very recent sales data. The lag features (sales 1 week ago) are very recent and strongly correlated with next week's sales.

For 90-day forecast (R2 = 0.39): many things can change in 3 months - competitor promotions, new product launches, economic changes, unexpected events. The model has less relevant recent data and more uncertainty.

It is like weather forecasting - tomorrow's weather is 90% predictable, but the weather in 3 months has much higher uncertainty.

---

## SECTION 6 - Data and Dataset Questions

### Q31: What is the dataset you used? How big is it?

We used a retail pricing and demand dataset called retail_price_optimization_dataset_improved.csv.

It has 200,674 rows and 31 columns.
File size is approximately 46 MB.

Each row represents one product's pricing and sales data for a specific time period (typically weekly records). The dataset covers multiple product categories, brands, regions, and sales channels across different seasons and promotional periods.

---

### Q32: What data cleaning did you have to do before uploading the dataset?

We had to clean the data before it could be inserted into our PostgreSQL database:

1. Column rename: The CSV had a column called sales_channel but our database schema called it channel. We renamed it using Pandas: chunk.rename(columns={'sales_channel': 'channel'}).

2. Column removal: The CSV had day_of_week and month columns. Our database does not have these because they can be computed from the date column. We dropped them to avoid a schema mismatch error.

3. Date parsing: The date column in the CSV was a text string. We parsed it to a proper Python datetime object using pd.to_datetime() so PostgreSQL would store it correctly as a DATE type.

4. Missing value handling: Rows with missing product_id or current_price were dropped because these are critical fields that cannot be null.

5. Negative price removal: Any rows where current_price was negative were dropped as this is invalid business data.

6. Duplicate removal: Exact duplicate rows were removed using df.drop_duplicates().

---

### Q33: Why did you upload the dataset in chunks of 2000 rows instead of all at once?

Render's free tier PostgreSQL database host limits RAM (memory) to 512 MB. Loading the entire 200,674-row CSV into memory at once would require much more RAM than this limit and would crash the upload process.

By reading the CSV in chunks of 2,000 rows using Pandas chunksize parameter (pd.read_csv(file, chunksize=2000)), we process only 2,000 rows in memory at a time. After each chunk is inserted into the database, it is released from memory and the next chunk is loaded.

This way the memory usage stays constant regardless of how large the file is. It is a standard technique for processing large datasets with limited memory resources.

---

### Q34: What is an anti-duplicate check and why did you implement it?

An anti-duplicate check prevents the same data from being inserted twice when a CSV file is uploaded multiple times.

Without this check, if an admin uploaded the same CSV twice, all 200,674 rows would be inserted again, resulting in 401,348 rows with identical data. This would corrupt the analytics (every metric would be doubled) and waste database storage.

Our implementation:
1. Before inserting new rows from the CSV, we query the existing database for all (product_id, date, region, channel) combinations
2. We perform a left-join (merge) between the new CSV data and the existing data
3. We keep only the rows where there is no match in the existing database (left_only rows)
4. Only these new rows are inserted

This ensures idempotent uploads - you can upload the same file multiple times and the data will be correct.

---

## SECTION 7 - Deployment Questions

### Q35: Where is the app deployed and what does the architecture look like in production?

Frontend: Deployed on Vercel. URL is https://pricepilot-liar.vercel.app. Vercel automatically rebuilds and deploys whenever we push to the GitHub repository.

Backend: Deployed on Render.com. URL is https://pricepilot-backend-d12m.onrender.com. Render also auto-deploys from GitHub.

Database: PostgreSQL database hosted on Render. It is a managed database service - Render handles backups, updates, and availability.

ML Models: The .pkl model files are stored inside the Docker container that Render builds. They are loaded into memory when the backend starts.

---

### Q36: What is a Dockerfile and what does ours do?

A Dockerfile is a text file with step-by-step instructions to build a Docker image (like a recipe for creating the container).

Our backend Dockerfile:
1. FROM python:3.12-slim - starts from an official Python 3.12 image (lightweight version)
2. WORKDIR /app - sets the working directory inside the container
3. COPY requirements.txt - copies the dependency list into the container
4. RUN pip install -r requirements.txt - installs all Python dependencies
5. COPY . . - copies all application code into the container
6. CMD uvicorn main:app --host 0.0.0.0 --port 10000 - starts the FastAPI server

Our frontend Dockerfile:
1. FROM node:20-alpine - starts from Node.js image
2. Installs dependencies with npm install
3. Builds the React app with npm run build
4. Then switches to nginx:alpine image
5. Copies the built /dist files into Nginx
6. Nginx serves the static files on port 80

---

### Q37: What are environment variables and why are they important for security?

Environment variables are key-value pairs that configure an application without hardcoding sensitive values in the source code.

If we wrote the database password directly in the Python code and pushed to GitHub, anyone with access to the repository could steal our database credentials. This is a major security risk.

Instead we write: database_url = os.getenv("DATABASE_URL") in the code.
And in the cloud platform (Render), we securely store the actual value of DATABASE_URL.

When the application runs, it reads the value from the operating system environment rather than from the code.

Environment variables we use:
- DATABASE_URL: Full PostgreSQL connection string with username, password, host, and database name
- SECRET_KEY: A long random string used to sign JWT tokens
- ALGORITHM: HS256 (the JWT signing algorithm we use)
- ACCESS_TOKEN_EXPIRE_MINUTES: How long before a JWT token expires (our setting is 480 minutes)

---

### Q38: How does Render auto-deploy work when you push code to GitHub?

1. We connect our GitHub repository to Render through the Render dashboard
2. We configure it to watch for pushes on the K-Mohammad-Sadik branch
3. When we run git push origin K-Mohammad-Sadik, GitHub notifies Render via a webhook (an automatic HTTP notification)
4. Render pulls the latest code from GitHub
5. Render builds a new Docker image using the Dockerfile
6. The new image is tested
7. If successful, Render replaces the running container with the new one
8. The update goes live with zero downtime

This is called Continuous Deployment (CD) - code changes automatically flow to production.

---

### Q39: What is Nginx and why do you use it in the frontend?

Nginx (pronounced "Engine-X") is a high-performance web server.

When we build the React app with npm run build, it creates a collection of static files (HTML, CSS, JavaScript). These files need to be served to users' browsers.

We use Nginx inside the frontend Docker container to serve these static files because:
1. Nginx is extremely efficient at serving static files - far better than Node.js
2. It handles many concurrent users easily
3. It can cache files to serve them faster
4. We configured it to redirect all routes to index.html, which is necessary for React Router (client-side routing) to work correctly

---

## SECTION 8 - Frontend Questions

### Q40: How does React communicate with the FastAPI backend?

React uses Axios (an HTTP client library) to make API calls.

We have a centralized api.js service file that creates an Axios instance with:
- baseURL set to the backend URL (from environment variable VITE_API_URL)
- An interceptor that automatically adds the JWT token to every request header

When a user wants to see the product list, the Products.jsx component calls: api.get('/products?limit=20&page=1')
Axios sends this HTTP GET request to the backend.
The backend processes it and returns JSON data.
React receives the JSON and updates the state, causing the component to re-render with the new data.

---

### Q41: What is the role of context in your React app?

We use React Context API to share the logged-in user's information across all components without having to pass it as props from parent to child at every level.

When a user logs in, we store their JWT token and user profile in the AuthContext. Every component in the app can read from this context. When the user logs out, we clear the context and redirect to the login page.

This avoids "prop drilling" - the problem of passing data through many intermediate components that do not need the data themselves.

---

## SECTION 9 - Technical Concept Questions

### Q42: What is an API endpoint? Give an example from your project.

An API endpoint is a specific URL that the frontend can send a request to and get a specific response from the backend.

Think of it like a form on a website - you fill it in and submit it to a specific address, and you get a specific response.

Example from our project:
- Endpoint: POST /api/v1/auth/login
- What you send: {"email": "admin@pricepilot.com", "password": "admin"}
- What you get back: {"access_token": "eyJhbGci...", "token_type": "bearer", "user": {...}}

Each endpoint has a specific HTTP method (GET for reading, POST for creating, PUT for updating, DELETE for removing) and a specific URL path.

---

### Q43: What is Pydantic and why do you use it in FastAPI?

Pydantic is a data validation library. When the frontend sends data to the backend, Pydantic automatically validates that it matches the expected format.

Example: our UserCreate schema:
- email must be a valid email format
- password must be a string with minimum length 6
- full_name must be a string

If the frontend sends invalid data (like an email without @ sign, or missing the password field), FastAPI automatically rejects the request and returns a clear error message without the bad data ever reaching our database.

This protects our database from invalid data and provides helpful error messages to the frontend developer.

---

### Q44: What is the difference between GET and POST requests?

GET request:
- Used to retrieve/read data
- Parameters go in the URL (visible in browser address bar)
- Can be bookmarked and cached
- Example: GET /products?category=Electronics&limit=20

POST request:
- Used to send/create new data
- Data goes in the request body (not visible in URL)
- Cannot be bookmarked
- Used for login (to not expose password in URL), data creation, ML predictions
- Example: POST /predictions/price with body: {"current_price": 1000, "demand_index": 90}

---

### Q45: What is pagination and how did you implement it?

Pagination means splitting large lists of data into smaller pages so we do not load all data at once.

Without pagination, the products page would try to load all 745 products at once. With slow internet or many users, this would be slow and resource-intensive.

Our implementation:
- Default: 20 products per page
- The frontend sends skip (how many to skip) and limit (how many to return) parameters
- Example: Page 1 = skip=0, limit=20. Page 2 = skip=20, limit=20. Page 3 = skip=40, limit=20
- The backend returns the products for that page plus the total_count
- The frontend shows "Page 1 of 38" and navigation buttons calculated from total_count

---

### Q46: What is CRUD and how is it implemented in your project?

CRUD stands for Create, Read, Update, Delete - the four basic operations on any data.

For products in our system:
- Create: POST /products - admin submits the Add Product form, backend saves to database
- Read: GET /products - loads all products for the catalog page; GET /products/{id} - loads one product
- Update: PUT /products/{id} - admin submits the Edit Product form, backend updates the record
- Delete: DELETE /products/{id} - admin clicks delete, backend sets is_deleted=True (soft delete)

The CRUD functions are organized in the crud_product.py file which contains get_products(), get_product(), create_product(), update_product(), and soft_delete_product() functions.

---

## SECTION 10 - Project Process Questions

### Q47: What challenges did you face during development and how did you solve them?

Challenge 1 - is_deleted NULL bug after bulk upload:
When we uploaded products using seed_cloud_db.py, the is_deleted column was inserted as NULL instead of False. The backend query filtered WHERE is_deleted = False so NULL rows were invisible.
Solution: We ran a direct SQL UPDATE to set all NULLs to False. We also fixed the backend query to treat NULL as False (WHERE is_deleted = False OR is_deleted IS NULL). And we committed the fix to GitHub so Render auto-deployed the patch.

Challenge 2 - Memory limit exceeded during cloud database upload:
Loading all 200,674 rows into RAM at once crashed on Render's free tier (512MB limit).
Solution: We rewrote the upload script to use Pandas chunked reading with chunksize=2000, processing only 2,000 rows in memory at a time.

Challenge 3 - Column name mismatch between CSV and database schema:
The CSV had sales_channel and day_of_week columns that did not exist in our database schema.
Solution: Before inserting, we renamed sales_channel to channel and dropped the mismatched columns using Pandas.

Challenge 4 - JWT authentication not persisting after page refresh:
Users were getting logged out when they refreshed the browser.
Solution: We stored the JWT in localStorage (persistent browser storage) instead of React state (which is reset on refresh).

---

### Q48: How did you test your APIs before the frontend was ready?

We used Postman - a desktop application for testing APIs.

With Postman you can:
- Send GET, POST, PUT, DELETE requests to any URL
- Add request headers (like the Authorization JWT header)
- Send JSON body data
- See the full response including status code and response body
- Save requests in collections to re-use them

FastAPI also automatically generates interactive API documentation at /docs (Swagger UI). You can test all endpoints directly from this web interface without any additional tools.

---

### Q49: How do you handle errors in the application?

Backend error handling:
- We use FastAPI HTTPException to return structured error responses with HTTP status codes
- 400 Bad Request: invalid input data (wrong format, missing fields)
- 401 Unauthorized: no JWT token or invalid token
- 403 Forbidden: valid token but insufficient permissions
- 404 Not Found: requested product or user does not exist
- 500 Internal Server Error: unexpected backend error (database connection failed, etc.)

Frontend error handling:
- Axios intercepts failed requests and shows appropriate error messages to users
- We use try-catch blocks around API calls
- Error messages are displayed in the UI so users understand what went wrong

---

### Q50: What version control practices did you follow?

We used Git for version control with the GitHub repository.

Our workflow:
- All code is in the K-Mohammad-Sadik branch on GitHub
- We commit after completing each feature or fixing each bug
- Commit messages describe what changed (example: "Fix product catalog null is_deleted issue")
- Render and Vercel are connected to this branch for automatic deployment

A .gitignore file prevents sensitive files like .env (containing database passwords) and large files like the dataset CSV from being committed to the repository.

---

## SECTION 11 - Advanced Questions Your Mentor May Ask

### Q51: What is the difference between supervised and unsupervised machine learning? Which type did you use?

Supervised machine learning: The model learns from labeled training data where the correct answer is already known. The model learns to predict the correct output given inputs.

Unsupervised machine learning: The model finds patterns in data without pre-labeled answers. Examples are clustering (grouping similar items) and anomaly detection.

We used supervised machine learning:
- For price prediction: inputs are product features, output (label) is the optimal price multiplier which we computed from historical data
- For demand forecasting: inputs are lag features and product attributes, output (label) is the actual units sold in the forecast period

---

### Q52: What is overfitting? How did you prevent it?

Overfitting happens when a model learns the training data too perfectly - including its noise and random variations. The model performs very well on training data but very poorly on new, unseen data.

Think of it like a student who memorizes all past exam questions word by word instead of understanding the concepts. They ace practice tests but fail on the actual exam with new questions.

How we prevent overfitting:
1. Train-test split: We trained on 80% of data and evaluated on 20% unseen test data. If test performance is much worse than training performance, the model is overfitting.
2. XGBoost hyperparameters: We set max_depth (limits tree complexity) and n_estimators to reasonable values, preventing the model from memorizing every data point.
3. Cross-validation: We used time-based cross-validation (chronological splits) for demand forecasting to simulate real-world prediction scenarios.

---

### Q53: What is a REST API? What makes it RESTful?

REST (Representational State Transfer) is an architectural style for designing web APIs that defines constraints:

1. Client-Server separation: Frontend and backend are independent. They communicate only through the API.
2. Stateless: Each request contains all information needed. The server does not remember previous requests. (This is why we include the JWT token in every request.)
3. Uniform Interface: Standard HTTP methods (GET, POST, PUT, DELETE) are used with meaningful URLs that represent resources.
4. Resources: Everything is a resource with a URL. /products represents the products collection. /products/5 represents the product with id=5.
5. JSON: Data is exchanged in JSON format (though XML is also supported in REST).

Our API follows these principles, making it a RESTful API.

---

### Q54: What is Uvicorn and how is it related to FastAPI?

FastAPI is a web framework - it defines how to write API endpoints, handle requests, and send responses.

Uvicorn is an ASGI server - it is the actual runtime that receives HTTP connections and passes them to FastAPI for processing.

Think of it like:
- FastAPI is the chef who knows how to cook (process requests)
- Uvicorn is the restaurant that receives customers and sends them to the chef

When we run: uvicorn main:app --host 0.0.0.0 --port 10000
We are starting the Uvicorn server, telling it to find the FastAPI app object in the main.py file, listen on all network interfaces (0.0.0.0), and accept connections on port 10000.

---

### Q55: What is a foreign key in a database?

A foreign key is a column in one table that refers to the primary key of another table. It creates a relationship between two tables.

In our database:
- The users table has a role_id column
- role_id is a foreign key that refers to the id column in the roles table
- This means every user must have a valid role that exists in the roles table

This enforces data integrity - you cannot have a user with a role_id that does not exist in the roles table. The database will reject such an insert.

Foreign keys are how relational databases model real-world relationships: a user belongs to a role, a product belongs to a category, an order belongs to a user.

---

### Q56: What is the lifecycle of a request in your system?

Here is the complete journey of a single API request from user action to response:

1. User clicks "Predict Price" button on the React frontend
2. React collects form data (product info, market conditions)
3. Axios sends POST request to https://pricepilot-backend.onrender.com/api/v1/predictions/price with JWT in header
4. The HTTP request travels over the internet to Render's servers
5. Uvicorn (the ASGI server) receives the connection
6. FastAPI reads the request and routes it to the correct endpoint function in predictions.py
7. FastAPI middleware verifies the JWT token (extracts user_id and role)
8. The endpoint function validates the request body with Pydantic schema
9. The function calls predictor.predict(feature_dict) in the ML layer
10. The Predictor class loads features into a Pandas DataFrame
11. The XGBoost Pipeline processes the features and returns a price multiplier
12. Business rules are applied (cost floor, promotion discount)
13. The prediction stability score is calculated
14. The endpoint returns a JSON response with recommended price and confidence
15. FastAPI serializes the response to JSON
16. Uvicorn sends the HTTP response back to the client
17. Axios receives the response and updates React state
18. React re-renders the component showing the price recommendation to the user

Total time: typically under 200 milliseconds

---

### Q57: What would you improve if you had more time?

1. Real-time competitor price scraping: Currently competitor prices are manual or via basic API tests. I would build automated scraping of Amazon and Flipkart prices that updates every few hours.

2. A/B price testing module: A feature to test two prices simultaneously on different customer segments and measure which price generates more revenue.

3. Automated retraining: Set up a scheduled job that automatically retrains the ML models monthly with new sales data, so the model stays accurate as market conditions change.

4. Price alerting: Email or notification system that alerts pricing managers when a competitor drastically changes their price on a key product.

5. Mobile app: A mobile-friendly interface for pricing managers to check recommendations on the go.

6. More advanced demand forecasting: Incorporate external signals like Google Trends data, weather forecasts, and economic indicators to improve forecast accuracy.

---

### Q58: How does the prediction_stability score work?

The prediction stability score measures how confident we are in the price prediction.

Technical explanation:
1. XGBoost builds multiple decision trees (n_estimators = typically 100-300 trees)
2. We run the prediction through an increasing subset of trees (1 tree, 10 trees, 20 trees, ... all trees)
3. We collect all these intermediate predictions in a list (tree_preds)
4. We calculate the standard deviation of these intermediate predictions
5. We compute the coefficient of variation (CV) = standard deviation divided by the mean prediction
6. We map CV to a 0-100 stability score:
   - CV < 0.001 means prediction was very stable across all trees → score close to 100%
   - CV > 0.05 means high variance across trees → score closer to 50%

Essentially: if all trees agree strongly on the same prediction, the confidence is high. If trees give wildly different predictions and XGBoost is averaging them out, confidence is lower and we should be cautious.

---

### Q59: What is the GENUINE_DATA_CUTOFF in the demand forecasting code?

This is a very important data integrity concept.

Our dataset was found to contain both genuine historical data (actual past sales recorded in real time) and simulated future data (generated programmatically to fill gaps).

After a thorough data provenance audit, we determined that the genuine historical data boundary is 2026-08-10. Data records after this date are simulated.

Why this matters: if we trained the demand forecasting model on simulated data without knowing it, the model would learn the patterns of the data generator rather than real market patterns. Its accuracy metrics would be artificially inflated and it would perform poorly on real future predictions.

Therefore GENUINE_DATA_CUTOFF = "2026-08-10" is hardcoded as a constant to ensure training and validation always use only genuine historical data.

---

### Q60: How would you scale this system if it had 10,000 concurrent users?

Currently the system runs on Render's free tier which is limited in resources. For 10,000 concurrent users:

1. Upgrade to paid cloud instances with more CPU and RAM
2. Add a load balancer to distribute traffic across multiple backend instances
3. Add Redis caching layer to cache frequently requested data (like dashboard statistics) so the database is not queried on every request
4. Use a CDN (Content Delivery Network) to serve frontend static files from servers closer to users globally
5. Consider read replicas for the PostgreSQL database (separate servers that handle read-only queries so the main database only handles writes)
6. Add horizontal auto-scaling on the backend (Render or AWS automatically spins up more instances when traffic is high and scales down when traffic is low)
7. Move ML model serving to a dedicated model serving platform (like AWS SageMaker) for better performance and scalability

---

*End of Q&A Preparation Guide*

*PricePilot AI - Dynamic Pricing Optimization and Revenue Intelligence Platform*
*Project by K. Mohammed Sadiq*
