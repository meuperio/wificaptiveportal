# BUILD PLAN

## Completed Items
  - **Phase 1**: Application structure and database setup
  - **Phase 2 – Guest Portal**: 
    - [100%] WEB-001, WIFI-001, WIFI-002, WIFI-003
    - [100%] WIFI-004 Access/Bandwidth Policy: Extracted access profiles to generic RADIUS attributes (Filter-Id) without hardcoded vendor dependencies.
  - **Phase 3 – Admin Portal**:
    - [100%] ADM-001 Admin Authentication
    - [100%] USR-001 RBAC
    - [100%] ADM-002 Dashboard: Removed static records. Surfaced real Application, Database, and RADIUS health indicators. Dynamically calculated daily trends. Showcased genuine recent connection history.
  - **Phase 4 – Room Management**: [100%] Room Editing and Discharge/Expiry workflows.
  - **Phase 5**: Mock RADIUS integration.
  - **Phase 6 – Sessions & Accounting**: [100%] Session state updates and RADIUS block/disconnect flows.
  - **Phase 7 – RADIUS / Network Layer**: [100%] Implement actual CoA-Request and refactor generic vendor adapter.
  - **Phase 8 – Security**: [100%] API Rate Limiting, Helmet Security Headers, Patient name masking for lower privilege roles, and retention purge.
  - **Phase 9 – Reports / Audit**: [100%] Added date range filters to all logs (Sessions, Auth, Audit) and exported CSVs. Added data retention UI settings.
  - **Phase 10 – Configuration**: [100%] Completed global settings endpoints covering general layout, branding, and RADIUS networking options (including dynamic CoA port configs).

## Remaining Development Items
| Phase                                | Remaining Development Item       | Dev Progress | What is Still Missing in Code                                                                     |
| ------------------------------------ | -------------------------------- | -----------: | ------------------------------------------------------------------------------------------------- |
| **Documentation**                    | BUILDPLAN.md                     |         100% | Update status to reflect actual current implementation                                            |
