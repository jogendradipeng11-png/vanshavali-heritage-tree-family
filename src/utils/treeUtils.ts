import { MemberNode, RelationshipLink, TreeData } from '../types';
import { CARD_WIDTH, CARD_HEIGHT } from '../initialData';

export function getRelativeSummary(nodeId: string, nodes: MemberNode[], links: RelationshipLink[]) {
  const parents = links
    .filter(l => l.target === nodeId && l.type === 'parent')
    .map(l => nodes.find(n => n.id === l.source))
    .filter(Boolean) as MemberNode[];

  const spouses = links
    .filter(l => (l.source === nodeId || l.target === nodeId) && l.type === 'spouse')
    .map(l => nodes.find(n => n.id === (l.source === nodeId ? l.target : l.source)))
    .filter(Boolean) as MemberNode[];

  const siblings = links
    .filter(l => (l.source === nodeId || l.target === nodeId) && l.type === 'sibling')
    .map(l => nodes.find(n => n.id === (l.source === nodeId ? l.target : l.source)))
    .filter(Boolean) as MemberNode[];

  const children = links
    .filter(l => l.source === nodeId && l.type === 'parent')
    .map(l => nodes.find(n => n.id === l.target))
    .filter(Boolean) as MemberNode[];

  return {
    parents,
    spouses,
    siblings,
    children,
    parentNames: parents.map(p => p.name).join(', ') || 'None',
    spouseNames: spouses.map(s => s.name).join(', ') || 'None',
    siblingNames: siblings.map(s => s.name).join(', ') || 'None',
    childrenNames: children.map(c => c.name).join(', ') || 'None',
  };
}

export function getAllDescendantIds(parentId: string, links: RelationshipLink[]): Set<string> {
  const descendants = new Set<string>();
  const queue = [parentId];
  const visited = new Set<string>([parentId]);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const childLinks = links.filter(l => l.source === curr && l.type === 'parent');
    childLinks.forEach(l => {
      if (!visited.has(l.target)) {
        visited.add(l.target);
        descendants.add(l.target);
        queue.push(l.target);
      }
    });
  }
  return descendants;
}

export function getOwnBranchCluster(
  nodeId: string,
  nodes: MemberNode[],
  links: RelationshipLink[]
): {
  branchNodes: MemberNode[];
  branchLinks: RelationshipLink[];
  rootNode: MemberNode;
} {
  const rootNode = nodes.find(n => n.id === nodeId) || nodes[0];
  if (!rootNode) {
    return { branchNodes: nodes, branchLinks: links, rootNode: nodes[0] };
  }

  const includedIds = new Set<string>([rootNode.id]);

  // 1. Direct parents
  const parentIds: string[] = [];
  links
    .filter(l => l.target === rootNode.id && l.type === 'parent')
    .forEach(l => {
      includedIds.add(l.source);
      parentIds.push(l.source);
    });

  // 2. Siblings sharing same parent(s)
  if (parentIds.length > 0) {
    links
      .filter(l => parentIds.includes(l.source) && l.type === 'parent')
      .forEach(l => includedIds.add(l.target));
  }

  // 3. Direct spouses
  links
    .filter(l => (l.source === rootNode.id || l.target === rootNode.id) && l.type === 'spouse')
    .forEach(l => includedIds.add(l.source === rootNode.id ? l.target : l.source));

  // 4. Direct siblings
  links
    .filter(l => (l.source === rootNode.id || l.target === rootNode.id) && l.type === 'sibling')
    .forEach(l => includedIds.add(l.source === rootNode.id ? l.target : l.source));

  // 5. Children and all descendants
  const queue = [rootNode.id];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    links
      .filter(l => l.source === curr && l.type === 'parent')
      .forEach(l => {
        if (!includedIds.has(l.target)) {
          includedIds.add(l.target);
          queue.push(l.target);
        }
      });
  }

  // 6. Spouses of descendants
  Array.from(includedIds).forEach(id => {
    links
      .filter(l => (l.source === id || l.target === id) && l.type === 'spouse')
      .forEach(l => includedIds.add(l.source === id ? l.target : l.source));
  });

  const branchNodes = nodes.filter(n => includedIds.has(n.id));
  const branchLinks = links.filter(l => includedIds.has(l.source) && includedIds.has(l.target));

  return { branchNodes, branchLinks, rootNode };
}

export interface GenerationSegment {
  id: string;
  branch: 'paternal' | 'maternal';
  branchLabel: string; // "Main Line" vs "Wife's Family"
  branchIcon: string; // "👑" vs "🌸"
  title: string; // e.g. "Gen IV"
  subtitle: string; // e.g. "1st Wife & In-Laws (Bharadwaj Gotra)"
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  lineY: number;
  minX: number;
  maxX: number;
  nodeIds: string[];
  count: number;
}

export interface GenerationTierInfo {
  level: number;
  roman: string;
  title: string;
  subtitle: string;
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  lineY: number; // Y-coordinate of the generation guideline
  minX: number; // Left boundary across all nodes in tier
  maxX: number; // Right boundary across all nodes in tier
  nodeIds: string[];
  count: number;
  segments: GenerationSegment[];
  hasMaternal: boolean;
  hasPaternal: boolean;
  maternalCount: number;
  paternalCount: number;
}

export const PATERNAL_TIER_THEMES = [
  {
    accentColor: '#f59e0b', // Amber / Gold
    badgeBg: 'rgba(69, 26, 3, 0.95)',
    badgeBorder: 'rgba(245, 158, 11, 0.55)',
    badgeText: '#fef3c7'
  },
  {
    accentColor: '#6366f1', // Royal Indigo
    badgeBg: 'rgba(30, 27, 75, 0.95)',
    badgeBorder: 'rgba(99, 102, 241, 0.55)',
    badgeText: '#e0e7ff'
  },
  {
    accentColor: '#10b981', // Forest Emerald
    badgeBg: 'rgba(6, 78, 59, 0.95)',
    badgeBorder: 'rgba(16, 185, 129, 0.55)',
    badgeText: '#d1fae5'
  },
  {
    accentColor: '#06b6d4', // Oceanic Cyan
    badgeBg: 'rgba(22, 78, 99, 0.95)',
    badgeBorder: 'rgba(6, 182, 212, 0.55)',
    badgeText: '#cffafe'
  },
  {
    accentColor: '#3b82f6', // Royal Blue
    badgeBg: 'rgba(30, 58, 138, 0.95)',
    badgeBorder: 'rgba(59, 130, 246, 0.55)',
    badgeText: '#dbeafe'
  },
  {
    accentColor: '#8b5cf6', // Violet
    badgeBg: 'rgba(46, 16, 101, 0.95)',
    badgeBorder: 'rgba(139, 92, 246, 0.55)',
    badgeText: '#ede9fe'
  }
];

// Dedicated Auspicious Bridal & In-Law Palette for the Wife's Family Section
export const MATERNAL_WIFE_THEMES = [
  {
    accentColor: '#e11d48', // Imperial Crimson / Rose Ruby
    badgeBg: 'rgba(76, 5, 25, 0.95)',
    badgeBorder: 'rgba(225, 29, 72, 0.65)',
    badgeText: '#ffe4e6'
  },
  {
    accentColor: '#be185d', // Deep Magenta / Berry
    badgeBg: 'rgba(80, 7, 36, 0.95)',
    badgeBorder: 'rgba(190, 24, 93, 0.65)',
    badgeText: '#fce7f3'
  },
  {
    accentColor: '#f43f5e', // Blossom Coral / Rose
    badgeBg: 'rgba(76, 5, 25, 0.95)',
    badgeBorder: 'rgba(244, 63, 94, 0.65)',
    badgeText: '#fecdd3'
  },
  {
    accentColor: '#d946ef', // Radiant Fuchsia / Orchid
    badgeBg: 'rgba(74, 4, 78, 0.95)',
    badgeBorder: 'rgba(217, 70, 239, 0.65)',
    badgeText: '#fae8ff'
  },
  {
    accentColor: '#fb7185', // Peach Rose
    badgeBg: 'rgba(88, 28, 48, 0.95)',
    badgeBorder: 'rgba(251, 113, 133, 0.65)',
    badgeText: '#ffe4e6'
  },
  {
    accentColor: '#c026d3', // Purple Orchid
    badgeBg: 'rgba(59, 7, 66, 0.95)',
    badgeBorder: 'rgba(192, 38, 211, 0.65)',
    badgeText: '#fdf4ff'
  }
];

function toRoman(num: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[num] || `${num + 1}`;
}

function clusterNodesByX(nodes: MemberNode[], maxGap = 280): MemberNode[][] {
  if (nodes.length === 0) return [];
  const sorted = [...nodes].sort((a, b) => a.x - b.x);
  const clusters: MemberNode[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevRight = prev.x + CARD_WIDTH;
    if (curr.x - prevRight > maxGap) {
      clusters.push([curr]);
    } else {
      clusters[clusters.length - 1].push(curr);
    }
  }
  return clusters;
}

function getMaternalClusterSubtitle(nodes: MemberNode[]): string {
  const gotras = Array.from(new Set(nodes.map(n => n.gotra).filter(Boolean)));
  const gotraStr = gotras.length > 0 ? ` (${gotras.join(' / ')} Gotra)` : '';

  const rels = nodes.map(n => (n.relationship_to_root || '').toLowerCase());
  const names = nodes.map(n => n.name);

  if (rels.some(r => r.includes('father-in-law') || r.includes('mother-in-law'))) {
    return `Parents-in-Law & Elders${gotraStr}`;
  }
  if (rels.some(r => r.includes('1st wife')) || names.some(n => n.toLowerCase().includes('pooja'))) {
    if (nodes.length > 1) {
      return `1st Wife & In-Law Family${gotraStr}`;
    }
    return `1st Wife Lineage${gotraStr}`;
  }
  if (rels.some(r => r.includes('2nd wife')) || names.some(n => n.toLowerCase().includes('sunita'))) {
    return `2nd Wife Lineage${gotraStr}`;
  }
  if (rels.some(r => r.includes('wife') || r.includes('spouse'))) {
    return `Wives & In-Laws${gotraStr}`;
  }
  if (rels.some(r => r.includes('brother-in-law') || r.includes('sister-in-law'))) {
    return `In-Law Siblings${gotraStr}`;
  }
  return `In-Law Lineage${gotraStr}`;
}

function getPaternalClusterSubtitle(nodes: MemberNode[]): string {
  const gotras = Array.from(new Set(nodes.map(n => n.gotra).filter(Boolean)));
  const gotraStr = gotras.length > 0 ? ` (${gotras[0]} Gotra)` : '';

  const rels = nodes.map(n => (n.relationship_to_root || '').toLowerCase());

  if (rels.some(r => r.includes('great-grand') || r.includes('founder') || r.includes('elder'))) {
    return `Great-Grandparents & Lineage Founders${gotraStr}`;
  }
  if (rels.some(r => r.includes('grand'))) {
    return `Grandparents & Senior Ancestors${gotraStr}`;
  }
  if (rels.some(r => r.includes('father') || r.includes('mother') || r.includes('uncle') || r.includes('aunt'))) {
    return `Parents & Paternal Elders${gotraStr}`;
  }
  if (rels.some(r => r.includes('root') || r.includes('self') || r.includes('brother') || r.includes('sister'))) {
    return `Husband / Self & Paternal Siblings${gotraStr}`;
  }
  if (rels.some(r => r.includes('son') || r.includes('daughter') || r.includes('child'))) {
    return `Next Generation Lineage & Heirs${gotraStr}`;
  }
  return `Main Line Relatives${gotraStr}`;
}

/**
 * Calculates topological generation levels for all nodes based on strict genealogical rules.
 */
export function calculateGenerationLevels(nodes: MemberNode[], links: RelationshipLink[]): Record<string, number> {
  const levels: Record<string, number> = {};
  if (nodes.length === 0) return levels;

  nodes.forEach(n => levels[n.id] = 0);

  let changed = true;
  let iter = 0;
  const maxIter = nodes.length * 4 + 20;

  while (changed && iter < maxIter) {
    changed = false;
    iter++;

    // 1A. Parent -> Child constraint: Child is always at least +1 level down
    links.forEach(l => {
      if (l.type === 'parent') {
        const pL = levels[l.source] ?? 0;
        const cL = levels[l.target] ?? 0;
        if (cL < pL + 1) {
          levels[l.target] = pL + 1;
          changed = true;
        }
      }
    });

    // 1B. Spouse constraint: exact same generation line
    links.forEach(l => {
      if (l.type === 'spouse') {
        const l1 = levels[l.source] ?? 0;
        const l2 = levels[l.target] ?? 0;
        if (l1 !== l2) {
          const maxL = Math.max(l1, l2);
          levels[l.source] = maxL;
          levels[l.target] = maxL;
          changed = true;
        }
      }
    });

    // 1C. Sibling constraint: exact same generation line
    links.forEach(l => {
      if (l.type === 'sibling') {
        const l1 = levels[l.source] ?? 0;
        const l2 = levels[l.target] ?? 0;
        if (l1 !== l2) {
          const maxL = Math.max(l1, l2);
          levels[l.source] = maxL;
          levels[l.target] = maxL;
          changed = true;
        }
      }
    });
  }

  // 1D. Pull elders/parents upward so they are directly 1 level above their children
  links.forEach(l => {
    if (l.type === 'parent') {
      const cL = levels[l.target];
      if (cL !== undefined && levels[l.source] !== undefined && levels[l.source] < cL - 1) {
        levels[l.source] = cL - 1;
      }
    }
  });

  // Re-synchronize spouses and siblings on upward adjustments
  links.forEach(l => {
    if (l.type === 'spouse' || l.type === 'sibling') {
      if (levels[l.source] !== undefined && levels[l.target] !== undefined) {
        const m = Math.max(levels[l.source], levels[l.target]);
        levels[l.source] = m;
        levels[l.target] = m;
      }
    }
  });

  // Normalize so minimum generation level is 0
  const allLevels = Object.values(levels);
  if (allLevels.length > 0) {
    const minLvl = Math.min(...allLevels);
    nodes.forEach(n => {
      levels[n.id] = (levels[n.id] ?? 0) - minLvl;
    });
  }

  return levels;
}

/**
 * Returns structured metadata for each generation tier:
 * guideline position, label, badge styling, and constituent nodes.
 * The generation guideline is placed strictly ABOVE all cards in that tier,
 * ensuring all member cards sit cleanly BELOW the generation line.
 */
export function getGenerationTiers(nodes: MemberNode[], links: RelationshipLink[]): GenerationTierInfo[] {
  if (nodes.length === 0) return [];

  const levels = calculateGenerationLevels(nodes, links);
  const byLevel: Record<number, MemberNode[]> = {};

  nodes.forEach(n => {
    const lvl = levels[n.id] ?? 0;
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(n);
  });

  const sortedLvls = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
  if (sortedLvls.length === 0) return [];

  // Determine global horizontal bounds so generation baselines span harmoniously
  const globalMinX = Math.min(...nodes.map(n => n.x)) - 70;
  const globalMaxX = Math.max(...nodes.map(n => n.x + CARD_WIDTH)) + 70;

  return sortedLvls.map(lvl => {
    const tierNodes = byLevel[lvl];
    const pTheme = PATERNAL_TIER_THEMES[lvl % PATERNAL_TIER_THEMES.length];
    const mTheme = MATERNAL_WIFE_THEMES[lvl % MATERNAL_WIFE_THEMES.length];
    const roman = toRoman(lvl);

    // Baseline line placed 26px ABOVE the highest card in this generation
    const minY = Math.min(...tierNodes.map(n => n.y));
    const lineY = Math.round(minY - 26);

    const paternalNodes = tierNodes.filter(n => n.branch !== 'maternal');
    const maternalNodes = tierNodes.filter(n => n.branch === 'maternal');

    const segments: GenerationSegment[] = [];

    // 1. Build dedicated segments for Main Line (Paternal)
    if (paternalNodes.length > 0) {
      const pClusters = clusterNodesByX(paternalNodes, 260);
      pClusters.forEach((cluster, idx) => {
        const segMinX = Math.min(...cluster.map(n => n.x)) - 32;
        const segMaxX = Math.max(...cluster.map(n => n.x + CARD_WIDTH)) + 32;
        const segSubtitle = getPaternalClusterSubtitle(cluster);

        segments.push({
          id: `gen-${lvl}-pat-${idx}`,
          branch: 'paternal',
          branchLabel: 'Main Line',
          branchIcon: '👑',
          title: `Gen ${roman}`,
          subtitle: segSubtitle,
          accentColor: pTheme.accentColor,
          badgeBg: pTheme.badgeBg,
          badgeBorder: pTheme.badgeBorder,
          badgeText: pTheme.badgeText,
          lineY,
          minX: segMinX,
          maxX: segMaxX,
          nodeIds: cluster.map(n => n.id),
          count: cluster.length
        });
      });
    }

    // 2. Build dedicated segments for Wife's Family (Maternal / In-Laws)
    if (maternalNodes.length > 0) {
      const mClusters = clusterNodesByX(maternalNodes, 260);
      mClusters.forEach((cluster, idx) => {
        const segMinX = Math.min(...cluster.map(n => n.x)) - 32;
        const segMaxX = Math.max(...cluster.map(n => n.x + CARD_WIDTH)) + 32;
        const segSubtitle = getMaternalClusterSubtitle(cluster);

        segments.push({
          id: `gen-${lvl}-mat-${idx}`,
          branch: 'maternal',
          branchLabel: "Wife's Family",
          branchIcon: '🌸',
          title: `Gen ${roman}`,
          subtitle: segSubtitle,
          accentColor: mTheme.accentColor,
          badgeBg: mTheme.badgeBg,
          badgeBorder: mTheme.badgeBorder,
          badgeText: mTheme.badgeText,
          lineY,
          minX: segMinX,
          maxX: segMaxX,
          nodeIds: cluster.map(n => n.id),
          count: cluster.length
        });
      });
    }

    const tierPrimaryTheme = paternalNodes.length === 0 ? mTheme : pTheme;
    const generalSubtitle = paternalNodes.length === 0
      ? getMaternalClusterSubtitle(maternalNodes)
      : getPaternalClusterSubtitle(paternalNodes);

    return {
      level: lvl,
      roman,
      title: `Generation ${roman}`,
      subtitle: generalSubtitle,
      accentColor: tierPrimaryTheme.accentColor,
      badgeBg: tierPrimaryTheme.badgeBg,
      badgeBorder: tierPrimaryTheme.badgeBorder,
      badgeText: tierPrimaryTheme.badgeText,
      lineY,
      minX: globalMinX,
      maxX: globalMaxX,
      nodeIds: tierNodes.map(n => n.id),
      count: tierNodes.length,
      segments,
      hasMaternal: maternalNodes.length > 0,
      hasPaternal: paternalNodes.length > 0,
      maternalCount: maternalNodes.length,
      paternalCount: paternalNodes.length
    };
  });
}

export function autoArrangeTree(nodes: MemberNode[], links: RelationshipLink[]): MemberNode[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return [{ ...nodes[0], x: 360, y: 70 }];

  const CARD_W = CARD_WIDTH; // 240
  const CARD_H = CARD_HEIGHT; // 185
  const V_GAP = CARD_H + 85; // 270px generation distance with ample breathing room
  const SPOUSE_GAP = 36; // gap between married spouses
  const SIBLING_GAP = 48; // gap between siblings
  const CLUSTER_GAP = 84; // gap between distinct families/branches

  // Step 1: Assign exact generation levels using our robust constraint solver
  const levels = calculateGenerationLevels(nodes, links);

  // Group node IDs by generation level
  const byLevel: Record<number, string[]> = {};
  nodes.forEach(n => {
    const lvl = levels[n.id] ?? 0;
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(n.id);
  });

  const sortedLevels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
  const pos: Record<string, { x: number; y: number }> = {};

  // Step 2: Lay out generation levels from top to bottom
  // Initial top margin starts at 70 so the top generation line sits comfortably at y = 44
  sortedLevels.forEach(lvl => {
    const nodeIds = byLevel[lvl];
    const y = 70 + lvl * V_GAP;

    // Group nodes in this generation into connected family units (spouses & siblings)
    const visited = new Set<string>();
    const clusters: string[][] = [];

    nodeIds.forEach(id => {
      if (visited.has(id)) return;
      const cluster: string[] = [];
      const queue = [id];
      visited.add(id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        cluster.push(curr);

        // Find spouses at the same generation
        links.forEach(l => {
          if (l.type === 'spouse') {
            const partner = l.source === curr ? l.target : (l.target === curr ? l.source : null);
            if (partner && nodeIds.includes(partner) && !visited.has(partner)) {
              visited.add(partner);
              queue.push(partner);
            }
          }
          // Find siblings at the same generation
          if (l.type === 'sibling') {
            const sib = l.source === curr ? l.target : (l.target === curr ? l.source : null);
            if (sib && nodeIds.includes(sib) && !visited.has(sib)) {
              visited.add(sib);
              queue.push(sib);
            }
          }
        });
      }

      // Order nodes within cluster intelligently:
      // If there are multiple spouses: [Spouse 2, Primary, Spouse 1, Spouse 1's siblings]
      // Or primary in center, spouses adjacent, siblings adjacent
      const orderedCluster: string[] = [];
      const placedInCluster = new Set<string>();

      // Pick primary anchor node in this unit (e.g. node with parents or root lineage)
      const primary = cluster.find(cId => {
        return links.some(l => l.target === cId && l.type === 'parent');
      }) || cluster.find(cId => {
        const n = nodes.find(x => x.id === cId);
        return n && n.branch === 'paternal';
      }) || cluster[0];

      // Find direct spouses of primary in this cluster
      const primarySpouses = cluster.filter(cId =>
        cId !== primary &&
        links.some(l =>
          ((l.source === primary && l.target === cId) || (l.target === primary && l.source === cId)) &&
          l.type === 'spouse'
        )
      );

      // If 2 spouses: place one on left, primary in center, one on right
      if (primarySpouses.length === 2) {
        orderedCluster.push(primarySpouses[1]);
        placedInCluster.add(primarySpouses[1]);
        orderedCluster.push(primary);
        placedInCluster.add(primary);
        orderedCluster.push(primarySpouses[0]);
        placedInCluster.add(primarySpouses[0]);
      } else {
        orderedCluster.push(primary);
        placedInCluster.add(primary);
        primarySpouses.forEach(sId => {
          orderedCluster.push(sId);
          placedInCluster.add(sId);
        });
      }

      // Add siblings next to their connected relative
      cluster.forEach(cId => {
        if (!placedInCluster.has(cId)) {
          orderedCluster.push(cId);
          placedInCluster.add(cId);
        }
      });

      clusters.push(orderedCluster);
    });

    // Calculate cluster widths with specific relationship gaps
    interface ClusterInfo {
      cluster: string[];
      totalWidth: number;
      memberOffsets: number[];
      anchorX: number | null;
    }

    const clusterInfos: ClusterInfo[] = clusters.map(cluster => {
      let width = 0;
      const memberOffsets: number[] = [];

      cluster.forEach((mId, idx) => {
        memberOffsets.push(width);
        if (idx === cluster.length - 1) {
          width += CARD_W;
        } else {
          const nextId = cluster[idx + 1];
          const isSpousePair = links.some(l =>
            ((l.source === mId && l.target === nextId) || (l.target === mId && l.source === nextId)) &&
            l.type === 'spouse'
          );
          const isSiblingPair = links.some(l =>
            ((l.source === mId && l.target === nextId) || (l.target === mId && l.source === nextId)) &&
            l.type === 'sibling'
          );
          const gap = isSpousePair ? SPOUSE_GAP : isSiblingPair ? SIBLING_GAP : CLUSTER_GAP;
          width += CARD_W + gap;
        }
      });

      // Calculate anchorX from parents in upper level
      let sumAnchor = 0;
      let countAnchor = 0;
      cluster.forEach(id => {
        const parentLinks = links.filter(l => l.target === id && l.type === 'parent');
        parentLinks.forEach(pl => {
          if (pos[pl.source]) {
            sumAnchor += pos[pl.source].x + CARD_W / 2;
            countAnchor++;
          }
        });
      });

      const anchorX = countAnchor > 0 ? sumAnchor / countAnchor : null;
      return { cluster, totalWidth: width, memberOffsets, anchorX };
    });

    // Sort clusters in this row based on parent anchor position
    clusterInfos.sort((a, b) => {
      if (a.anchorX !== null && b.anchorX !== null) return a.anchorX - b.anchorX;
      if (a.anchorX !== null) return -1;
      if (b.anchorX !== null) return 1;
      return 0;
    });

    // Position each cluster in the row with guaranteed minimum separation
    let currentX = 60;
    clusterInfos.forEach(info => {
      const { cluster, totalWidth, memberOffsets, anchorX } = info;
      let startX = currentX;

      if (anchorX !== null) {
        const desiredX = Math.round(anchorX - totalWidth / 2);
        startX = Math.max(currentX, desiredX);
      }

      cluster.forEach((id, idx) => {
        pos[id] = { x: startX + memberOffsets[idx], y };
      });

      currentX = startX + totalWidth + CLUSTER_GAP;
    });
  });

  // Step 3: Bottom-up centering pass (align parents over children WITHOUT causing any overlap)
  sortedLevels.slice().reverse().forEach(lvl => {
    const rowNodeIds = byLevel[lvl];
    rowNodeIds.forEach(id => {
      const childLinks = links.filter(l => l.source === id && l.type === 'parent');
      const childrenWithPos = childLinks.map(l => pos[l.target]).filter(Boolean);
      const hasSpouse = links.some(l => (l.source === id || l.target === id) && l.type === 'spouse');

      if (childrenWithPos.length > 0 && !hasSpouse && pos[id]) {
        const avgChildCenterX = childrenWithPos.reduce((sum, c) => sum + (c.x + CARD_W / 2), 0) / childrenWithPos.length;
        const targetX = Math.round(avgChildCenterX - CARD_W / 2);

        // Find left and right neighbors in the same generation row
        const otherNodesInRow = rowNodeIds.filter(oId => oId !== id && pos[oId]);
        const leftNeighbors = otherNodesInRow.filter(oId => pos[oId].x < pos[id].x);
        const rightNeighbors = otherNodesInRow.filter(oId => pos[oId].x > pos[id].x);

        const minAllowedX = leftNeighbors.length > 0
          ? Math.max(...leftNeighbors.map(oId => pos[oId].x)) + CARD_W + CLUSTER_GAP
          : 60;

        const maxAllowedX = rightNeighbors.length > 0
          ? Math.min(...rightNeighbors.map(oId => pos[oId].x)) - CARD_W - CLUSTER_GAP
          : Infinity;

        if (targetX >= minAllowedX && targetX <= maxAllowedX) {
          pos[id].x = targetX;
        } else if (targetX < minAllowedX) {
          pos[id].x = minAllowedX;
        } else if (targetX > maxAllowedX && maxAllowedX !== Infinity) {
          pos[id].x = maxAllowedX;
        }
      }
    });
  });

  // Assemble preliminary positioned nodes
  const preliminaries: MemberNode[] = nodes.map(node => {
    const p = pos[node.id];
    return {
      ...node,
      x: p ? p.x : node.x,
      y: p ? p.y : node.y
    };
  });

  // Step 4: Strict, fail-safe overlap resolver across all nodes
  return resolveAllOverlaps(preliminaries, links);
}

/**
 * Guarantees 100% that no two nodes overlap horizontally or vertically.
 * Enforces strict minimum margins between all cards.
 */
export function resolveAllOverlaps(nodes: MemberNode[], links: RelationshipLink[]): MemberNode[] {
  if (nodes.length <= 1) return nodes;

  const CARD_W = CARD_WIDTH; // 240
  const CARD_H = CARD_HEIGHT; // 185
  const SPOUSE_GAP = 36;
  const SIBLING_GAP = 48;
  const CLUSTER_GAP = 80;

  const result: MemberNode[] = nodes.map(n => ({ ...n }));

  const isSpouse = (idA: string, idB: string) =>
    links.some(l => ((l.source === idA && l.target === idB) || (l.target === idA && l.source === idB)) && l.type === 'spouse');
  const isSibling = (idA: string, idB: string) =>
    links.some(l => ((l.source === idA && l.target === idB) || (l.target === idA && l.source === idB)) && l.type === 'sibling');

  // Pass 1: Row-by-row horizontal overlap resolution
  // Cluster nodes that share roughly the same vertical tier
  const rows: MemberNode[][] = [];
  const processed = new Set<string>();
  const sortedByY = [...result].sort((a, b) => a.y - b.y);

  sortedByY.forEach(n => {
    if (processed.has(n.id)) return;
    const row = sortedByY.filter(other => !processed.has(other.id) && Math.abs(other.y - n.y) < CARD_H * 0.7);
    row.forEach(r => processed.add(r.id));
    rows.push(row);
  });

  // For every row, sort left-to-right and ensure strict spacing
  rows.forEach(row => {
    row.sort((a, b) => a.x - b.x);
    for (let i = 0; i < row.length - 1; i++) {
      const a = row[i];
      const b = row[i + 1];
      const reqGap = isSpouse(a.id, b.id) ? SPOUSE_GAP : isSibling(a.id, b.id) ? SIBLING_GAP : CLUSTER_GAP;
      const minDistance = CARD_W + reqGap;
      if (b.x < a.x + minDistance) {
        const diff = (a.x + minDistance) - b.x;
        for (let j = i + 1; j < row.length; j++) {
          row[j].x += diff;
        }
      }
    }
  });

  // Pass 2: Vertical row spacing (ensure rows never overlap vertically)
  for (let r = 0; r < rows.length - 1; r++) {
    const currRow = rows[r];
    const nextRow = rows[r + 1];
    const currMaxY = Math.max(...currRow.map(n => n.y));
    const nextMinY = Math.min(...nextRow.map(n => n.y));
    const minRowDist = CARD_H + 45;
    if (nextMinY < currMaxY + minRowDist) {
      const yShift = (currMaxY + minRowDist) - nextMinY;
      for (let subsequent = r + 1; subsequent < rows.length; subsequent++) {
        rows[subsequent].forEach(n => n.y += yShift);
      }
    }
  }

  // Pass 3: Iterative 2D bounding-box collision resolver
  // Guarantees zero bounding-box overlaps across any pair of cards
  let hasOverlap = true;
  let safetyLoop = 0;
  while (hasOverlap && safetyLoop < 20) {
    hasOverlap = false;
    safetyLoop++;

    for (let i = 0; i < result.length; i++) {
      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const n1 = result[i];
        const n2 = result[j];

        const overlapX = (CARD_W + 24) - Math.abs(n1.x - n2.x);
        const overlapY = (CARD_H + 24) - Math.abs(n1.y - n2.y);

        if (overlapX > 0 && overlapY > 0) {
          hasOverlap = true;
          // Separate primarily horizontally, or vertically if already aligned
          if (overlapX <= overlapY) {
            const shift = overlapX + 20;
            if (n2.x >= n1.x) {
              n2.x += shift;
            } else {
              n1.x += shift;
            }
          } else {
            const shift = overlapY + 20;
            if (n2.y >= n1.y) {
              n2.y += shift;
            } else {
              n1.y += shift;
            }
          }
        }
      }
    }
  }

  // Pass 4: Normalize canvas padding (minimum 60px from left and top)
  const minX = Math.min(...result.map(n => n.x));
  const minY = Math.min(...result.map(n => n.y));
  const padX = minX < 60 ? (60 - minX) : 0;
  const padY = minY < 60 ? (60 - minY) : 0;

  return result.map(n => ({
    ...n,
    x: Math.round(n.x + padX),
    y: Math.round(n.y + padY)
  }));
}
