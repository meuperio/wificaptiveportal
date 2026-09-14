# BUILD PLAN

## PHASE 1: Application structure and database
- [x] **REQ-PH1-01**: Setup Vite/Express full-stack structure.
- [x] **REQ-PH1-02**: Define database schema and interface repositories.
- [x] **REQ-PH1-03**: Implement mock in-memory database for MVP.
- [x] **REQ-PH1-04**: Seed sample admin account and sample room data.
- **Status**: COMPLETED

## PHASE 2: Guest captive portal
- [x] **WEB-001**: Hospital Public Landing Page layout and styling.
- [x] **WIFI-001**: Guest Wi-Fi Login Portal with Room + Last Name fields.
- [x] **WIFI-002**: Validation Logic and basic API integration.
- [x] **WIFI-003**: Security / Rate Limiting mechanisms (MVP mock).
- **Status**: COMPLETED

## PHASE 3: Admin portal
- [x] **ADM-001**: Admin Login page and session handling.
- [x] **ADM-002**: Admin Dashboard layout and key metrics.
- [x] **USR-001**: Basic RBAC / User roles.
- **Status**: COMPLETED

## PHASE 4: Room management
- [x] **ROOM-001**: Room/Patient List View.
- [x] **ROOM-002**: Add/Edit Room and Patient form (via mock DB).
- [x] **ROOM-003**: Room Status management (Active, Discharged).
- **Status**: COMPLETED

## PHASE 5: Mock RADIUS integration
- [x] **RAD-001**: RADIUS Provider Interface.
- [x] **RAD-003**: Mock RADIUS Mode Implementation.
- [x] **RAD-004**: RADIUS Authentication flow in backend.
- [x] **RAD-005**: Temporary Network Identity generation.
- **Status**: COMPLETED

## PHASE 6: Wi-Fi sessions and accounting
- [x] **SES-001**: Wi-Fi Session Management list.
- [x] **SES-002**: Session Actions (Disconnect, Block).
- [x] **LOG-001**: Authentication Logs view.
- **Status**: COMPLETED

## PHASE 7: Live FreeRADIUS integration
- [ ] **RAD-002**: Live RADIUS support (UDP 1812, 1813, 3799).
- [ ] **NET-002**: Vendor-Neutral Network Adapter structure.
- **Status**: NOT STARTED

## PHASE 8: Security hardening
- [ ] **SEC-001**: Patient Privacy enforcement.
- [ ] **SEC-002**: API Security (rate limiting, auth, sanitation).
- **Status**: NOT STARTED

## PHASE 9: Reporting and audit logs
- [ ] **AUD-001**: System Audit Logs tracking.
- [ ] **RPT-001**: Basic Reporting / Export tools.
- **Status**: NOT STARTED

## PHASE 10: Deployment preparation
- [ ] **CFG-001**: System Configuration UI.
- [ ] **CFG-002**: RADIUS Settings UI.
- [ ] **CFG-003**: Branding Settings.
- **Status**: NOT STARTED
