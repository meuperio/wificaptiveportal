# Hospital Guest Wi-Fi Captive Portal and Administration System

## Project Structure

```text
/
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── BUILDPLAN.md
├── ARCHITECTURE.md
├── src/
│   ├── main.tsx            # Frontend Entry
│   ├── App.tsx             # Main React Component
│   ├── index.css           # Tailwind CSS
│   ├── server.ts           # Backend Express Server Entry
│   ├── components/         # Reusable React components
│   │   ├── ui/             # Generic UI components (buttons, inputs)
│   │   ├── layout/         # Layout components (navbar, sidebar)
│   │   └── admin/          # Admin portal components
│   ├── pages/              # Page components
│   │   ├── public/         # Public hospital landing page
│   │   ├── wifi/           # Captive portal login
│   │   └── admin/          # Admin dashboard and views
│   ├── api/                # Express API routes
│   │   ├── admin.routes.ts
│   │   ├── wifi.routes.ts
│   │   └── index.ts
│   ├── db/                 # Database abstraction and implementation
│   │   ├── schema.ts       # Database schemas/types
│   │   ├── repositories/   # Interfaces and implementations for entities
│   │   └── index.ts
│   ├── services/           # Core business logic
│   │   ├── radius/         # RADIUS integration
│   │   │   ├── RadiusProvider.ts
│   │   │   ├── MockRadiusProvider.ts
│   │   │   └── GenericRadiusProvider.ts
│   │   ├── network/        # Network Controller integration
│   │   └── auth/           # Admin Authentication service
│   └── utils/              # Helper functions
```

## Application Architecture

The application is a full-stack monolithic application with a clear separation between frontend (React) and backend (Express).

### Frontend (React/Vite)
- **Routing**: `react-router-dom` to manage the public landing page, captive portal, and admin portal.
- **State**: React Context for auth, and standard hooks for local state.
- **Styling**: Tailwind CSS for responsive and clean hospital-appropriate designs.
- **Security**: The frontend never communicates directly with RADIUS. It only calls backend `/api/*` endpoints.

### Backend (Express/Node.js)
- **API Layer**: Exposes RESTful endpoints for validation, authorization, and administrative actions.
- **Service Layer**: 
  - `RadiusProvider` handles network authentication (mock or live).
  - `AuthService` handles admin JWT-based authentication.
- **Data Access Layer (DAL)**: Repository pattern isolating the actual database implementation. This allows the MVP (which can use an in-memory SQLite or mock DB) to be swapped with PostgreSQL (using Drizzle ORM) in the future without changing the business logic.

### Authentication Flow
1. Guest enters Room + Last Name on the Captive Portal.
2. Frontend posts to `/api/v1/wifi/validate`.
3. Backend checks the Room Repository. If valid, generates a temporary identity.
4. Backend calls `RadiusProvider.authenticate()` (and then `authorize()`).
5. Backend returns success/failure to the frontend.
6. Frontend redirects guest to hospital success page or original URL.

## Database Schema (PostgreSQL intended, MVP compatible)

```sql
-- Admin Users
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    patient_last_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, EXPIRED, DISCHARGED
    valid_from TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    max_devices INTEGER DEFAULT 3,
    session_duration_minutes INTEGER DEFAULT 480,
    access_profile VARCHAR(50) DEFAULT 'HOSPITAL-GUEST',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES admin_users(id)
);

-- Wi-Fi Sessions
CREATE TABLE wifi_sessions (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id),
    network_username VARCHAR(100) NOT NULL,
    client_mac VARCHAR(50),
    client_ip VARCHAR(50),
    ssid VARCHAR(100),
    access_point VARCHAR(100),
    nas_identifier VARCHAR(100),
    radius_session_id VARCHAR(100),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    session_status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, DISCONNECTED
    input_bytes BIGINT DEFAULT 0,
    output_bytes BIGINT DEFAULT 0
);

-- Authentication Attempts
CREATE TABLE authentication_attempts (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20),
    client_mac VARCHAR(50),
    client_ip VARCHAR(50),
    ssid VARCHAR(100),
    result VARCHAR(50), -- SUCCESS, INVALID_CREDENTIALS, EXPIRED, DEVICE_LIMIT_REACHED, LOCKED_OUT, RADIUS_FAILURE
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    administrator VARCHAR(100),
    action VARCHAR(100),
    module VARCHAR(50),
    record_id VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50)
);

-- System Settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
