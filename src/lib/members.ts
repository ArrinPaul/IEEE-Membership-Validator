export type Member = {
  id: string;
  name: string;
  email: string;
  membershipLevel: 'Student Member' | 'Member' | 'Senior Member';
  joinDate: string; // ISO 8601 format date
  expiryDate: string; // ISO 8601 format date
};

const getDateIn = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const members: Member[] = [
  {
    id: '98765432',
    name: 'Alice Johnson',
    email: 'alice.j@university.edu',
    membershipLevel: 'Student Member',
    joinDate: '2022-09-01',
    expiryDate: getDateIn(180), // Expires in ~6 months
  },
  {
    id: '12345678',
    name: 'Bob Williams',
    email: 'bob.w@university.edu',
    membershipLevel: 'Member',
    joinDate: '2021-03-15',
    expiryDate: getDateIn(30), // Expires in 1 month
  },
  {
    id: '87654321',
    name: 'Charlie Brown',
    email: 'charlie.b@university.edu',
    membershipLevel: 'Student Member',
    joinDate: '2023-01-20',
    expiryDate: getDateIn(-90), // Expired 3 months ago
  },
  {
    id: '23456789',
    name: 'Diana Prince',
    email: 'diana.p@university.edu',
    membershipLevel: 'Senior Member',
    joinDate: '2019-11-10',
    expiryDate: getDateIn(365), // Expires in 1 year
  },
  {
    id: '99999999',
    name: 'Eve Adams',
    email: 'eve.a@university.edu',
    membershipLevel: 'Member',
    joinDate: '2020-08-01',
    expiryDate: getDateIn(-365), // Expired 1 year ago
  },
];
