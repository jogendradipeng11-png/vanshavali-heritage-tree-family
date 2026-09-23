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

export function autoArrangeTree(nodes: MemberNode[], links: RelationshipLink[]): MemberNode[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return [{ ...nodes[0], x: 360, y: 60 }];

  const CARD_W = CARD_WIDTH; // 240
  const CARD_H = CARD_HEIGHT; // 185
  const V_GAP = CARD_H + 75; // 260px generation distance
  const SPOUSE_GAP = 30; // gap between married spouses
  const SIBLING_GAP = 40; // gap between siblings
  const DEFAULT_GAP = 60; // gap between distinct families/branches

  // Step 1: Assign exact generation levels to all nodes
  // Rules enforced:
  // - Parent ALWAYS strictly on top of relative (level[child] >= level[parent] + 1)
  // - Child ALWAYS down below relative (level[child] >= level[parent] + 1)
  // - Spouse ALWAYS on the exact same horizontal line (level[a] === level[b])
  // - Siblings ALWAYS on the exact same horizontal line (level[a] === level[b])
  const levels: Record<string, number> = {};
  nodes.forEach(n => levels[n.id] = 0);

  let changed = true;
  let iter = 0;
  const maxIter = nodes.length * 4 + 20;

  while (changed && iter < maxIter) {
    changed = false;
    iter++;

    // 1A. Parent -> Child constraint
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

    // 1B. Spouse constraint: exact same line
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

    // 1C. Sibling constraint: exact same line
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
      if (levels[l.source] < cL - 1) {
        levels[l.source] = cL - 1;
      }
    }
  });

  // Re-synchronize spouses and siblings on upward adjustments
  links.forEach(l => {
    if (l.type === 'spouse' || l.type === 'sibling') {
      const m = Math.max(levels[l.source], levels[l.target]);
      levels[l.source] = m;
      levels[l.target] = m;
    }
  });

  // Normalize so minimum generation level is 0
  const minLvl = Math.min(...Object.values(levels));
  nodes.forEach(n => levels[n.id] -= minLvl);

  // Group node IDs by generation level
  const byLevel: Record<number, string[]> = {};
  nodes.forEach(n => {
    const lvl = levels[n.id];
    if (!byLevel[lvl]) byLevel[lvl] = [];
    byLevel[lvl].push(n.id);
  });

  const sortedLevels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);
  const pos: Record<string, { x: number; y: number }> = {};

  // Step 2: Lay out generation levels from top to bottom
  sortedLevels.forEach(lvl => {
    const nodeIds = byLevel[lvl];
    const y = 60 + lvl * V_GAP;

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

      // Order nodes within cluster:
      // Primary person, spouses directly adjacent, siblings directly adjacent
      const orderedCluster: string[] = [];
      const placedInCluster = new Set<string>();

      // Pick anchor node (e.g. male or root or most connected)
      const primary = cluster.find(cId => {
        const hasParent = links.some(l => l.target === cId && l.type === 'parent');
        return hasParent;
      }) || cluster[0];

      // Add primary
      orderedCluster.push(primary);
      placedInCluster.add(primary);

      // Add primary's spouses directly beside
      cluster.forEach(cId => {
        if (!placedInCluster.has(cId)) {
          const isSpouse = links.some(l => 
            ((l.source === primary && l.target === cId) || (l.target === primary && l.source === cId)) &&
            l.type === 'spouse'
          );
          if (isSpouse) {
            orderedCluster.push(cId);
            placedInCluster.add(cId);
          }
        }
      });

      // Add siblings next to their related person
      cluster.forEach(cId => {
        if (!placedInCluster.has(cId)) {
          orderedCluster.push(cId);
          placedInCluster.add(cId);
        }
      });

      clusters.push(orderedCluster);
    });

    // Find parent anchors from previous levels for centering
    const clusterRows: { cluster: string[]; anchorX: number | null }[] = [];
    clusters.forEach(cluster => {
      let sumAnchor = 0;
      let countAnchor = 0;
      cluster.forEach(id => {
        const parentLinks = links.filter(l => l.target === id && l.type === 'parent');
        parentLinks.forEach(pl => {
          if (pos[pl.source]) {
            sumAnchor += pos[pl.source].x;
            countAnchor++;
          }
        });
      });

      const anchorX = countAnchor > 0 ? sumAnchor / countAnchor : null;
      clusterRows.push({ cluster, anchorX });
    });

    // Sort clusters in this row based on parent positions
    clusterRows.sort((a, b) => {
      if (a.anchorX !== null && b.anchorX !== null) return a.anchorX - b.anchorX;
      if (a.anchorX !== null) return -1;
      if (b.anchorX !== null) return 1;
      return 0;
    });

    // Position each cluster in the row with no overlapping
    let currentX = 60;
    clusterRows.forEach(row => {
      const { cluster, anchorX } = row;
      const totalClusterWidth = cluster.length * CARD_W + (cluster.length - 1) * SPOUSE_GAP;

      let startX = currentX;
      if (anchorX !== null) {
        const desiredX = anchorX + (CARD_W / 2) - (totalClusterWidth / 2);
        startX = Math.max(currentX, desiredX);
      }

      cluster.forEach((id, idx) => {
        const x = startX + idx * (CARD_W + SPOUSE_GAP);
        pos[id] = { x, y };
      });

      currentX = startX + totalClusterWidth + DEFAULT_GAP;
    });
  });

  // Step 3: Bottom-up centering pass (align parents over children if no parent anchor)
  sortedLevels.slice().reverse().forEach(lvl => {
    byLevel[lvl].forEach(id => {
      const childLinks = links.filter(l => l.source === id && l.type === 'parent');
      const childrenWithPos = childLinks.map(l => pos[l.target]).filter(Boolean);
      const hasSpouse = links.some(l => (l.source === id || l.target === id) && l.type === 'spouse');
      if (childrenWithPos.length > 0 && !hasSpouse && pos[id]) {
        const avgChildX = childrenWithPos.reduce((sum, c) => sum + c.x, 0) / childrenWithPos.length;
        pos[id].x = avgChildX;
      }
    });
  });

  // Step 4: Ensure minimum X margin
  const allX = Object.values(pos).map(p => p.x);
  const minX = Math.min(...allX);
  const xOffset = minX < 60 ? (60 - minX) : 0;

  return nodes.map(node => {
    const p = pos[node.id];
    return {
      ...node,
      x: p ? Math.round(p.x + xOffset) : node.x,
      y: p ? Math.round(p.y) : node.y
    };
  });
}
