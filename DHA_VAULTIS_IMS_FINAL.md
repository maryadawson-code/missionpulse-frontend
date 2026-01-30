# DHA VAULTIS Data Governance Services
## Integrated Master Schedule (IMS)
### Solicitation HT001126RE011

---

**Contract:** Firm Fixed Price (FFP)  
**Award Date:** February 2, 2026  
**Period of Performance:** 12 Months (365 Days)  
**End Date:** February 1, 2027

---

## GOLDEN THREAD VERIFICATION ✓

All Decision Gate WBS IDs are aligned with Price Volume:

| Gate | DACA | Date | Deliverable | WBS | Status |
|------|------|------|-------------|-----|--------|
| G1 | 60 | Apr 3, 2026 | Interim Inventory | **2.4** | ✓ |
| G2 | 60 | Apr 3, 2026 | Repository Go-Live | **3.7** | ✓ |
| G3 | 60 | Apr 3, 2026 | AoA Criteria Approved | **4.2** | ✓ |
| G4 | 60 | Apr 3, 2026 | Harvesting Plan | **5.5** | ✓ |
| G5 | 90 | May 4, 2026 | Lifecycle Playbook (Opt) | **11.1** | ✓ |
| G6 | 180 | Aug 1, 2026 | Final Inventory | **2.8** | ✓ |
| G7 | 180 | Aug 1, 2026 | AoA Report | **4.7** | ✓ |
| G8 | 180 | Aug 1, 2026 | Federation Live | **7.5** | ✓ |
| G9 | 270 | Oct 30, 2026 | Usability Complete | **8.4** | ✓ |
| CLOSE | 365 | Feb 1, 2027 | Contract Complete | **9.3** | ✓ |

---

## INTEGRATED MASTER SCHEDULE

### WBS 1.0: PROGRAM MANAGEMENT & OVERSIGHT

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 1.0 | Program Management & Oversight | 365d | 02/02/26 | 02/01/27 | — | PM |
| 1.1 | Project Planning & Post-Award Kickoff | 20d | 02/02/26 | 02/21/26 | — | PM |
| 1.2 | Ongoing PM & COR Coordination | 365d | 02/02/26 | 02/01/27 | 1.1 SS | PM |
| 1.3 | Monthly Reporting (11 reports) | 330d | 03/04/26 | 02/01/27 | 1.1 FS | PM |
| 1.4 | Quarterly Reviews - DHHQ (4) | 300d | 04/03/26 | 02/01/27 | 1.1 FS | PM |
| 1.5 | Quality Assurance | 365d | 02/02/26 | 02/01/27 | 1.1 SS | QA |

---

### WBS 2.0: OBJECTIVE 1 - BASELINE DATA INVENTORY

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 2.0 | Objective 1: Baseline Data Inventory | 180d | 02/10/26 | 08/01/26 | 1.1 FS | Sr. SME |
| 2.1 | Inventory Planning & Schema Development | 15d | 02/10/26 | 02/24/26 | 1.1 FS | TL |
| 2.2 | Tier Classification & Prioritization | 10d | 02/17/26 | 02/28/26 | 2.1 SS+5d | Sr. SME |
| 2.3 | Data Owner/Steward Identification | 20d | 02/24/26 | 03/20/26 | 2.2 SS+5d | BA |
| **2.4** | **Tier 1 Deep-Dives (10 systems) - DHHQ** | **30d** | **03/02/26** | **04/03/26** | 2.2 FS | Sr. SME |
| — | Gov Review: Interim Inventory | 10d | 03/20/26 | 04/02/26 | 2.4 SS+15d | PM |
| **G1** | **★ MILESTONE: Interim Inventory (60 DACA)** | **0d** | **04/03/26** | **04/03/26** | 2.4 FS | DHA |
| 2.5 | Tier 2 Archival System Documentation | 40d | 04/06/26 | 05/29/26 | G1 FS+3d | Analyst |
| 2.6 | Tier 3 Standard System Crawling | 35d | 05/04/26 | 06/19/26 | 2.5 SS+20d | Auto Eng |
| 2.7 | SME Validation Sessions | 20d | 06/08/26 | 07/03/26 | 2.6 SS+25d | Sr. SME |
| **2.8** | **Final Validation & DHA-EDC Mapping** | **20d** | **07/06/26** | **08/01/26** | 2.7 FS | Analyst |
| — | Gov Review: Final Inventory | 10d | 07/18/26 | 07/31/26 | 2.8 SS+8d | PM |
| **G6** | **★ MILESTONE: Final Inventory (180 DACA)** | **0d** | **08/01/26** | **08/01/26** | 2.8 FS | DHA |

---

### WBS 3.0: OBJECTIVE 2 - INTERIM REPOSITORY

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 3.0 | Objective 2: Interim Centralized Repository | 210d | 02/17/26 | 10/30/26 | 2.1 SS+5d | Cat Spec |
| 3.1 | Repository Architecture Design | 10d | 02/17/26 | 02/28/26 | 2.1 SS+5d | TL |
| 3.2 | SharePoint Site Provisioning (GCC-H) | 8d | 03/02/26 | 03/11/26 | 3.1 FS | Cat Spec |
| 3.3 | Power Apps Intake Form Development | 12d | 03/09/26 | 03/24/26 | 3.2 SS+5d | Cat Spec |
| 3.4 | Power Automate Workflow Configuration | 10d | 03/16/26 | 03/27/26 | 3.3 SS+5d | Cat Spec |
| 3.5 | RBAC & Security Configuration | 5d | 03/23/26 | 03/27/26 | 3.4 SS+5d | Cat Spec |
| 3.6 | Power BI Dashboard Development | 8d | 03/24/26 | 04/02/26 | 3.5 SS | Cat Spec |
| **3.7** | **Repository Go-Live & Initial UAT** | **5d** | **03/30/26** | **04/03/26** | 3.6 SS+4d | Cat Spec |
| — | Gov Review: Repository UAT | 10d | 03/24/26 | 04/02/26 | 3.7 SS | PM |
| **G2** | **★ MILESTONE: Repository Go-Live (60 DACA)** | **0d** | **04/03/26** | **04/03/26** | 3.7 FS | DHA |
| 3.8 | Sustained Operations & Optimization | 150d | 04/06/26 | 10/30/26 | G2 FS+3d | Analyst |

---

### WBS 4.0: OBJECTIVE 3 - AoA FOR DHA-EDC

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 4.0 | Objective 3: AoA for DHA-EDC | 158d | 02/24/26 | 08/01/26 | 2.2 FS | TL |
| 4.1 | AoA Methodology & Framework Development | 12d | 02/24/26 | 03/09/26 | 2.2 FS | TL |
| **4.2** | **Evaluation Criteria & Weighting** | **15d** | **03/05/26** | **03/25/26** | 4.1 SS+8d | Sr. SME |
| — | Gov Review: AoA Criteria | 10d | 03/20/26 | 04/02/26 | 4.2 SS+10d | PM |
| **G3** | **★ MILESTONE: AoA Criteria Approved (60 DACA)** | **0d** | **04/03/26** | **04/03/26** | 4.2 FS | DHA |
| 4.3 | Market Scan & Federal Filter (4+ solutions) | 25d | 03/09/26 | 04/10/26 | 4.1 FS | Analyst |
| 4.4 | Detailed Evaluation (Top 5) | 30d | 04/06/26 | 05/15/26 | G3 FS+3d | Sr. SME |
| 4.5 | Empirical Testing (Top 2) | 35d | 05/05/26 | 06/20/26 | 4.4 SS+20d | TL |
| 4.6 | Life Cycle Cost Estimate (5-Year TCO) | 20d | 06/09/26 | 07/04/26 | 4.5 SS+25d | BA |
| **4.7** | **Final AoA Recommendation Report** | **20d** | **07/07/26** | **08/01/26** | 4.6 FS | TL |
| — | Gov Review: AoA Report | 10d | 07/18/26 | 07/31/26 | 4.7 SS+8d | PM |
| **G7** | **★ MILESTONE: AoA Complete (180 DACA)** | **0d** | **08/01/26** | **08/01/26** | 4.7 FS | DHA |

---

### WBS 5.0: OBJECTIVE 4 - AUTOMATED HARVESTING

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 5.0 | Objective 4: Automated Metadata Harvesting | 257d | 03/16/26 | 11/27/26 | 3.4 SS | Auto Eng |
| 5.1 | Automated Harvesting Architecture Design | 15d | 03/16/26 | 04/01/26 | 3.4 SS | TL |
| 5.2 | Pipeline Development (Python/SQL/R) | 40d | 03/27/26 | 05/21/26 | 5.1 SS+10d | Auto Eng |
| 5.3 | AI Tool Integration (AskSage/Bedrock) | 30d | 04/20/26 | 05/29/26 | 5.2 SS+15d | Auto Eng |
| 5.4 | Human-in-the-Loop Workflow Configuration | 15d | 05/14/26 | 06/02/26 | 5.3 SS+20d | Cat Spec |
| **5.5** | **Completeness/Accuracy/Frequency Testing** | **15d** | **03/16/26** | **04/03/26** | 5.1 SS+3d | QA |
| — | Gov Review: Harvesting Plan | 10d | 03/20/26 | 04/02/26 | 5.5 SS+3d | PM |
| **G4** | **★ MILESTONE: Harvesting Plan (60 DACA)** | **0d** | **04/03/26** | **04/03/26** | 5.5 FS | DHA |
| 5.6 | Tier 2/3 Automated Deployment | 40d | 06/02/26 | 07/24/26 | 5.4 FS | Auto Eng |
| 5.7 | Drift Detection & Monitoring | 15d | 07/14/26 | 08/01/26 | 5.6 SS+30d | Auto Eng |
| 5.8 | Production Operations | 100d | 08/03/26 | 11/27/26 | 5.7 FS | Analyst |

---

### WBS 6.0: OBJECTIVE 5 - METADATA MANAGEMENT

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 6.0 | Objective 5: Metadata Management Framework | 257d | 03/09/26 | 11/20/26 | 3.3 SS | Sr. SME |
| 6.1 | Metadata Standards & Schema Definition | 15d | 03/09/26 | 03/25/26 | 3.3 SS | Sr. SME |
| 6.2 | Naming Convention Style Guide | 10d | 03/22/26 | 04/02/26 | 6.1 SS+10d | Sr. SME |
| 6.3 | Controlled Vocabulary Definition | 10d | 03/30/26 | 04/10/26 | 6.2 SS+5d | Sr. SME |
| 6.4 | Lifecycle Management Procedures | 12d | 04/06/26 | 04/21/26 | 6.3 SS+5d | Sr. SME |
| 6.5 | Compliance Reporting (HIPAA/DoD) | 150d | 04/21/26 | 10/28/26 | 6.4 SS+10d | Analyst |
| 6.6 | Ongoing Standards Enforcement | 150d | 05/21/26 | 11/20/26 | 6.5 SS+20d | Analyst |

---

### WBS 7.0: OBJECTIVE 6 - METADATA FEDERATION

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 7.0 | Objective 6: Metadata Federation (Advana) | 131d | 05/04/26 | 09/11/26 | 4.4 SS+20d | TL |
| 7.1 | Metadata Exchange Architecture Design | 15d | 05/04/26 | 05/22/26 | 4.4 SS+20d | TL |
| 7.2 | Advana Federated Catalog Mapping | 20d | 05/18/26 | 06/12/26 | 7.1 SS+10d | Sr. SME |
| 7.3 | Upload/Update/Sync Process Development | 25d | 06/02/26 | 07/04/26 | 7.2 SS+10d | Auto Eng |
| 7.4 | Manual Upload to Advana (Baseline) | 10d | 06/30/26 | 07/13/26 | 7.3 SS+20d | Analyst |
| **7.5** | **Integration Testing** | **15d** | **07/10/26** | **08/01/26** | 7.4 SS+5d | QA |
| — | Gov Review: Federation UAT | 10d | 07/18/26 | 07/31/26 | 7.5 SS+5d | PM |
| **G8** | **★ MILESTONE: Federation Live (180 DACA)** | **0d** | **08/01/26** | **08/01/26** | 7.5 FS | DHA |
| 7.6 | Production Synchronization | 30d | 08/03/26 | 09/11/26 | G8 FS+3d | Analyst |

---

### WBS 8.0: OBJECTIVE 7 - SELF-SERVICE USABILITY

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 8.0 | Objective 7: Self-Service Usability | 197d | 06/15/26 | 12/28/26 | 5.6 SS | BA |
| 8.1 | User Persona Development | 15d | 06/15/26 | 07/03/26 | 5.6 SS | BA |
| 8.2 | UAT Planning & Scenario Design | 15d | 06/30/26 | 07/18/26 | 8.1 SS+10d | QA |
| 8.3 | Phase 1 UAT - Interim Repository | 20d | 07/21/26 | 08/15/26 | 8.2 FS | BA |
| **8.4** | **Usability Improvements Implementation** | **20d** | **10/06/26** | **10/30/26** | 8.3 FS+35d | Cat Spec |
| — | Gov Review: Usability Package | 10d | 10/17/26 | 10/29/26 | 8.4 SS+8d | PM |
| **G9** | **★ MILESTONE: Usability Complete (270 DACA)** | **0d** | **10/30/26** | **10/30/26** | 8.4 FS | DHA |
| 8.5 | Phase 2 UAT - DHA-EDC (if available) | 25d | 09/01/26 | 10/03/26 | 8.3 FS+15d | BA |
| 8.6 | Role-Based User Manuals | 20d | 09/22/26 | 10/17/26 | 8.5 SS+10d | BA |
| 8.7 | Training Materials (SCORM/JKO) | 15d | 10/06/26 | 10/24/26 | 8.6 SS+10d | BA |
| 8.8 | Best Practices Documentation | 12d | 10/20/26 | 10/31/26 | 8.7 SS+8d | Sr. SME |
| 8.9 | Transition & Sustainment Documentation | 15d | 11/02/26 | 11/20/26 | G9 FS+3d | BA |
| 8.10 | Usage Analytics & Monitoring | 40d | 11/09/26 | 12/28/26 | 8.9 SS+5d | Analyst |

---

### WBS 9.0: TRANSITION & CLOSEOUT

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 9.0 | Transition & Closeout | 30d | 01/02/27 | 02/01/27 | 8.10 FS | PM |
| 9.1 | Knowledge Transfer Sessions | 15d | 01/02/27 | 01/22/27 | 8.10 FS | All |
| 9.2 | Final Documentation Package | 10d | 01/13/27 | 01/24/27 | 9.1 SS+8d | BA |
| **9.3** | **Source Code & IP Handover** | **5d** | **01/20/27** | **01/26/27** | 9.2 SS+5d | Auto Eng |
| — | Contract Closeout & CPARS | 5d | 01/27/27 | 01/31/27 | 9.3 FS | PM |
| **CLOSE** | **★ CONTRACT COMPLETE (365 DACA)** | **0d** | **02/01/27** | **02/01/27** | 9.3 FS | DHA |

---

## OPTIONAL CLINs (Start Month 3+)

### WBS 10.0: OPTIONAL OBJ 8 - FEDERATED GOVERNANCE (CLIN 0002)

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 10.0 | Opt Obj 8: Federated Governance | 150d | 04/06/26 | 10/30/26 | G1 FS+3d | Sr. SME |
| 10.1 | Federated Stewardship Pilot Design | 15d | 04/06/26 | 04/24/26 | G1 FS+3d | Sr. SME |
| 10.2 | Pilot Workflow Configuration | 20d | 04/21/26 | 05/15/26 | 10.1 SS+10d | Cat Spec |
| 10.3 | Pilot Execution (2 Data Domains) | 50d | 05/11/26 | 07/15/26 | 10.2 SS+15d | Sr. SME |
| 10.4 | Workforce Assessment & Training | 25d | 07/07/26 | 08/08/26 | 10.3 SS+40d | BA |
| 10.5 | Final Governance Report | 15d | 08/04/26 | 08/22/26 | 10.4 SS+20d | Sr. SME |

### WBS 11.0: OPTIONAL OBJ 9 - DATA PRODUCT LIFECYCLE (CLIN 0003)

| WBS | Task | Duration | Start | Finish | Predecessor | Resource |
|-----|------|----------|-------|--------|-------------|----------|
| 11.0 | Opt Obj 9: Data Product Lifecycle | 128d | 04/06/26 | 08/11/26 | G1 FS+3d | TL |
| **11.1** | **Lifecycle Framework Development** | **20d** | **04/06/26** | **05/01/26** | G1 FS+3d | TL |
| — | Gov Review: Lifecycle Framework | 10d | 04/21/26 | 05/03/26 | 11.1 SS+10d | PM |
| **G5** | **★ MILESTONE: Playbook Draft (90 DACA)** | **0d** | **05/04/26** | **05/04/26** | 11.1 FS | DHA |
| 11.2 | Workflow & Pipeline Pilot | 40d | 05/06/26 | 06/27/26 | G5 FS+2d | Auto Eng |
| 11.3 | Playbook & Documentation | 25d | 06/16/26 | 07/17/26 | 11.2 SS+30d | BA |
| 11.4 | Integration with Repository | 15d | 07/10/26 | 07/28/26 | 11.3 SS+18d | Cat Spec |
| 11.5 | Final Playbook Delivery | 10d | 07/30/26 | 08/11/26 | 11.4 FS | TL |

---

## CRITICAL PATH

```
1.1 → 2.1 → 2.4 → G1 → 2.5 → 2.7 → 2.8 → G6 → 8.3 → 8.4 → G9 → 9.1 → 9.3 → CLOSE
```

---

## BELL CURVE STAFFING ALIGNMENT

| Phase | Months | Avg FTE | Key Activities |
|-------|--------|---------|----------------|
| **RAMP** | M1-M2 | 5.7 | Kickoff (1.1), Schema (2.1), Architecture (3.1, 5.1) |
| **PEAK** | M3-M6 | 9.0 | Tier 1 (2.4), Pipeline Dev (5.2), AI (5.3), Empirical (4.5) |
| **SUSTAIN** | M7-M10 | 7.0 | Federation (7.3), UAT (8.3, 8.5), Training (8.7) |
| **TAPER** | M11-M12 | 4.8 | Analytics (8.10), KT (9.1), Closeout (9.3) |

---

## PARALLEL EXECUTION (30% Time-to-Value)

```
Track A: WBS 2.4 Tier 1 Inventory ────┐
                                      ├──→ Converge at G1 (60 DACA)
Track B: WBS 4.3 AoA Market Scan ─────┘

Track C: WBS 5.2 Pipeline Dev ────────┐
                                      ├──→ Converge at G6 (180 DACA)
Track D: WBS 7.3 API Development ─────┘
```

---

*Prepared in accordance with DI-MGMT-81650 (IMS) | Golden Thread Verified*
