export type Gender = 'male' | 'female' | 'other';
export type Branch = 'paternal' | 'maternal';
export type LivingStatus = 'alive' | 'deceased';
export type MaritalStatus = 'married' | 'unmarried';
export type RelationshipType = 'parent' | 'spouse' | 'sibling' | 'child';

export interface MemberNode {
  id: string;
  name: string;
  relationship_to_root: string;
  gender: Gender;
  branch: Branch;
  marital_status: MaritalStatus;
  status: LivingStatus;
  gotra?: string;
  bansa?: string;
  age?: number | null;
  dob?: string;
  dod?: string;
  profession?: string;
  phone?: string;
  address?: string;
  notes?: string;
  x: number;
  y: number;
}

export interface RelationshipLink {
  id: string;
  source: string;
  target: string;
  type: 'parent' | 'spouse' | 'sibling';
}

export interface TreeData {
  nodes: MemberNode[];
  links: RelationshipLink[];
}

export interface ActiveUser {
  email: string;
  verifiedName: string;
  nodeId?: string;
}
