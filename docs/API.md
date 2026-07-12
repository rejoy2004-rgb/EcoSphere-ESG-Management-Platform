# EcoSphere REST API Catalog

All endpoints are prefixed with `/api`. Security uses standard JWT authentication passed via headers: `Authorization: Bearer <TOKEN>`.

---

## 1. Authentication Endpoints

### Register User
- **Endpoint**: `/api/auth/register`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "name": "David Miller",
    "email": "david.miller@ecosphere.com",
    "password": "securepassword123",
    "role": "EMPLOYEE",
    "departmentId": null
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "user-uuid-value",
      "name": "David Miller",
      "email": "david.miller@ecosphere.com",
      "role": "EMPLOYEE",
      "pointsBalance": 0
    }
  }
  ```

### Login Session
- **Endpoint**: `/api/auth/login`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "email": "david.miller@ecosphere.com",
    "password": "securepassword123"
  }
  ```
- **Response** (200 OK): Returns JWT token string and active user data details.

### Active User Profile
- **Endpoint**: `/api/auth/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response** (200 OK): Returns active profile attributes and department details.

---

## 2. Role Authorization Matrix

The table below lists structural privileges by role:

| Feature / Resource Scope | ADMIN | ESG_MANAGER | DEPARTMENT_HEAD | EMPLOYEE |
| :--- | :--- | :--- | :--- | :--- |
| **Master Data Configuration (EFs, Config)** | Write / Read | Read | Read | No Access |
| **Audits & Compliance Management** | Write / Read | Write / Read | Read (Scoped) | No Access |
| **CSR / Challenge Approvals** | Write / Read | Write / Read | No Access | No Access |
| **Volunteering / Challenges Participation** | View All | View All | View Scoped | Write / Read (Own) |
| **Department Score Toggles & Settings** | Write / Read | Read | Read | No Access |
| **Reports Compiler Downloads** | Read All | Read All | Read (Scoped) | No Access |
| **Leaderboard / Achievements Cabinet** | Read | Read | Read | Read |
| **Rewards Redeeming catalog** | Read | Read | Read | Write (Redeem) |
