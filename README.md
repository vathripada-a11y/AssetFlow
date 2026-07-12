# AssetFlow

## Enterprise Asset & Resource Management System

AssetFlow is a centralized Enterprise Asset & Resource Management System (ERP) designed to simplify the complete lifecycle of organizational assets. The platform enables organizations to efficiently manage asset registration, allocation, maintenance, shared resource booking, audits, notifications, and reporting through a secure, role-based, and scalable system.

---

## Project Overview

Traditional asset management often relies on spreadsheets and manual records, making it difficult to track asset ownership, maintenance history, transfers, and audits. AssetFlow provides a digital solution that improves visibility, accountability, and operational efficiency by managing the entire asset lifecycle from a single platform.

---

## Key Features

- Secure Authentication & Role-Based Access Control (RBAC)
- Organization & Department Management
- Asset Registration & Lifecycle Management
- Asset Allocation & Transfer Workflow
- Shared Resource Booking
- Maintenance Request & Approval Workflow
- Periodic Asset Audits
- Reports & Dashboard Analytics
- Notifications & Activity Logs

---

## User Roles

| Role | Responsibilities |
|------|------------------|
| Admin | Manage users, departments, asset categories, and system settings |
| Asset Manager | Register assets, allocate assets, manage transfers and maintenance |
| Department Head | Monitor department assets and approve requests |
| Employee | View assigned assets, request maintenance, and book shared resources |
| Auditor | Verify assets and generate audit reports |

---

## Technology Stack

| Layer | Technology |
|--------|------------|
| Frontend | React (Vite), Material UI, Axios |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT |
| API | REST API |

---

## Core Modules

- Authentication
- Organization Setup
- Asset Management
- Asset Allocation & Transfer
- Resource Booking
- Maintenance Management
- Audit Management
- Reports & Analytics
- Notifications
- Activity Logs

---

## Project Structure

```text
AssetFlow/
│
├── backend/
│   ├── config/
│   ├── middleware/
│   ├── migrations/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── frontend/
│   └── src/
│       ├── api/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       └── utils/
│
└── README.md
```

---

## Prerequisites

Before running the project, ensure you have the following installed:

- Node.js (v18 or later)
- npm
- MySQL Server

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AssetFlow
```

### 2. Database Setup

```bash
mysql -u root -p < backend/migrations/schema.sql
```

### 3. Backend Setup

```bash
cd backend

npm install

cp .env.example .env
```

Update your `.env` file:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=assetflow
DB_USER=root
DB_PASSWORD=your_password

JWT_SECRET=your_secret_key
```

Run the backend server:

```bash
npm run dev
```

Backend URL:

```
http://localhost:5000
```

### 4. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend URL:

```
http://localhost:5173
```

The frontend is configured to communicate with the backend through REST APIs.

---

## First Login

Newly registered users are assigned the **Employee** role by default.

To create an administrator account, run:

```sql
UPDATE employees
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

Alternatively, create a one-time database seed for the administrator account.

---

## Business Rules

- Every asset has a unique Asset Tag.
- Every asset has a unique Serial Number.
- Assets cannot be allocated to multiple users simultaneously.
- Shared resources cannot have overlapping bookings.
- Maintenance requests require approval before processing.
- Assets under maintenance cannot be allocated.
- Closed audit cycles cannot be modified.
- All critical actions are recorded in the activity log.

---

## Development Status

This project is currently under active development as part of the **Odoo Hackathon 2026**.

---

## Future Scope

- QR Code Integration
- RFID Support
- Barcode Scanning
- Mobile Application
- Predictive Maintenance
- Advanced Analytics

---

## License

Developed as part of the **Odoo Hackathon 2026** for educational and innovation purposes.