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

export let members: Member[] = [];
