export interface StickerPreset {
  id: string;
  emoji: string;
  label: string;
  category: 'ancestors' | 'adults' | 'youth' | 'heritage';
}

export const STICKER_PRESETS: StickerPreset[] = [
  // Ancestors & Elders
  { id: 'turban_elder', emoji: '👳‍♂️', label: 'Patriarch / Zamindar', category: 'ancestors' },
  { id: 'grandfather', emoji: '👴', label: 'Grandfather / Elder', category: 'ancestors' },
  { id: 'grandmother', emoji: '👵', label: 'Grandmother', category: 'ancestors' },
  { id: 'matriarch', emoji: '🧕', label: 'Matriarch in Shawl', category: 'ancestors' },
  { id: 'king', emoji: '👑', label: 'Royal Ancestor', category: 'ancestors' },
  { id: 'scholar_elder', emoji: '🧙‍♂️', label: 'Wise Sage / Guru', category: 'ancestors' },
  
  // Adults & Family
  { id: 'father', emoji: '👨', label: 'Father / Gentleman', category: 'adults' },
  { id: 'mother', emoji: '👩', label: 'Mother / Gentlewoman', category: 'adults' },
  { id: 'groom', emoji: '🤵', label: 'Husband / Groom', category: 'adults' },
  { id: 'bride', emoji: '👰', label: 'Wife / Bride', category: 'adults' },
  { id: 'woman_flower', emoji: '👸', label: 'Lady / Princess', category: 'adults' },
  { id: 'doctor', emoji: '👩‍⚕️', label: 'Physician / Doctor', category: 'adults' },
  { id: 'teacher', emoji: '👨‍🏫', label: 'Headmaster / Scholar', category: 'adults' },
  { id: 'architect', emoji: '👨‍💼', label: 'Professional / Planner', category: 'adults' },
  { id: 'farmer', emoji: '🌾', label: 'Agriculturist / Landowner', category: 'adults' },

  // Youth & Heirs
  { id: 'boy', emoji: '👦', label: 'Young Son / Boy', category: 'youth' },
  { id: 'girl', emoji: '👧', label: 'Young Daughter / Girl', category: 'youth' },
  { id: 'student', emoji: '🧑‍🎓', label: 'Student / Scion', category: 'youth' },
  { id: 'baby', emoji: '👶', label: 'Infant / New Born', category: 'youth' },

  // Heritage & Auspicious
  { id: 'lotus', emoji: '🪷', label: 'Auspicious Lotus', category: 'heritage' },
  { id: 'diya', emoji: '🪔', label: 'Heritage Diya', category: 'heritage' },
  { id: 'peace', emoji: '🕊️', label: 'Memorial Spirit', category: 'heritage' },
  { id: 'tree', emoji: '🌳', label: 'Lineage Branch', category: 'heritage' }
];

export function getDefaultSticker(gender: string, status: string, age?: number | null, relationship?: string): string {
  const rel = (relationship || '').toLowerCase();
  if (status === 'deceased') {
    if (rel.includes('great-grand')) return '👳‍♂️';
    if (rel.includes('grand')) return '👴';
    return '🕊️';
  }
  if (age && age < 12) return gender === 'female' ? '👧' : '👦';
  if (rel.includes('wife') || rel.includes('bride')) return '👰';
  if (rel.includes('husband') || rel.includes('groom')) return '🤵';
  if (rel.includes('father-in-law')) return '👴';
  if (rel.includes('father')) return '👨';
  if (rel.includes('mother')) return '👩';
  if (gender === 'female') return '👩';
  return '👨';
}
