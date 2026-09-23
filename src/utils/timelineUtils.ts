import { MemberNode } from '../types';

export interface TimelineMemberItem {
  node: MemberNode;
  birthTimestamp: number;
  birthYear: number;
  birthDisplay: string;
  isEstimated: boolean;
  lifespanDisplay: string;
  eraName: string;
}

export function getEstimatedBirthData(node: MemberNode): {
  timestamp: number;
  year: number;
  display: string;
  isEstimated: boolean;
} {
  // If exact DOB is available
  if (node.dob) {
    const parsed = Date.parse(node.dob);
    if (!isNaN(parsed)) {
      const dateObj = new Date(node.dob);
      const year = dateObj.getFullYear();
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
      return {
        timestamp: parsed,
        year,
        display: dateObj.toLocaleDateString(undefined, options),
        isEstimated: false
      };
    }
  }

  // If passed away with known DOD and age at death
  if (node.dod && node.age != null) {
    const dodParsed = Date.parse(node.dod);
    if (!isNaN(dodParsed)) {
      const deathYear = new Date(node.dod).getFullYear();
      const estYear = deathYear - node.age;
      const estDate = new Date(estYear, 5, 15);
      return {
        timestamp: estDate.getTime(),
        year: estYear,
        display: `c. ${estYear} (Est.)`,
        isEstimated: true
      };
    }
  }

  // If age is known
  if (node.age != null) {
    const currentYear = new Date().getFullYear();
    const estYear = currentYear - node.age;
    const estDate = new Date(estYear, 5, 15);
    return {
      timestamp: estDate.getTime(),
      year: estYear,
      display: `c. ${estYear} (Est. Age ${node.age})`,
      isEstimated: true
    };
  }

  // Fallback estimation based on relationship rank
  const rel = (node.relationship_to_root || '').toLowerCase();
  let defaultYear = 1990;
  if (rel.includes('great-grand')) defaultYear = 1900;
  else if (rel.includes('grand')) defaultYear = 1930;
  else if (rel.includes('father') || rel.includes('mother')) defaultYear = 1965;
  else if (rel.includes('self') || rel.includes('root') || rel.includes('wife') || rel.includes('husband') || rel.includes('brother') || rel.includes('sister')) defaultYear = 1995;
  else if (rel.includes('son') || rel.includes('daughter') || rel.includes('child')) defaultYear = 2020;

  const fallbackDate = new Date(defaultYear, 0, 1);
  return {
    timestamp: fallbackDate.getTime(),
    year: defaultYear,
    display: `c. ${defaultYear} (Era Est.)`,
    isEstimated: true
  };
}

export function getLifespanDisplay(node: MemberNode, birthYear: number): string {
  if (node.status === 'deceased') {
    let deathYear = '';
    if (node.dod) {
      const d = new Date(node.dod);
      if (!isNaN(d.getFullYear())) deathYear = String(d.getFullYear());
    }
    const ageSuffix = node.age ? ` (${node.age}y)` : '';
    return `${birthYear} – ${deathYear || 'Deceased'}${ageSuffix}`;
  } else {
    const ageSuffix = node.age ? ` (${node.age}y)` : '';
    return `${birthYear} – Present${ageSuffix}`;
  }
}

export function getEraName(year: number): string {
  if (year < 1920) return '19th & Early 20th Century Elders (Pre-1920)';
  if (year < 1960) return 'Mid 20th Century Lineage (1920 – 1959)';
  if (year < 1990) return 'Late 20th Century Generation (1960 – 1989)';
  if (year < 2010) return 'Millennial & Contemporary Era (1990 – 2009)';
  return '21st Century & Next Generation (2010 – Present)';
}

export function buildTimelineItems(
  nodes: MemberNode[],
  sortOrder: 'asc' | 'desc' = 'asc'
): TimelineMemberItem[] {
  const items = nodes.map(node => {
    const birthData = getEstimatedBirthData(node);
    const lifespan = getLifespanDisplay(node, birthData.year);
    const era = getEraName(birthData.year);

    return {
      node,
      birthTimestamp: birthData.timestamp,
      birthYear: birthData.year,
      birthDisplay: birthData.display,
      isEstimated: birthData.isEstimated,
      lifespanDisplay: lifespan,
      eraName: era
    };
  });

  items.sort((a, b) => {
    return sortOrder === 'asc'
      ? a.birthTimestamp - b.birthTimestamp
      : b.birthTimestamp - a.birthTimestamp;
  });

  return items;
}
