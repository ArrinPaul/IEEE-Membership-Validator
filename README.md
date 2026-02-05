# IEEE Membership Validator

A professional-grade web application designed for the validation and management of IEEE memberships. This system provides a streamlined interface for local chapters to verify member status, analyze chapter growth, and manage datasets efficiently.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-teal)

## Core Capabilities

### Role-Based Access Control (RBAC)
- **Public Access**: Secure validation of membership IDs via the public interface.
- **Volunteer Access**: Enhanced verification tools for chapter operations.
- **Administrative Access**: Comprehensive control over analytics, user permissions, and dataset management.

### Analytics and Reporting
- Real-time tracking of active, expired, and total membership counts.
- Proactive identification of memberships expiring within a 30-day window.
- Visual data distribution across multiple dimensions:
  - Membership Status
  - Academic Grade/Level
  - Institutional Affiliation
  - Geographic Region

### Data Management and Export
- High-performance parsing of CSV and Excel (.xlsx, .xls) datasets.
- Automated calculation of expiry dates based on institutional renewal cycles.
- Advanced filtering and global search functionality.
- Direct export of filtered results to CSV for external reporting.

### Interface Standards
- Full responsive support for mobile, tablet, and desktop environments.
- Native system dark and light mode integration.
- Standardized UI components based on Material Design principles.

## Technical Specification

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI Architecture**: Tailwind CSS + shadcn/ui
- **Identity Provider**: Clerk Authentication
- **Visualization**: Recharts
- **Validation**: Zod + React Hook Form
- **Data Processing**: XLSX Core

## System Requirements

- Node.js 18.0 or higher
- Package Manager (npm, yarn, or pnpm)
- Clerk account for identity management
- Neon Database account (Optional: Required for persistent audit logs)

## Implementation Guide

### 1. Repository Setup
```bash
git clone https://github.com/yourusername/ieee-membership-validator.git
cd ieee-membership-validator
```

### 2. Dependency Management
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Clerk Authentication Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database Configuration (Optional)
DATABASE_URL=postgresql://...
```

### 4. Development Execution
```bash
npm run dev
```
The application will be accessible at [http://localhost:9002](http://localhost:9002).

## Data Schema Specification

The ingestion engine requires specific headers for membership datasets. Column order is flexible.

| Header Name | Required | Description |
|:---|:---:|:---|
| **Member Number** | ✅ | Unique IEEE identification number |
| **First Name** | ✅ | Member's given name |
| **Last Name** | ✅ | Member's family name |
| **Email Address** | ✅ | Primary contact email |
| **IEEE Status** | ✅ | Current membership grade |
| **Renew Year** | ✅ | Most recent renewal year |
| **Region** | ✅ | Assigned IEEE region |
| **Section** | ✅ | Local IEEE section |
| **School Name** | ✅ | Affiliated institution |
| **School Section** | ✅ | Institutional subunit |
| **Middle Name** | ✅ | Additional names (optional value) |
| **Grade** | ✅ | Academic or professional grade |
| **Gender** | ✅ | Member gender |
| **Active Society List** | ✅ | Affiliated IEEE societies |
| **Technical Community List** | ✅ | Affiliated technical communities |
| **Technical Council List** | ✅ | Affiliated technical councils |
| **Special Interest Group List** | ✅ | Affiliated SIGs (e.g., SIGHT) |

### Non-Mandatory Fields
The following fields are optional and do not impact system logic:
- `School Number`
- `Home Number`

## Administrative Configuration

To assign administrative or volunteer privileges:
1. Access the Clerk Dashboard.
2. Navigate to the **Users** directory.
3. Select the target user profile.
4. Update the **Public Metadata** with the following JSON:
   - For Admin: `{ "role": "admin" }`
   - For Volunteer: `{ "role": "volunteer" }`

## Deployment Strategy

### Vercel Integration
1. Connect the repository to a new Vercel project.
2. Define the environment variables in the project settings.
3. Execute the deployment build.

## Contributing Protocols

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/refinement`).
3. Commit changes according to standard conventions.
4. Submit a Pull Request for review.

## License

Distributed under the MIT License. See `LICENSE` for further details.

## Acknowledgments

- **IEEE**: For their contributions to technical advancement.
- **Clerk**: For secure and seamless authentication services.
- **Vercel**: For high-performance hosting and deployment.