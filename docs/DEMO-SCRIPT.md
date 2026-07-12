# EcoSphere 5-Minute Hackathon Demo Script

Follow this step-by-step script to showcase all completed ESG and gamification features during the live project demonstration.

---

## 1. Administrative Setup (1 Minute)
* **Objective**: Show configuration controls, weight settings, and master data hierarchies.
* **Steps**:
  1. Open the browser and go to the Login screen.
  2. Log in using the **Admin** credentials:
     - **Email**: `admin@ecosphere.local`
     - **Password**: `admin123`
  3. Navigate to the **Settings** page from the sidebar:
     - Show the **ESG weights sliders** (Environmental: 40%, Social: 30%, Governance: 30%). Adjust them and demonstrate that the client blocks saving if the weights do not sum to exactly 100%.
     - Show the **System Toggles** for:
       - Auto Emission Calculation (automatic calculation on ledger entry).
       - Evidence Requirement (blocks approvals if proofs are missing).
       - Badge Auto Award (triggers badges dynamically on criteria).
     - Show the **Notification Channel Matrix** (Matrix of CSR, Challenge, and Policy triggers mapped to In-App/Email).
     - Show **Departments & Categories Management** tables where hierarchies are organized.
  4. Click Logout.

---

## 2. Employee Participation (1.5 Minutes)
* **Objective**: Register for a challenge, make progress, and upload completion evidence.
* **Steps**:
  1. Log in using the **Employee** credentials:
     - **Email**: `employee@ecosphere.local`
     - **Password**: `employee123`
  2. Navigate to the **Gamification** tab:
     - Select the **Challenges** view.
     - Find an active challenge (e.g., "Zero-Waste Week") and click **Join Challenge**.
  3. Submit proof of completion:
     - Find your joined challenge under **My Challenges**.
     - Click **Upload Proof**, select a file (e.g., an image of receipt/compliance check), and click **Submit**.
     - The status updates to `PENDING` approval.
  4. Click Logout.

---

## 3. Manager Verification & Badge Unlocks (1.5 Minutes)
* **Objective**: Verify volunteer/challenge proofs, trigger auto-awards, and view notification feeds.
* **Steps**:
  1. Log in using the **ESG Manager** credentials:
     - **Email**: `manager@ecosphere.local`
     - **Password**: `manager123`
  2. Navigate to the **Gamification** (or **Social**) page:
     - Go to the **Approval Queue** tab.
     - Locate the Employee's submitted proof.
     - Click **Approve**.
     - *System Logic*: If the "Evidence Required" setting was enabled, clicking approve without a proof file would trigger an alert blocking the action.
  3. View Notifications & Badges:
     - Click the **Bell icon** in the top right header to show the notifications dropdown list.
     - Locate the unread message: *"Your participation was approved and 50 points awarded"*.
     - Verify that the employee was automatically awarded the corresponding badge (e.g. "Zero Waste Hero") in their profile.
  4. Click Logout.

---

## 4. Leaderboard & Score Integration (1 Minute)
* **Objective**: Show point ledgers and overall dashboard score updates.
* **Steps**:
  1. Log in as **Employee** to show point balances:
     - Notice the point balance in the top header has increased (e.g. "+50 XP").
     - Navigate to the **Gamification** tab, and select **Leaderboard**.
     - Verify that the employee's ranking has risen based on the newly approved points.
  2. Go to the **Dashboard** page:
     - Point out the updated **Overall ESG Score** gauge.
     - Note the updated **Environmental/Social/Governance averages** in the cards, which reflect the new ESG scores recalculations.
     - Point out the monthly trend line rising.

---

## 5. Exporters & Disclosures (30 Seconds)
* **Objective**: Generate summary reports.
* **Steps**:
  1. Navigate to the **Reports** page.
  2. Select **ESG Comprehensive Summary** from the report selector.
  3. Filter by department or date range:
     - Point out the **Live Dataset Preview** table showing counts of carbon records, CSR activities, and audits.
  4. Click **Export PDF** (or Excel/CSV).
  5. The browser will instantly trigger a file download of the generated document.
