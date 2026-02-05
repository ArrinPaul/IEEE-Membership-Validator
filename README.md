# IEEE VALIDATOR: Institutional Membership Intelligence

IEEE VALIDATOR is a high-performance, enterprise-grade ecosystem designed to empower IEEE Student Branches and Sections with data-driven membership management. This platform bridges the gap between raw membership data and actionable institutional intelligence.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-teal)

## Strategic Objective

The primary mission of the IEEE VALIDATOR is to ensure operational integrity within IEEE student organizations. By providing a centralized, secure, and intuitive interface, the platform enables chapter leaders to:
- **Verify Credentials**: Instantaneously validate student and professional memberships for event eligibility.
- **Analyze Trends**: Understand growth patterns and renewal cycles through advanced visualization.
- **Maintain Compliance**: Ensure that access to exclusive IEEE resources is restricted to active, verified members.
- **Optimize Outreach**: Utilize demographic insights to tailor chapter activities to the needs of the local technical community.

## Core Architecture

### Identity and Access Governance
- **Public Layer**: Controlled access for individual membership lookups without exposing sensitive datasets.
- **Operational Layer (Volunteers)**: Standardized tools for event check-ins and member verification.
- **Executive Layer (Admins)**: Full oversight of the data lifecycle, system configuration, and user role distribution.

### Intelligent Analytics Suite
- **Membership Health**: Real-time breakdown of Active vs. Expired status across the entire chapter.
- **Retention Forecasting**: Automated tracking of memberships approaching their 30-day expiration threshold.
- **Institutional Mapping**: Geographic and academic distribution analysis to identify growth opportunities within departments.

### Data Ecosystem
- **Seamless Ingestion**: Robust support for CSV and Excel (.xlsx, .xls) files with intelligent column mapping.
- **Automated Lifecycle Management**: Dynamic calculation of expiry dates based on IEEE's standard renewal windows.
- **Secure Persistence**: Optional integration with Neon (PostgreSQL) for immutable audit trails and historical logging.

## Technical Specification

- **Framework**: Next.js 15 (App Router Architecture)
- **Language**: TypeScript (Type-safe operations)
- **UI Design**: Tailwind CSS + shadcn/ui (Accessible, high-fidelity components)
- **Identity Provider**: Clerk (Secure JWT-based authentication)
- **Data Engine**: Recharts for visualization & XLSX for industrial-grade file parsing.

## Deployment and Setup

### Prerequisites
- Node.js 18.x or later
- Valid Clerk API credentials
- Optional: PostgreSQL connection string (Neon recommended)

### Installation Sequence
1. **Clone and Initialize**:
   ```bash
   git clone https://github.com/yourusername/ieee-membership-validator.git
   cd ieee-membership-validator
   ```
2. **Environment Configuration**:
   Create a `.env.local` file:
   ```env
   # Clerk Authentication Configuration
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...

   # Vercel Blob Storage (Required for persistent file storage)
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

   # Database Persistence (Required for cloud storage)
   DATABASE_URL=postgresql://...
   ```
3. **Build and Launch**:
   ```bash
   npm install
   npm run dev
   ```
   Access the system at `http://localhost:9002`.

## Data Ingestion Protocol

To maintain system accuracy, datasets must contain the following identifiers. The system is designed to be resilient to column order variations.

| Identifier | Status | Purpose |
|:---|:---:|:---|
| **Member Number** | ✅ | Primary key for identification |
| **First Name** | ✅ | Identity verification |
| **Last Name** | ✅ | Identity verification |
| **Email Address** | ✅ | Communication and unique mapping |
| **IEEE Status** | ✅ | Tiered access control |
| **Renew Year** | ✅ | Expiry cycle calculation |
| **Region** | ✅ | Geographic reporting |
| **Section** | ✅ | Regional governance tracking |
| **School Name** | ✅ | Academic affiliation |
| **Grade** | ✅ | Professional/Student tiering |

### Optional Attributes
The following fields can be included for richer reporting but are not required for core system logic:
- `Middle Name`, `Gender`, `School Section`, `Active Society List`, `Technical Community List`, `Special Interest Group List`.

## Role Administration

Governance is managed via Clerk Public Metadata. Assign roles to user IDs to grant elevated access:
- **Admin**: `{ "role": "admin" }` — Full system control.
- **Volunteer**: `{ "role": "volunteer" }` — Verification and operational access.

## License and Acknowledgments

- Licensed under the **MIT License**.
- Developed to support the **IEEE** global technical community.
- Built with the support of **Vercel**, **Clerk**, and the open-source community.
