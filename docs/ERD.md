# EcoSphere Master Data Entity-Relationship Diagram (ERD)

This document contains the Entity-Relationship Diagram (ERD) covering the 8 Master Data models defined in the EcoSphere backend using Prisma.

```mermaid
erDiagram
    Department {
        string id PK
        string name
        string code UK
        string headId
        string parentDepartmentId FK
        int employeeCount
        Status status
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        string id PK
        string name
        CategoryType type
        Status status
        DateTime createdAt
        DateTime updatedAt
    }

    EmissionFactor {
        string id PK
        EmissionActivityType activityType
        string unit
        Decimal co2eFactor
        string source
        DateTime validFrom
        DateTime validTo
        Status status
        DateTime createdAt
        DateTime updatedAt
    }

    ProductESGProfile {
        string id PK
        string productName
        Decimal carbonFootprintPerUnit
        string sustainabilityRating
        string materialComposition
        string[] certifications
        Status status
        DateTime createdAt
        DateTime updatedAt
    }

    EnvironmentalGoal {
        string id PK
        string title
        string description
        string departmentId FK
        string metricType
        Decimal targetValue
        Decimal currentValue
        string unit
        DateTime startDate
        DateTime targetDate
        GoalStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    ESGPolicy {
        string id PK
        string title
        string description
        PolicyCategory category
        string version
        DateTime effectiveDate
        string attachmentUrl
        boolean mandatoryAcknowledgement
        PolicyStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    Badge {
        string id PK
        string name
        string description
        Json unlockRuleJson
        string iconUrl
        DateTime createdAt
        DateTime updatedAt
    }

    Reward {
        string id PK
        string name
        string description
        int pointsRequired
        int stock
        RewardStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    Department ||--o{ Department : "childDepartments (parentDepartmentId)"
    Department ||--o{ EnvironmentalGoal : "environmentalGoals"
```
