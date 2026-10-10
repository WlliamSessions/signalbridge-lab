
# SignalBridge Integration Lab

A functional REST API integration project demonstrating customer onboarding, authentication, database operations, error handling, and API troubleshooting.

Built as part of my Sales Engineering portfolio.

## Overview

SignalBridge is a fictional SaaS platform that allows customers to manage account records through a REST API.

The project simulates a common Sales Engineering scenario: a prospective customer needs to integrate its internal systems with a SaaS platform.

Instead of presenting a static integration diagram, SignalBridge provides a working API backed by a PostgreSQL database.

## Business Scenario

A fictional customer wants to automate account management between its internal systems and SignalBridge.

The integration must support:

- Creating customer accounts
- Retrieving customer information
- Updating customer details and subscription plans
- Deleting customer records
- Authenticating API requests
- Validating incoming data
- Returning meaningful errors

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Next.js | REST API route handlers |
| TypeScript | API implementation |
| Supabase | PostgreSQL database |
| Postman | API testing |
| REST / JSON | Client-server communication |
| Bearer tokens | Demo API authentication |
| GitHub | Source control |

## Architecture

    Customer Application / Postman
                  |
                  | HTTP Request + Bearer Token
                  v
           Next.js REST API
           /api/v1/customers
                  |
                  v
          Authentication Check
                  |
                  v
           Request Validation
                  |
                  v
           Supabase Client
                  |
                  v
          PostgreSQL Database
                  |
                  v
            JSON Response

### Request Flow

1. A client sends an HTTP request.
2. The API validates the Bearer token.
3. The API validates request data when applicable.
4. The API performs the database operation through Supabase.
5. The API returns a JSON response and HTTP status code.

## API Endpoints

Local base URL:

`http://localhost:3000/api/v1`

| Method | Endpoint | Description | Success |
|--------|----------|-------------|---------|
| POST | `/customers` | Create customer | 201 |
| GET | `/customers/:id` | Retrieve customer | 200 |
| PATCH | `/customers/:id` | Update customer | 200 |
| DELETE | `/customers/:id` | Delete customer | 200 |

### POST /customers

Creates a new customer.

Example request:

    {
      "email": "alex@northstar.example",
      "firstName": "Alex",
      "lastName": "Morgan",
      "plan": "premium"
    }

A successful request returns `201 Created` and the stored customer record, including a generated ID.

### GET /customers/:id

Retrieves an existing customer by ID.

Successful response: `200 OK`

Example response:

    {
      "id": "cus_example123",
      "email": "alex@northstar.example",
      "firstName": "Alex",
      "lastName": "Morgan",
      "plan": "premium",
      "createdAt": "2026-10-09T19:59:00.000Z"
    }

### PATCH /customers/:id

Updates an existing customer.

Example request:

    {
      "plan": "enterprise"
    }

Supported update fields:

- `firstName`
- `lastName`
- `plan`

Supported subscription plans:

- `standard`
- `premium`
- `enterprise`

Customer IDs and email addresses cannot be modified through PATCH.

### DELETE /customers/:id

Permanently deletes an existing customer.

Successful response: `200 OK`

    {
      "message": "Customer deleted successfully.",
      "id": "cus_example123"
    }

A subsequent GET request for the deleted customer returns `404 Not Found`.

## Authentication

All endpoints require Bearer-token authentication.

Example HTTP header:

    Authorization: Bearer <your-api-key>

The server compares the supplied token against the `SIGNALBRIDGE_API_KEY` environment variable.

Requests without valid credentials return `401 Unauthorized`.

GET, PATCH, and DELETE return the error code `unauthorized`.

POST currently returns the error code `invalid_api_key`.

### Security Considerations

This project uses a single shared API key for demonstration purposes.

A production implementation would require additional controls, such as:

- Per-customer credentials
- Credential rotation and revocation
- Tenant isolation
- Granular authorization
- Rate limiting
- Audit logging
- Monitoring and alerting

Supabase credentials and the demo API key are stored in server-side environment variables.

The Supabase client is imported through a server-only module.

## Error Handling

The API uses structured JSON errors and standard HTTP status codes.

| HTTP Status | Meaning | Example |
|-------------|---------|---------|
| 200 | Successful operation | Customer retrieved |
| 201 | Resource created | Customer created |
| 400 | Invalid request | Unsupported plan |
| 401 | Unauthorized | Missing API key |
| 404 | Not Found | Customer does not exist |
| 409 | Conflict | Duplicate email |
| 500 | Server Error | Database failure |

Example validation error:

    {
      "error": {
        "code": "invalid_plan",
        "message": "Plan must be standard, premium, or enterprise."
      }
    }

## Postman Collection

A reusable Postman collection is included at:

`postman/SignalBridge-API-v1.postman_collection.json`

The collection contains requests for:

- Create Customer
- Get Customer
- Update Customer
- Delete Customer

It uses three configurable variables:

| Variable | Purpose |
|----------|---------|
| `baseUrl` | API server address |
| `customerId` | Customer ID for GET, PATCH, DELETE |
| `apiKey` | Bearer authentication token |

Configure these variables locally before sending requests.

Do not commit actual API credentials to GitHub.

## Testing

The API was manually tested using Postman.

Successful scenarios included:

- Customer creation
- Customer retrieval
- Customer updates
- Customer deletion
- Persistence of updates in Supabase
- Confirmation of deletion through GET
- Authenticated requests

Error scenarios included:

- Duplicate customer email
- Invalid subscription plan
- Updating protected fields
- Empty PATCH requests
- Nonexistent customer IDs
- Missing Bearer tokens

Automated integration tests are a potential future improvement.

## Running Locally

### Prerequisites

- Node.js and npm
- Supabase project
- Postman (recommended)

### 1. Install dependencies

    npm install

### 2. Configure environment variables

Create a `.env.local` file in the project root.

Add:

    SUPABASE_URL=your-supabase-project-url
    SUPABASE_SECRET_KEY=your-supabase-secret-key
    SIGNALBRIDGE_API_KEY=your-demo-api-key

These names match the variables used in `lib/supabase.ts` and `lib/auth.ts`.

Do not commit `.env.local`.

### 3. Configure Supabase

Create a `public.customers` table with the following columns:

| Column | Type | Notes |
|--------|------|-------|
| id | text | Primary key |
| email | text | Unique |
| first_name | text | Required |
| last_name | text | Nullable |
| plan | text | Subscription plan |
| created_at | timestamptz | Default `now()` |

Configure the appropriate database permissions and Row Level Security settings for the server-side database role.

The API's server-side Supabase credentials must be authorized to select, insert, update, and delete customer records.

### 4. Start the development server

    npm run dev

The API will be available at:

`http://localhost:3000/api/v1/customers`

### 5. Test with Postman

Import the included collection and configure:

- `baseUrl`: `http://localhost:3000`
- `customerId`: an existing customer ID
- `apiKey`: the value configured in `.env.local`

Send the requests to test each endpoint.

## Technical Decisions

### Why Next.js?

Next.js provides API route handlers without requiring a separate backend application.

This keeps the project small while demonstrating server-side request handling.

### Why Supabase?

Supabase provides persistent PostgreSQL storage and a JavaScript client.

It allows the API to demonstrate real database operations rather than returning hardcoded responses.

### Why Postman?

Postman makes HTTP requests, authentication headers, JSON payloads, responses, and errors easy to inspect.

It is also useful for customer integration troubleshooting and technical demonstrations.

### Why Bearer Authentication?

Bearer tokens demonstrate a common API authentication pattern.

The project illustrates the importance of validating credentials on the server rather than simply sending them from a client.

## Sales Engineering Skills Demonstrated

- Translating integration requirements into a technical solution
- REST API implementation and testing
- JSON requests and responses
- Bearer-token authentication
- Data validation
- Database integration
- HTTP error handling
- Troubleshooting with Postman
- Technical documentation
- Explaining architecture and data flow
- AI-assisted development

## AI-Assisted Development

This project was developed with AI assistance for code generation, debugging, architecture discussions, and documentation.

My focus was defining the integration scenario, understanding the components, testing functionality, troubleshooting errors, and validating the solution.

## Production Improvements

SignalBridge is a demonstration project, not a production-ready customer management system.

Future improvements could include:

- OAuth 2.0 or per-client API credentials
- Tenant-aware authorization
- Rate limiting
- Automated integration tests
- OpenAPI documentation
- Database migrations
- Centralized logging
- Monitoring and alerting
- Pagination and customer listing
- Webhook notifications
- Deployment and environment management

## Interview Demonstration

A short walkthrough can demonstrate:

1. The fictional customer's business requirements
2. The integration architecture
3. Creating a customer in Postman
4. Retrieving and updating the customer
5. Testing authentication and validation errors
6. Deleting the customer and confirming removal

The project is designed to demonstrate practical API integration, technical discovery, troubleshooting, and solution communication skills.

## Disclaimer

SignalBridge and all example customers and companies are fictional.

This project does not use proprietary employer code, customer information, or internal documentation.
