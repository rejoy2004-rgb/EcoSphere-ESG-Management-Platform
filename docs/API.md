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
