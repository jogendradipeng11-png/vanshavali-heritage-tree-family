import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, FileDown, Share2, Sparkles, Camera, Smile, Upload, Link as LinkIcon, RotateCcw } from 'lucide-react';
import { MemberNode, RelationshipLink, Branch, Gender, LivingStatus, MaritalStatus, RelationshipType } from '../types';
import { CARD_WIDTH, CARD_HEIGHT } from '../initialData';
import { STICKER_PRESETS, getDefaultSticker } from '../utils/stickerPresets';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeData: Partial<MemberNode>, linkConfig?: { targetId: string; type: RelationshipType }) => void;
  onDelete?: (nodeId: string) => void;
  onExportSinglePDF?: (node: MemberNode) => void;
  onShareNode?: (node: MemberNode) => void;
  editingNode: MemberNode | null;
  targetLinkNodeId?: string | null;
  nodes: MemberNode[];
  activeBranch: Branch | 'all';
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onExportSinglePDF,
  onShareNode,
  editingNode,
  targetLinkNodeId,
  nodes,
  activeBranch
}) => {
  const [name, setName] = useState('');
  const [relationshipToRoot, setRelationshipToRoot] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [branch, setBranch] = useState<Branch>('paternal');
  const [status, setStatus] = useState<LivingStatus>('alive');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('married');
  const [gotra, setGotra] = useState('');
  const [bansa, setBansa] = useState('');
  const [dob, setDob] = useState('');
  const [dod, setDod] = useState('');
  const [age, setAge] = useState<string>('');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [sticker, setSticker] = useState('');
  const [pictureTab, setPictureTab] = useState<'stickers' | 'upload' | 'url'>('stickers');
  const [selectedStickerCategory, setSelectedStickerCategory] = useState<'all' | 'ancestors' | 'adults' | 'youth' | 'heritage'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Linking fields (for new additions)
  const [linkTargetId, setLinkTargetId] = useState<string>('');
  const [linkRelationType, setLinkRelationType] = useState<RelationshipType>('child');

  useEffect(() => {
    if (editingNode) {
      setName(editingNode.name || '');
      setRelationshipToRoot(editingNode.relationship_to_root || '');
      setGender(editingNode.gender || 'male');
      setBranch(editingNode.branch || 'paternal');
      setStatus(editingNode.status || 'alive');
      setMaritalStatus(editingNode.marital_status || 'married');
      setGotra(editingNode.gotra || '');
      setBansa(editingNode.bansa || '');
      setDob(editingNode.dob || '');
      setDod(editingNode.dod || '');
      setAge(editingNode.age != null ? String(editingNode.age) : '');
      setProfession(editingNode.profession || '');
      setPhone(editingNode.phone || '');
      setAddress(editingNode.address || '');
      setNotes(editingNode.notes || '');
      setPhotoUrl(editingNode.photo_url || '');
      setSticker(editingNode.sticker || '');
    } else {
      const targetNode = targetLinkNodeId ? nodes.find(n => n.id === targetLinkNodeId) : (nodes[0] || null);
      setName('');
      setRelationshipToRoot('');
      setGender('male');
      setBranch(targetNode ? targetNode.branch : (activeBranch === 'maternal' ? 'maternal' : 'paternal'));
      setStatus('alive');
      setMaritalStatus('married');
      setGotra(targetNode?.gotra || '');
      setBansa(targetNode?.bansa || '');
      setDob('');
      setDod('');
      setAge('');
      setProfession('');
      setPhone('');
      setAddress(targetNode?.address || '');
      setNotes('');
      setPhotoUrl('');
      setSticker('');
      setLinkTargetId(targetLinkNodeId || (nodes[0]?.id || ''));
      setLinkRelationType('child');
    }
  }, [editingNode, targetLinkNodeId, nodes, activeBranch, isOpen]);

  // Handle local image upload as Data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Image exceeds 3MB. Please choose a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotoUrl(reader.result);
          setSticker('');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-calculate age whenever DOB or DOD changes
  const handleDateChange = (newDob: string, newDod: string, currentStatus: LivingStatus) => {
    if (!newDob) return;
    try {
      const birthDate = new Date(newDob);
      const endDate = currentStatus === 'deceased' && newDod ? new Date(newDod) : new Date();
      const diff = endDate.getTime() - birthDate.getTime();
      if (diff >= 0) {
        const calculatedAge = Math.abs(new Date(diff).getUTCFullYear() - 1970);
        if (!isNaN(calculatedAge)) {
          setAge(String(calculatedAge));
        }
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedAge = age ? parseInt(age, 10) : null;
    const finalRel = relationshipToRoot.trim() || editingNode?.relationship_to_root || 'Family Member';

    const nodeData: Partial<MemberNode> = {
      name: name.trim(),
      relationship_to_root: finalRel,
      gender,
      branch,
      status,
      marital_status: maritalStatus,
      gotra: gotra.trim(),
      bansa: bansa.trim(),
      dob: dob || '',
      dod: status === 'deceased' ? (dod || '') : '',
      age: isNaN(parsedAge as number) ? null : parsedAge,
      profession: profession.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      photo_url: photoUrl.trim() || undefined,
      sticker: sticker.trim() || undefined
    };

    if (editingNode) {
      onSave(nodeData);
    } else {
      const linkConfig = linkTargetId ? { targetId: linkTargetId, type: linkRelationType } : undefined;
      onSave(nodeData, linkConfig);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-base font-bold tracking-tight">
              {editingNode ? 'Edit Relative Details' : 'Add Family Relative'}
            </h2>
            <p className="text-xs text-slate-400">
              Preserve lineage, Gotra heritage, and family links.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Section: Picture / Sticker Avatar */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                <span className="text-sm">🏷️</span>
                <span>Person Picture / Portrait Sticker</span>
              </label>
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPictureTab('stickers')}
                  className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                    pictureTab === 'stickers'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smile className="w-3 h-3" />
                  <span>Stickers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPictureTab('upload')}
                  className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                    pictureTab === 'upload'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  <span>Upload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPictureTab('url')}
                  className={`px-2 py-0.5 rounded font-bold transition flex items-center gap-1 ${
                    pictureTab === 'url'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>URL</span>
                </button>
              </div>
            </div>

            {/* Current Selected Sticker / Picture Preview Bar */}
            <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="relative shrink-0">
                {photoUrl ? (
                  <div className="w-13 h-13 rounded-2xl overflow-hidden ring-2 ring-indigo-500/30 shadow-md border-2 border-white bg-slate-100 flex items-center justify-center">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-13 h-13 rounded-2xl ring-2 ring-amber-400/40 shadow-md border-2 border-white flex items-center justify-center text-3xl ${
                    branch === 'maternal'
                      ? 'bg-gradient-to-tr from-rose-100 via-pink-50 to-amber-50'
                      : 'bg-gradient-to-tr from-indigo-100 via-sky-50 to-amber-50'
                  }`}>
                    <span>{sticker || getDefaultSticker(gender, status, age ? parseInt(age, 10) : null, relationshipToRoot)}</span>
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 text-[9px] bg-slate-900 text-white rounded-full px-1 shadow border border-white">
                  🏷️
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 text-xs">
                  {photoUrl ? 'Custom Photograph Sticker' : (sticker ? `Sticker: ${sticker}` : 'Default Smart Sticker')}
                </div>
                <div className="text-[11px] text-slate-500">
                  {photoUrl ? 'Displays inside sticker frame on member card' : 'Select a sticker preset or upload a portrait'}
                </div>
              </div>

              {(photoUrl || sticker) && (
                <button
                  type="button"
                  onClick={() => { setPhotoUrl(''); setSticker(''); }}
                  title="Reset to default sticker"
                  className="px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Tab 1: Sticker Gallery */}
            {pictureTab === 'stickers' && (
              <div className="space-y-2">
                {/* Category Filter Pills */}
                <div className="flex flex-wrap gap-1">
                  {(['all', 'ancestors', 'adults', 'youth', 'heritage'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedStickerCategory(cat)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition capitalize ${
                        selectedStickerCategory === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat === 'all' ? '✨ All Stickers' : cat}
                    </button>
                  ))}
                </div>

                {/* Sticker Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                  {STICKER_PRESETS.filter(p => selectedStickerCategory === 'all' || p.category === selectedStickerCategory).map(preset => {
                    const isSelected = sticker === preset.emoji && !photoUrl;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSticker(preset.emoji);
                          setPhotoUrl('');
                        }}
                        title={preset.label}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 relative group cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400/40 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-2xl transform group-hover:scale-110 transition-transform">
                          {preset.emoji}
                        </span>
                        <span className="text-[8px] font-medium text-slate-600 truncate w-full">
                          {preset.label.split('/')[0]}
                        </span>
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[7px]">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 2: Upload File */}
            {pictureTab === 'upload' && (
              <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition hover:bg-indigo-50/30 flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-slate-800 text-xs">
                    Click to Choose Picture from Device
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Supports JPG, PNG, WEBP (Max 3MB) • Instant local preview & offline save
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Image URL */}
            {pictureTab === 'url' && (
              <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700">
                  Web Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => {
                      setPhotoUrl(e.target.value);
                      if (e.target.value) setSticker('');
                    }}
                    placeholder="https://example.com/ancestor-photo.jpg"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 border border-slate-300 rounded-lg"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Paste any public link to a portrait or photograph.
                </p>
              </div>
            )}
          </div>

          {/* Section 1: Core Identity */}
          <div className="space-y-3 pb-3 border-b border-slate-200">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Patel"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Relationship to Root <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={relationshipToRoot}
                  onChange={(e) => setRelationshipToRoot(e.target.value)}
                  placeholder="e.g. Father, Mother, 1st Wife, Son"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                >
                  <option value="male">👨 Male</option>
                  <option value="female">👩 Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Branch, Status, Marital */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Lineage Side</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as Branch)}
                className="w-full px-2.5 py-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-indigo-700 cursor-pointer"
              >
                <option value="paternal">🧔 Main / Paternal</option>
                <option value="maternal">👩 Wife / In-Law</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Living Status</label>
              <select
                value={status}
                onChange={(e) => {
                  const s = e.target.value as LivingStatus;
                  setStatus(s);
                  handleDateChange(dob, dod, s);
                }}
                className="w-full px-2.5 py-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-slate-800 cursor-pointer"
              >
                <option value="alive">🌱 Living</option>
                <option value="deceased">🕊️ Deceased</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Marital Status</label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
                className="w-full px-2.5 py-2.5 border border-slate-300 rounded-xl bg-white font-semibold text-rose-700 cursor-pointer"
              >
                <option value="married">💍 Married</option>
                <option value="unmarried">Single (Unmarried)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Dates & Age */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  handleDateChange(e.target.value, dod, status);
                }}
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {status === 'deceased' ? 'Age at Passing' : 'Current Age'}
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 54"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 font-semibold"
              />
            </div>

            {status === 'deceased' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Passing</label>
                <input
                  type="date"
                  value={dod}
                  onChange={(e) => {
                    setDod(e.target.value);
                    handleDateChange(dob, e.target.value, status);
                  }}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>
            )}
          </div>

          {/* Section 4: Gotra, Bansa, Profession */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Gotra</label>
              <input
                type="text"
                value={gotra}
                onChange={(e) => setGotra(e.target.value)}
                placeholder="e.g. Kashyap"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Bansa</label>
              <input
                type="text"
                value={bansa}
                onChange={(e) => setBansa(e.target.value)}
                placeholder="e.g. Suryavansh"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Profession</label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="e.g. Teacher, Doctor"
                className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          {/* Section 5: Phone & Address */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Address / Village</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Sambalpur, Odisha"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-slate-900"
              />
            </div>
          </div>

          {/* Section 6: Notes / Lore */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Heritage Lore & Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notable deeds, migration history, ancestral records..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 resize-none"
            />
          </div>

          {/* Section 7: Hierarchy Linking (When creating new member) */}
          {!editingNode && nodes.length > 0 && (
            <div className="pt-3 border-t border-slate-200 space-y-2 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
              <p className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Connect To Member in Tree
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Select Relative</label>
                  <select
                    value={linkTargetId}
                    onChange={(e) => setLinkTargetId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium"
                  >
                    <option value="">-- No Direct Link --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.relationship_to_root})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">This Person Is Their:</label>
                  <select
                    value={linkRelationType}
                    onChange={(e) => setLinkRelationType(e.target.value as RelationshipType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 font-medium"
                  >
                    <option value="parent">Parent / Father / Mother (Prior Gen ⬆️)</option>
                    <option value="child">Child / Son / Daughter (Next Gen ⬇️)</option>
                    <option value="spouse">Spouse / Wife / Husband (Horizontal 💍)</option>
                    <option value="sibling">Sibling / Brother / Sister (Horizontal 👥)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions (When Editing) */}
          {editingNode && (
            <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                {onExportSinglePDF && (
                  <button
                    type="button"
                    onClick={() => onExportSinglePDF(editingNode)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold border border-indigo-200 flex items-center gap-1.5 transition"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Single Person PDF</span>
                  </button>
                )}
                {onShareNode && (
                  <button
                    type="button"
                    onClick={() => onShareNode(editingNode)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold border border-emerald-200 flex items-center gap-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Node</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            {editingNode && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(editingNode.id)}
                className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition"
              >
                {editingNode ? 'Save Changes' : 'Add to Tree'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
