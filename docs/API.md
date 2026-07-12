# EcoSphere Master Data REST API Reference

All requests must be sent to `http://localhost:4000`.

To simulate user authentication, specify the `x-user-role` header with one of the following values:
- `ADMIN`
- `ESG_MANAGER`
- `USER`

---

## 1. Departments

### GET /api/departments
Retrieve a paginated and filtered list of departments.
- **Headers:**
  - `x-user-role: USER`
- **Query Parameters:**
  - `page`: 1
  - `limit`: 5
  - `status`: `ACTIVE`
  - `name`: `Engineering`
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
        "name": "Engineering",
        "code": "ENG-001",
        "headId": "87fa3f79-623c-41ad-bc4e-28b9fb6c81f6",
        "parentDepartmentId": null,
        "employeeCount": 42,
        "status": "ACTIVE",
        "createdAt": "2026-07-12T11:41:22.000Z",
        "updatedAt": "2026-07-12T11:41:22.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 5,
      "totalPages": 1
    }
  }
  ```

### GET /api/departments/:id
Retrieve a single department by ID.
- **Response:**
  ```json
  {
    "id": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
    "name": "Engineering",
    "code": "ENG-001",
    "headId": "87fa3f79-623c-41ad-bc4e-28b9fb6c81f6",
    "parentDepartmentId": null,
    "employeeCount": 42,
    "status": "ACTIVE",
    "createdAt": "2026-07-12T11:41:22.000Z",
    "updatedAt": "2026-07-12T11:41:22.000Z"
  }
  ```

### GET /api/departments/:id/hierarchy
Retrieve the department and all its descendant departments as a tree.
- **Response:**
  ```json
  {
    "id": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
    "name": "Engineering",
    "code": "ENG-001",
    "headId": "87fa3f79-623c-41ad-bc4e-28b9fb6c81f6",
    "parentDepartmentId": null,
    "employeeCount": 42,
    "status": "ACTIVE",
    "createdAt": "2026-07-12T11:41:22.000Z",
    "updatedAt": "2026-07-12T11:41:22.000Z",
    "children": [
      {
        "id": "673f8d29-c89b-432d-9eb5-5f6534563a43",
        "name": "Software Engineering",
        "code": "ENG-SWE",
        "headId": null,
        "parentDepartmentId": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
        "employeeCount": 25,
        "status": "ACTIVE",
        "createdAt": "2026-07-12T11:42:00.000Z",
        "updatedAt": "2026-07-12T11:42:00.000Z",
        "children": []
      }
    ]
  }
  ```

### POST /api/departments
Create a new department.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "name": "Software Engineering",
    "code": "ENG-SWE",
    "parentDepartmentId": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
    "employeeCount": 25,
    "status": "ACTIVE"
  }
  ```
- **Response:** 201 Created

### PUT /api/departments/:id
Update an existing department.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "employeeCount": 28
  }
  ```
- **Response:** 200 OK

### DELETE /api/departments/:id
Soft delete a department.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Response:**
  ```json
  {
    "message": "Department soft deleted successfully",
    "data": {
      "id": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
      "status": "INACTIVE"
    }
  }
  ```

---

## 2. Categories

### GET /api/categories
Retrieve categories, optional filtering by type or status.
- **Query Parameters:**
  - `type`: `CSR_ACTIVITY` or `CHALLENGE`
- **Response:** 200 OK

### GET /api/categories/:id
Retrieve a single category.
- **Response:** 200 OK

### POST /api/categories
Create a new category.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "name": "Tree Plantation Drive",
    "type": "CSR_ACTIVITY",
    "status": "ACTIVE"
  }
  ```
- **Response:** 201 Created

### PUT /api/categories/:id
Update a category.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "name": "Urban Forestation"
  }
  ```
- **Response:** 200 OK

### DELETE /api/categories/:id
Hard delete a category.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Response:** 200 OK

---

## 3. Emission Factors

### GET /api/emission-factors
Retrieve emission factors, optional filtering by status, activityType, and unit.
- **Response:** 200 OK

### GET /api/emission-factors/:id
Retrieve a single emission factor.
- **Response:** 200 OK

### POST /api/emission-factors
Create a new emission factor.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "activityType": "FLEET",
    "unit": "liter",
    "co2eFactor": 2.31,
    "source": "EPA 2026 GHG Inventory Guide",
    "validFrom": "2026-01-01T00:00:00.000Z",
    "status": "ACTIVE"
  }
  ```
- **Response:** 201 Created

### PUT /api/emission-factors/:id
Update an emission factor.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "co2eFactor": 2.35
  }
  ```
- **Response:** 200 OK

### DELETE /api/emission-factors/:id
Hard delete an emission factor.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Response:** 200 OK

---

## 4. Product ESG Profiles

### GET /api/product-esg-profiles
Retrieve product profiles.
- **Response:** 200 OK

### GET /api/product-esg-profiles/:id
Retrieve a single product profile.
- **Response:** 200 OK

### POST /api/product-esg-profiles
Create a new product profile.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "productName": "EcoCharger X1",
    "carbonFootprintPerUnit": 1.45,
    "sustainabilityRating": "Gold",
    "materialComposition": "70% recycled plastic, 30% copper",
    "certifications": ["RoHS", "CarbonNeutral"],
    "status": "ACTIVE"
  }
  ```
- **Response:** 201 Created

### PUT /api/product-esg-profiles/:id
Update a product profile.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Response:** 200 OK

### DELETE /api/product-esg-profiles/:id
Soft delete a product profile.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Response:** 200 OK

---

## 5. Environmental Goals

### GET /api/environmental-goals
Retrieve goals.
- **Response:** 200 OK

### GET /api/environmental-goals/:id
Retrieve a single goal.
- **Response:** 200 OK

### POST /api/environmental-goals
Create a new environmental goal.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Body:**
  ```json
  {
    "title": "Reduce Electricity Consumption",
    "description": "Reduce annual grid electricity consumption in HQ",
    "departmentId": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
    "metricType": "kWh",
    "targetValue": 50000,
    "currentValue": 5000,
    "unit": "kWh",
    "startDate": "2026-01-01T00:00:00.000Z",
    "targetDate": "2026-12-31T23:59:59.000Z",
    "status": "ON_TRACK"
  }
  ```
- **Response:** 201 Created

### PUT /api/environmental-goals/:id
Update a goal.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Response:** 200 OK

### DELETE /api/environmental-goals/:id
Hard delete a goal.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Response:** 200 OK

---

## 6. ESG Policies

### GET /api/esg-policies
Retrieve policies.
- **Response:** 200 OK

### GET /api/esg-policies/:id
Retrieve a single policy.
- **Response:** 200 OK

### POST /api/esg-policies
Create a new policy.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Body:**
  ```json
  {
    "title": "Green Travel Policy",
    "description": "Guidelines for reducing business travel footprint",
    "category": "ENVIRONMENTAL",
    "version": "v1.2",
    "effectiveDate": "2026-07-01T00:00:00.000Z",
    "attachmentUrl": "https://cdn.ecosphere.local/policies/green-travel-v1.2.pdf",
    "mandatoryAcknowledgement": true,
    "status": "PUBLISHED"
  }
  ```
- **Response:** 201 Created

### PUT /api/esg-policies/:id
Update a policy.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Response:** 200 OK

### DELETE /api/esg-policies/:id
Soft delete a policy.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Response:** 200 OK

---

## 7. Badges

### GET /api/badges
Retrieve badges.
- **Response:** 200 OK

### GET /api/badges/:id
Retrieve a single badge.
- **Response:** 200 OK

### POST /api/badges
Create a new badge.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "name": "Carbon Reducer Pro",
    "description": "Unlock this badge by completing 5 challenges",
    "unlockRuleJson": {
      "metric": "COMPLETED_CHALLENGES",
      "operator": ">=",
      "value": 5
    },
    "iconUrl": "https://cdn.ecosphere.local/icons/carbon-pro.png"
  }
  ```
- **Response:** 201 Created

### PUT /api/badges/:id
Update a badge.
- **Role:** `ADMIN`
- **Response:** 200 OK

### DELETE /api/badges/:id
Hard delete a badge.
- **Role:** `ADMIN`
- **Response:** 200 OK

---

## 8. Rewards

### GET /api/rewards
Retrieve rewards.
- **Response:** 200 OK

### GET /api/rewards/:id
Retrieve a single reward.
- **Response:** 200 OK

### POST /api/rewards
Create a new reward.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Body:**
  ```json
  {
    "name": "Solar Water Bottle",
    "description": "Premium insulated bottle with digital temperature display",
    "pointsRequired": 150,
    "stock": 50,
    "status": "ACTIVE"
  }
  ```
- **Response:** 201 Created

### PUT /api/rewards/:id
Update a reward.
- **Role:** `ADMIN`
- **Response:** 200 OK

### DELETE /api/rewards/:id
Soft delete a reward.
- **Role:** `ADMIN`
- **Headers:**
  - `x-user-role: ADMIN`
- **Response:** 200 OK

---

## 9. Carbon Transactions

### GET /api/carbon-transactions
Retrieve a paginated list of carbon transactions.
- **Query Parameters:**
  - `page`: 1
  - `limit`: 10
  - `departmentId`: `e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4`
  - `sourceType`: `FLEET`
  - `from`: `2026-07-01T00:00:00.000Z`
  - `to`: `2026-07-31T23:59:59.000Z`
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "a931a7c3-3069-42b7-bd20-00d939c36209",
        "departmentId": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
        "emissionFactorId": "f7823ab9-bc91-456b-bcde-23498a12bc90",
        "sourceType": "FLEET",
        "quantity": "100.0000",
        "co2eFactor": "2.3100",
        "calculatedCO2e": "231.0000",
        "transactionDate": "2026-07-12T14:25:00.000Z",
        "description": "Weekly delivery fleet fuel usage",
        "createdById": "7fa3f79-623c-41ad-bc4e-28b9fb6c81f6",
        "createdAt": "2026-07-12T14:25:30.000Z",
        "updatedAt": "2026-07-12T14:25:30.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

### GET /api/carbon-transactions/summary
Retrieve a summary of carbon emissions.
- **Query Parameters:**
  - `departmentId`: `e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4`
  - `from`: `2026-07-01T00:00:00.000Z`
  - `to`: `2026-07-31T23:59:59.000Z`
- **Response:**
  ```json
  {
    "totalCO2e": 231,
    "breakdown": {
      "PURCHASE": 0,
      "MANUFACTURING": 0,
      "EXPENSE": 0,
      "FLEET": 231
    }
  }
  ```

### POST /api/carbon-transactions
Create a new manual carbon transaction entry.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Body:**
  ```json
  {
    "departmentId": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
    "sourceType": "FLEET",
    "quantity": 100,
    "unit": "liter",
    "transactionDate": "2026-07-12T14:25:00.000Z",
    "description": "Weekly delivery fleet fuel usage"
  }
  ```
- **Response:** 201 Created

---

## 10. Department Carbon Tracking

### GET /api/departments/:id/carbon
Retrieve time series emissions of a department for charts.
- **Response:**
  ```json
  [
    {
      "date": "2026-07-12",
      "co2e": 231
    }
  ]
  ```

---

## 11. Sustainability Goals Status Recalculation

### PATCH /api/environmental-goals/:id/recalculate
Recalculate goal status based on linear expected progress.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Response:** 200 OK

### Thresholds and Status Derivation Logic:
1. **ACHIEVED**: Progress meets or exceeds target value (`currentValue >= targetValue`).
2. **MISSED**: Target date has passed (`now > targetDate`) and target value is not met.
3. **ON_TRACK**: The progress percentage meets or exceeds the expected progress percentage based on elapsed time:
   - `expectedProgress = (now - startDate) / (targetDate - startDate)`
   - `actualProgress = currentValue / targetValue`
   - Condition: `actualProgress >= expectedProgress`.
4. **AT_RISK**: The progress percentage is behind the expected progress based on elapsed time (`actualProgress < expectedProgress`).

---

## 12. Environmental Dashboard

### GET /api/dashboard/environmental
Retrieve environmental statistics summary.
- **Query Parameters:**
  - `from`: `2026-07-01T00:00:00.000Z`
  - `to`: `2026-07-31T23:59:59.000Z`
- **Response:**
  ```json
  {
    "totalEmissions": 231,
    "emissionsTrend": [
      {
        "date": "2026-07-12",
        "co2e": 231
      }
    ],
    "emissionsByDepartment": [
      {
        "departmentId": "e674b0cc-cd68-45a8-9d8f-9a00ec15f9b4",
        "departmentName": "Engineering",
        "co2e": 231
      }
    ],
    "goalsProgress": {
      "achieved": 0,
      "onTrack": 1,
      "atRisk": 0,
      "missed": 0
    }
  }
  ```

---

## 13. Governance Module

### PATCH /api/policies/:id/publish
Publish an ESG Policy. Auto-creates pending acknowledgements for all active employees if `mandatoryAcknowledgement` is true.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Response:** 200 OK

### GET /api/policies/:id/acknowledgements
Retrieve all acknowledgements of a policy, including employee details.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Response:**
  ```json
  [
    {
      "id": "ack-uuid-1",
      "employeeId": "emp-uuid-1",
      "policyId": "policy-uuid-1",
      "status": "PENDING",
      "acknowledgedAt": null,
      "employee": {
        "id": "emp-uuid-1",
        "name": "John Doe",
        "email": "john@ecosphere.local"
      }
    }
  ]
  ```

### POST /api/acknowledgements/:id/acknowledge
Acknowledge a policy.
- **Headers:**
  - `x-user-id: employee-uuid-1`
- **Response:**
  ```json
  {
    "id": "ack-uuid-1",
    "employeeId": "employee-uuid-1",
    "policyId": "policy-uuid-1",
    "status": "ACKNOWLEDGED",
    "acknowledgedAt": "2026-07-12T14:41:00.000Z"
  }
  ```

### GET /api/me/acknowledgements
Retrieve employee's own acknowledgements list.
- **Headers:**
  - `x-user-id: employee-uuid-1`
- **Response:** 200 OK

### PATCH /api/audits/:id/status
Update the status of an Audit.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Body:**
  ```json
  {
    "status": "IN_PROGRESS"
  }
  ```
- **Response:** 200 OK

### GET /api/compliance-issues?overdue=true
Retrieve overdue compliance issues (status not RESOLVED/CLOSED and dueDate has passed).
- **Response:** 200 OK

### PATCH /api/compliance-issues/:id/status
Update status of a compliance issue.
- **Role:** `ADMIN` or `ESG_MANAGER`
- **Headers:**
  - `x-user-role: ESG_MANAGER`
- **Body:**
  ```json
  {
    "status": "RESOLVED"
  }
  ```
- **Response:** 200 OK

### GET /api/dashboard/governance
Retrieve governance module aggregates.
- **Query Parameters:**
  - `from`: `2026-07-01T00:00:00.000Z`
  - `to`: `2026-07-31T23:59:59.000Z`
- **Response:**
  ```json
  {
    "policyAcknowledgementRate": 75.0,
    "openComplianceIssues": 4,
    "overdueComplianceIssues": 2,
    "auditsCompletedThisPeriod": 1
  }
  ```

