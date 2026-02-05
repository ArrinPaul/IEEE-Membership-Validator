# IEEE Membership Validator

A modern web application for validating and managing IEEE memberships. Built with Next.js 15, React 19, Clerk Authentication, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-teal)

## Features

### 🔐 Role-Based Access Control
- **Public Users**: Can validate membership IDs on the home page
- **Volunteers**: Access to enhanced validation features
- **Admins**: Full access to analytics, user management, and data upload

### 📊 Analytics Dashboard
- Total, active, and expired member counts
- Members expiring within 30 days
- Charts showing membership distribution by:
  - Status (Active vs Expired)
  - Membership Level
  - School/Institution
  - Region

### 🔍 Advanced Search & Filtering
- Search by Member ID, Name, Email, or School
- Filter by Status, Region, School, and Membership Level
- Paginated results
- Export search results to CSV

### 📁 Data Management
- Upload member data via CSV or Excel (.xlsx, .xls)
- Automatic expiry date calculation based on renewal year
- Support for 19+ member data fields

### 🎨 Modern UI/UX
- Dark/Light mode toggle
- Mobile-responsive design
- Toast notifications
- Loading states and animations

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Clerk
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Excel Parsing**: xlsx library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Clerk account (for authentication)
- Neon Database account (optional, for persistent storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ieee-membership-validator.git
cd ieee-membership-validator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Optional: Neon Database
DATABASE_URL=postgresql://...
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:9002](http://localhost:9002)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── volunteer/         # Volunteer portal
│   ├── sign-in/           # Clerk sign-in page
│   ├── sign-up/           # Clerk sign-up page
│   └── unauthorized/      # Access denied page
├── components/
│   ├── layout/            # Header, Footer components
│   ├── providers/         # Auth, Theme providers
│   ├── ui/                # shadcn/ui components
│   ├── AdminClient.tsx    # Admin member lookup
│   ├── AnalyticsDashboard.tsx
│   ├── CsvUploader.tsx    # File upload component
│   ├── MemberSearch.tsx   # Search & filter
│   ├── UserManagement.tsx # Role management
│   └── ValidatorClient.tsx # Public validation form
├── lib/
│   ├── auth/              # Authentication utilities
│   ├── db/                # Database schema & connection
│   └── actions.ts         # Server actions
└── middleware.ts          # Route protection
```

## CSV/Excel File Format

Your member data file (.csv, .xlsx, or .xls) must include the following headers (column order does not matter):

| Header Name | Required | Description |
|:---|:---:|:---|
| **Member Number** | ✅ | Unique IEEE member identification number |
| **First Name** | ✅ | Member's first name |
| **Last Name** | ✅ | Member's last name |
| **Email Address** | ✅ | Member's contact email address |
| **IEEE Status** | ✅ | Membership grade (e.g., Student Member, Member) |
| **Renew Year** | ✅ | The year the membership was last renewed |
| **Region** | ✅ | IEEE Region (e.g., Region 10) |
| **Section** | ✅ | IEEE Section |
| **School Name** | ✅ | University or institution name |
| **School Section** | ✅ | Specific school section within the university |
| **Middle Name** | ✅ | Member's middle name (can be empty) |
| **Grade** | ✅ | Current grade or level |
| **Gender** | ✅ | Member's gender |
| **Active Society List** | ✅ | List of IEEE Societies the member is part of |
| **Technical Community List** | ✅ | List of technical communities |
| **Technical Council List** | ✅ | List of technical councils |
| **Special Interest Group List** | ✅ | List of special interest groups (e.g., SIGHT) |

### Optional Fields
The following fields are no longer required and can be omitted or left blank:
- `School Number`
- `Home Number`

> **Note:** The application uses the `Renew Year` to automatically calculate the membership expiry date (set to February 27th of the following year).

## Setting Up Roles in Clerk

1. Go to your Clerk Dashboard
2. Navigate to Users
3. Select a user
4. Click "Edit" on Public Metadata
5. Add: `{ "role": "admin" }` or `{ "role": "volunteer" }`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [IEEE](https://www.ieee.org/) - The world's largest technical professional organization
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Clerk](https://clerk.com/) - Authentication made simple
- [Vercel](https://vercel.com/) - Deployment platform
