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

export function autoArrangeTree(nodes: MemberNode[], links: RelationshipLink[]): MemberNode[] {
  if (nodes.length === 0) return [];

  const inDegree: Record<string, number> = {};
  nodes.forEach(n => inDegree[n.id] = 0);

  links.forEach(l => {
    if (l.type === 'parent' && inDegree[l.target] !== undefined) {
      inDegree[l.target]++;
    }
  });

  let currentLevel = nodes.filter(n => inDegree[n.id] === 0);
  if (currentLevel.length === 0) currentLevel = [nodes[0]];

  const levels: MemberNode[][] = [];
  const visited = new Set<string>();

  while (currentLevel.length > 0) {
    levels.push(currentLevel);
    currentLevel.forEach(n => visited.add(n.id));
    const nextLevel: MemberNode[] = [];

    currentLevel.forEach(parent => {
      const children = links
        .filter(l => l.source === parent.id && l.type === 'parent')
        .map(l => nodes.find(n => n.id === l.target))
        .filter((n): n is MemberNode => Boolean(n && !visited.has(n.id)));

      children.forEach(c => {
        if (!nextLevel.some(x => x.id === c.id)) nextLevel.push(c);
      });
    });

    // Also include spouses in the same level or right beside
    currentLevel = nextLevel;
  }

  const unplaced = nodes.filter(n => !visited.has(n.id));
  if (unplaced.length > 0) levels.push(unplaced);

  const hSpacing = CARD_WIDTH + 60;
  const vSpacing = CARD_HEIGHT + 75;

  return nodes.map(node => {
    let rowIndex = -1;
    let colIndex = -1;

    for (let r = 0; r < levels.length; r++) {
      const c = levels[r].findIndex(item => item.id === node.id);
      if (c !== -1) {
        rowIndex = r;
        colIndex = c;
        break;
      }
    }

    if (rowIndex === -1) return node;

    const rowLength = levels[rowIndex].length;
    const totalW = rowLength * hSpacing;
    const startX = Math.max(60, 500 - totalW / 2);

    return {
      ...node,
      x: startX + colIndex * hSpacing,
      y: 60 + rowIndex * vSpacing
    };
  });
}
