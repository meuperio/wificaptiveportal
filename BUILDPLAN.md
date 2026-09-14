# BUILD PLAN

## Completed Items
- **Phase 1**: Application structure and database setup
- **Phase 5**: Mock RADIUS integration
- **Phase 2 – Guest Portal**
  - **WIFI-004 Access/Bandwidth Policy**: [100%] Complete profile-management UI/API and translate profile values into RADIUS/controller attributes.
- **Phase 3 – Admin Portal**
  - **ADM-001 Admin Authentication**: [100%] Password-change workflow and production-safe disabling of seeded accounts.
  - **USR-001 RBAC**: [100%] Role-management validation and user-management completeness.

## Remaining Development Items

| Phase                                | Remaining Development Item       | Dev Progress | What is Still Missing in Code                                                                     |
| ------------------------------------ | -------------------------------- | -----------: | ------------------------------------------------------------------------------------------------- |
| **Phase 4 – Room Management**        | ROOM-002 Room Editing            |          95% | Clean persistence/update handling for all editable fields                                         |
|                                      | ROOM-003 Discharge/Expiry        |          95% | Better handling and logging when network disconnect fails                                         |
| **Phase 6 – Sessions & Accounting**  | SES-001 Session Management       |          95% | Complete handling of accounting/interim updates inside application session state                  |
|                                      | SES-002 Disconnect / Block       |          90% | Implement actual `CoA-Request`; current Disconnect-Request exists                                 |
| **Phase 7 – RADIUS / Network Layer** | RAD-002 Live RADIUS              |          90% | Actual CoA implementation remains; refine configurable CoA port                                   |
|                                      | NET-002 Vendor Adapter           |          80% | Cisco/Aruba/Huawei-specific adapter code once target WLAN vendor/model is finalized               |
| **Phase 8 – Security**               | SEC-001 Patient Privacy          |          90% | Complete masking coverage and formal retention/delete handling                                    |
|                                      | SEC-002 API Security             |          85% | Schema validation, security headers, CSRF strategy, tighter secret/configuration handling         |
| **Phase 9 – Reports / Audit**        | AUD-001 Audit                    |          95% | Complete coverage of sensitive operations and retention controls                                  |
|                                      | RPT-001 Reporting                |          95% | Filters/date ranges and final report options                                                      |
| **Phase 10 – Configuration**         | CFG-001 General Configuration    |          90% | Finish remaining operational settings                                                             |
|                                      | CFG-002 RADIUS Configuration     |          90% | Configurable CoA port and secure handling of shared secret                                        |
|                                      | CFG-003 Branding                 |          95% | Minor configuration completeness only                                                             |
| **Documentation**                    | BUILDPLAN.md                     |         100% | Update status to reflect actual current implementation                                            |
