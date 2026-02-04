export type Member = {
  id: string; // Member Number
  name: string;
  email: string;
  membershipLevel: 'Student Member' | 'Member' | 'Senior Member' | string;
  expiryDate: string; // ISO 8601 format date

  // New optional fields from user request
  region?: string;
  section?: string;
  schoolSection?: string;
  schoolName?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  emailAddress?: string;
  grade?: string;
  gender?: string;
  renewYear?: string;
  schoolNumber?: string;
  homeNumber?: string;
  activeSocietyList?: string;
  technicalCommunityList?: string;
  technicalCouncilList?: string;
  specialInterestGroupList?: string;
};

const getDateIn = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export let members: Member[] = [
  {
    id: '98765432',
    name: 'Alice Johnson',
    email: 'alice.j@university.edu',
    emailAddress: 'alice.j@university.edu',
    membershipLevel: 'Student Member',
    expiryDate: getDateIn(180),
    firstName: 'Alice',
    lastName: 'Johnson',
    region: 'Region 10',
    section: 'North-East',
    schoolName: 'State University',
    grade: 'Graduate',
    gender: 'Female',
    renewYear: new Date(getDateIn(180)).getFullYear().toString(),
    homeNumber: '111-222-3333',
  },
  {
    id: '12345678',
    name: 'Bob Williams',
    email: 'bob.w@university.edu',
    emailAddress: 'bob.w@university.edu',
    membershipLevel: 'Member',
    expiryDate: getDateIn(30),
    firstName: 'Bob',
    lastName: 'Williams',
    region: 'Region 1',
    section: 'West',
    schoolName: 'Tech Institute',
    grade: 'N/A',
    gender: 'Male',
    renewYear: new Date(getDateIn(30)).getFullYear().toString(),
    homeNumber: '222-333-4444',
  },
  {
    id: '87654321',
    name: 'Charlie Brown',
    email: 'charlie.b@university.edu',
    emailAddress: 'charlie.b@university.edu',
    membershipLevel: 'Student Member',
    expiryDate: getDateIn(-90),
    firstName: 'Charlie',
    lastName: 'Brown',
    region: 'Region 5',
    section: 'South',
    schoolName: 'Community College',
    grade: 'Undergraduate',
    gender: 'Male',
    renewYear: new Date(getDateIn(-90)).getFullYear().toString(),
    homeNumber: '333-444-5555',
  },
  {
    id: '23456789',
    name: 'Diana Prince',
    email: 'diana.p@university.edu',
    emailAddress: 'diana.p@university.edu',
    membershipLevel: 'Senior Member',
    expiryDate: getDateIn(365),
    firstName: 'Diana',
    lastName: 'Prince',
    region: 'Region 8',
    section: 'Central',
    schoolName: 'Metropolis University',
    grade: 'PhD',
    gender: 'Female',
    renewYear: new Date(getDateIn(365)).getFullYear().toString(),
    activeSocietyList: 'Computer Society, Power & Energy Society',
    homeNumber: '444-555-6666',
  },
  {
    id: '99999999',
    name: 'Eve Adams',
    email: 'eve.a@university.edu',
    emailAddress: 'eve.a@university.edu',
    membershipLevel: 'Member',
    expiryDate: getDateIn(-365),
    firstName: 'Eve',
    lastName: 'Adams',
    region: 'Region 2',
    section: 'Mid-West',
    schoolName: 'Private University',
    grade: 'N/A',
    gender: 'Female',
    renewYear: new Date(getDateIn(-365)).getFullYear().toString(),
    homeNumber: '555-666-7777',
  },
];
