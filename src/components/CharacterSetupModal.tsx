import React, { useState, useEffect, useRef } from 'react';
import {
  SpeciesType,
  SkinTone,
  Gender,
  Direction,
  PlayerMob,
  ItemType,
  DepartmentType,
  HairstyleType,
  FacialHairType,
} from '../types';
import {
  drawDmiSprite,
  getSpeciesDmiInfo,
  getWornEquipmentDmi,
  getInHandDmiInfo,
} from '../systems/dmiSystem';
import { DEPARTMENTS, STATION_ROLES, RoleDefinition } from '../data/roles';
import {
  User,
  Shield,
  Dna,
  Briefcase,
  RotateCw,
  Sparkles,
  Check,
  X,
  Zap,
  Flame,
  Scissors,
  Palette,
  Eye,
} from 'lucide-react';

interface CharacterSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerMob;
  onSaveProfile: (profile: {
    name: string;
    gender: Gender;
    age: number;
    species: SpeciesType;
    skinTone: SkinTone;
    department: DepartmentType;
    job: string;
    hairstyle: HairstyleType;
    hairColor: string;
    facialHair: FacialHairType;
    facialHairColor: string;
    eyeColor: string;
    furColor?: string;
    earType?: string;
    tailType?: string;
    startingItems: Record<string, ItemType | undefined>;
  }) => void;
}

export interface SpeciesTrait {
  type: SpeciesType;
  name: string;
  lore: string;
  origin: string;
  perks: string[];
  vulnerabilities: string[];
  features: string[];
}

// Strictly compliant with user requirements:
// Removed: Golem, Skeleton, Zombie, Shadow person, Flyperson, Podperson
// Added: Vulpakanin, Tajaran, Felinid, Moth, Plasmaman, Abductor, Lizard, Human
export const SPECIES_CATALOG: SpeciesTrait[] = [
  {
    type: 'Human',
    name: 'Human (Homo Sapiens)',
    origin: 'Sol System (Earth / Mars)',
    lore: 'The industrious backbone of NanoTrasen. Adaptable and resilient across all station sectors.',
    perks: ['Universal equipment compatibility', '12 diverse skin tones', 'Balanced metabolic rate'],
    vulnerabilities: ['Susceptible to decompression asphyxiation and toxins'],
    features: ['Custom skin tone', 'Wide selection of hairstyles', 'Beard & mustache styling'],
  },
  {
    type: 'Vulpakanin',
    name: 'Vulpakanin (Goob Station)',
    origin: 'Altam Vulpis System',
    lore: 'Canine-vulpine humanoids renowned in Goob Station for agility, fluffy bushy tails, keen scent tracking, and fox-like ears.',
    perks: ['Superior low-light night vision', 'Natural claw defense (+1 dmg)', 'Padded paws: quiet movement'],
    vulnerabilities: ['Sensitive ears take +25% flashbang disorient damage'],
    features: ['Fox ears & bushy tail', 'Fur coloration choices', 'Vulpine tuft hairstyles'],
  },
  {
    type: 'Tajaran',
    name: 'Tajaran (Goob Station / Ahdomai)',
    origin: 'Ahdomai Cold World',
    lore: 'Graceful feline race with warm thick coats, sharp retractile claws, sensitive whiskers, and nimble athletic reflexes.',
    perks: ['Dense fur grants cold resistance (+50K tolerance)', 'Razor claws (+2 unarmed damage)', 'Feline leap balance'],
    vulnerabilities: ['Overheats faster in high-temp plasma fires'],
    features: ['Cat ears & whip tail', 'Striped/spotted fur coats', 'Feline mane haircuts'],
  },
  {
    type: 'Lizard',
    name: 'Lizardperson (Unathi)',
    origin: 'Moghes Desert Waste',
    lore: 'Cold-blooded reptilian warriors covered in armored scales and wielding formidable razor claws.',
    perks: ['+2 Unarmed claw slash damage', '+15% Natural brute impact resistance', 'Immunity to weed pollen'],
    vulnerabilities: ['Cold blooded: takes 2x hypothermia damage in space vacuum'],
    features: ['Horns & spine crests', 'Serrated tail', 'Scaled pigments'],
  },
  {
    type: 'Felinid',
    name: 'Felinid (Catperson)',
    origin: 'Synthetic Biomodification',
    lore: 'Gene-spliced humanoids with feline sensory ears and tails. Popular throughout station entertainment and service.',
    perks: ['Enhanced hearing range', 'Soft footfalls', 'Balanced acrobatics'],
    vulnerabilities: ['Vulnerable to ear infections and sonic weapons'],
    features: ['Cute cat ears & tail', 'High hair versatility', 'Expressive moods'],
  },
  {
    type: 'Moth',
    name: 'Mothperson (Lepidoptera)',
    origin: 'Teshari Nebula',
    lore: 'Silken nocturnal flyers covered in fluffy down with feather antennae and delicate translucent wings.',
    perks: ['Can flutter wings to glide over wet floors', '360-degree compound vision', 'Night vision'],
    vulnerabilities: ['Attracted to bright station lights; wings burn easily'],
    features: ['Feather antennae', 'Wings', 'Fluffy neck fluff'],
  },
  {
    type: 'Plasmaman',
    name: 'Plasmaman (Hazard)',
    origin: 'Plasma Extraction Mining Asteroids',
    lore: 'Exotic skeletal lifeforms bound entirely to purple plasma. Must always wear hermetic suits to avoid self-igniting.',
    perks: ['Complete immunity to radiation and poison toxins', 'Does not breathe oxygen (consumes plasma)'],
    vulnerabilities: ['Spontaneously bursts into flames when exposed to room atmosphere without an envirosuit'],
    features: ['Glowing plasma skull', 'Specialized envirosuit helmet'],
  },
  {
    type: 'Abductor',
    name: 'Abductor (Grey Alien)',
    origin: 'Deep Spacemothership',
    lore: 'Enigmatic grey telepaths possessing advanced bio-engineering probes, cloaking tech, and silent communication.',
    perks: ['Telepathic mind transmission', 'Silent walking', 'High tech engineering intuition'],
    vulnerabilities: ['Fragile physical stature; low blunt trauma threshold'],
    features: ['Large almond obsidian eyes', 'Smooth grey skin', 'No body hair'],
  },
];

export const RANDOM_NAMES = [
  'Jack Carver',
  'Gordon Freeman',
  'Ellen Ripley',
  'Arthur Dent',
  'Horatio Caine',
  'Deckard Shaw',
  'Sarah Connor',
  'Miles O\'Brien',
  'Dana Scully',
  'Fox Mulder',
  'Isaac Clarke',
  'Samantha Carter',
  'John Sheppard',
  'Malcolm Reynolds',
  'Kaylee Frye',
  'Vulpix Carter',
  'Taj Shen',
  'David Bowman',
  'Rick Deckard',
  'Nyx Shadow',
];

export const SKIN_TONES: { id: SkinTone; label: string; color: string }[] = [
  { id: 'caucasian1', label: 'Caucasian Light', color: '#ffdfd2' },
  { id: 'caucasian2', label: 'Caucasian Medium', color: '#f5c3a6' },
  { id: 'caucasian3', label: 'Caucasian Tan', color: '#e5a582' },
  { id: 'latino', label: 'Latino', color: '#d99767' },
  { id: 'mediterranean', label: 'Mediterranean', color: '#cf9163' },
  { id: 'asian1', label: 'East Asian 1', color: '#ffe4c4' },
  { id: 'asian2', label: 'East Asian 2', color: '#eed0a6' },
  { id: 'arab', label: 'Arab', color: '#c48e58' },
  { id: 'indian', label: 'South Asian', color: '#9e6438' },
  { id: 'african1', label: 'African Dark', color: '#593b22' },
  { id: 'african2', label: 'African Deep', color: '#3b2413' },
  { id: 'albino', label: 'Albino Pale', color: '#fff5f2' },
];

export const HAIRSTYLES: { id: HairstyleType; label: string }[] = [
  { id: 'Bald', label: 'Bald / Shaved' },
  { id: 'Crewcut', label: 'Military Crewcut' },
  { id: 'Short', label: 'Short Parted' },
  { id: 'Long', label: 'Long Waves' },
  { id: 'Ponytail', label: 'High Ponytail' },
  { id: 'Bob', label: 'Stylized Bob' },
  { id: 'Afro', label: 'Voluminous Afro' },
  { id: 'Mohawk', label: 'Punk Mohawk' },
  { id: 'Braids', label: 'Tied Braids' },
  { id: 'Dreadlocks', label: 'Dreadlocks' },
  { id: 'Anime', label: 'Spiky Anime' },
  { id: 'Bedhead', label: 'Messy Bedhead' },
  { id: 'VulpineTuft', label: 'Vulpine Tuft (Goob)' },
  { id: 'FelineMane', label: 'Feline Mane (Tajaran)' },
];

export const FACIAL_HAIR: { id: FacialHairType; label: string }[] = [
  { id: 'Shaved', label: 'Clean Shaven' },
  { id: 'Stubble', label: '5 O\'Clock Stubble' },
  { id: 'FullBeard', label: 'Full Lumberjack Beard' },
  { id: 'Goatee', label: 'Neat Goatee' },
  { id: 'Mustache', label: 'Handlebar Mustache' },
  { id: 'VanDyke', label: 'Van Dyke' },
  { id: 'Sideburns', label: 'Mutton Chops' },
  { id: 'Whiskers', label: 'Feline Whiskers' },
];

export const HAIR_COLORS = [
  { name: 'Jet Black', color: '#171717' },
  { name: 'Dark Brown', color: '#3d2314' },
  { name: 'Chestnut', color: '#63391d' },
  { name: 'Golden Blonde', color: '#d4af37' },
  { name: 'Platinum', color: '#f5f5f0' },
  { name: 'Ginger Red', color: '#b84414' },
  { name: 'Auburn', color: '#7a2016' },
  { name: 'Silver Grey', color: '#9e9e9e' },
  { name: 'Cyber Blue', color: '#0284c7' },
  { name: 'Neon Pink', color: '#ec4899' },
  { name: 'Toxic Green', color: '#10b981' },
  { name: 'Void Purple', color: '#8b5cf6' },
];

export const FUR_COLORS = [
  { name: 'Red Fox', color: '#c2410c' },
  { name: 'Arctic Snow', color: '#f8fafc' },
  { name: 'Shadow Obsidian', color: '#1e293b' },
  { name: 'Silver Fox', color: '#64748b' },
  { name: 'Desert Sand', color: '#d97706' },
  { name: 'Calico Patch', color: '#ea580c' },
];

export const EYE_COLORS = [
  { name: 'Sapphire Blue', color: '#2563eb' },
  { name: 'Emerald Green', color: '#16a34a' },
  { name: 'Amber Hazel', color: '#d97706' },
  { name: 'Dark Brown', color: '#451a03' },
  { name: 'Ruby Red', color: '#dc2626' },
  { name: 'Amethyst Violet', color: '#7c3aed' },
  { name: 'Cyan Neon', color: '#06b6d4' },
];

export const CharacterSetupModal: React.FC<CharacterSetupModalProps> = ({
  isOpen,
  onClose,
  player,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'identity' | 'appearance' | 'job'>('identity');
  const [name, setName] = useState(player.name || 'Staff Assistant');
  const [gender, setGender] = useState<Gender>(player.gender || 'male');
  const [age, setAge] = useState(player.age || 28);
  const [species, setSpecies] = useState<SpeciesType>(player.species || 'Human');
  const [skinTone, setSkinTone] = useState<SkinTone>(player.skinTone || 'caucasian1');
  const [department, setDepartment] = useState<DepartmentType>(player.department || 'Civilian');
  const [selectedJobId, setSelectedJobId] = useState<string>(player.job || 'assistant');
  const [hairstyle, setHairstyle] = useState<HairstyleType>(player.hairstyle || 'Short');
  const [hairColor, setHairColor] = useState<string>(player.hairColor || '#3d2314');
  const [facialHair, setFacialHair] = useState<FacialHairType>(player.facialHair || 'Shaved');
  const [facialHairColor, setFacialHairColor] = useState<string>(player.facialHairColor || '#3d2314');
  const [eyeColor, setEyeColor] = useState<string>(player.eyeColor || '#2563eb');
  const [furColor, setFurColor] = useState<string>(player.furColor || '#c2410c');
  const [rolledSleeves, setRolledSleeves] = useState<boolean>(player.rolledSleeves || false);
  const [previewDir, setPreviewDir] = useState<Direction>('SOUTH');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Active role
  const selectedRole = STATION_ROLES.find((r) => r.id === selectedJobId) || STATION_ROLES[0];
  const selectedSpeciesTrait = SPECIES_CATALOG.find((s) => s.type === species) || SPECIES_CATALOG[0];

  // Randomize name
  const handleRandomName = () => {
    const rName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    setName(rName);
  };

  // Rotate preview direction
  const rotateDir = () => {
    const dirs: Direction[] = ['SOUTH', 'WEST', 'NORTH', 'EAST'];
    const idx = dirs.indexOf(previewDir);
    setPreviewDir(dirs[(idx + 1) % 4]);
  };

  // Render character preview in canvas with hair overlay
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dark grid background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Centered scale 3.5x
    const scale = 3.5;
    const drawX = Math.floor((canvas.width - 32 * scale) / 2);
    const drawY = Math.floor((canvas.height - 32 * scale) / 2);

    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.scale(scale, scale);

    // 1. Species base body
    const baseDmi = getSpeciesDmiInfo(species, skinTone, gender);
    const drawn = drawDmiSprite(ctx, baseDmi.dmi, baseDmi.state, 0, 0, { dir: previewDir });
    if (!drawn) {
      // Fallback silhouette
      ctx.fillStyle = species === 'Vulpakanin' || species === 'Tajaran' ? furColor : '#fed7aa';
      ctx.fillRect(10, 8, 12, 18);
    }

    // 2. Ears & Tail for Vulpakanin / Tajaran
    if (species === 'Vulpakanin' || species === 'Tajaran') {
      ctx.fillStyle = furColor;
      // Ears
      ctx.fillRect(8, 5, 4, 5);
      ctx.fillRect(20, 5, 4, 5);
      // Bushy tail behind
      if (previewDir !== 'NORTH') {
        ctx.fillRect(22, 18, 6, 8);
      }
    }

    // 3. Hair overlay
    if (hairstyle !== 'Bald') {
      ctx.fillStyle = hairColor;
      if (hairstyle === 'Mohawk') {
        ctx.fillRect(14, 4, 4, 8);
      } else if (hairstyle === 'Afro') {
        ctx.fillRect(9, 4, 14, 10);
      } else if (hairstyle === 'Ponytail') {
        ctx.fillRect(10, 5, 12, 6);
        ctx.fillRect(7, 8, 4, 8);
      } else if (hairstyle === 'VulpineTuft' || hairstyle === 'FelineMane') {
        ctx.fillRect(10, 4, 12, 8);
        ctx.fillRect(8, 8, 3, 5);
        ctx.fillRect(21, 8, 3, 5);
      } else {
        // Short / Bob / Long default
        ctx.fillRect(10, 5, 12, 6);
        if (hairstyle === 'Long') {
          ctx.fillRect(9, 9, 3, 9);
          ctx.fillRect(20, 9, 3, 9);
        }
      }
    }

    // 4. Facial hair
    if (facialHair !== 'Shaved') {
      ctx.fillStyle = facialHairColor;
      if (facialHair === 'FullBeard') {
        ctx.fillRect(12, 14, 8, 4);
      } else if (facialHair === 'Mustache') {
        ctx.fillRect(12, 13, 8, 2);
      } else if (facialHair === 'Whiskers') {
        ctx.fillRect(9, 13, 3, 1);
        ctx.fillRect(20, 13, 3, 1);
      }
    }

    // 5. Back item
    if (selectedRole.loadout.back) {
      const backDmi = getWornEquipmentDmi('back', selectedRole.loadout.back);
      if (backDmi) drawDmiSprite(ctx, backDmi.dmi, backDmi.state, 0, 0, { dir: previewDir });
    }

    // 6. Uniform
    if (selectedRole.loadout.uniform) {
      const uniformDmi = getWornEquipmentDmi('uniform', selectedRole.loadout.uniform, rolledSleeves);
      if (uniformDmi) drawDmiSprite(ctx, uniformDmi.dmi, uniformDmi.state, 0, 0, { dir: previewDir });
    }

    // 7. Shoes
    if (selectedRole.loadout.shoes) {
      const shoesDmi = getWornEquipmentDmi('shoes', selectedRole.loadout.shoes);
      if (shoesDmi) drawDmiSprite(ctx, shoesDmi.dmi, shoesDmi.state, 0, 0, { dir: previewDir });
    }

    // 8. Suit
    if (selectedRole.loadout.suit) {
      const suitDmi = getWornEquipmentDmi('suit', selectedRole.loadout.suit);
      if (suitDmi) drawDmiSprite(ctx, suitDmi.dmi, suitDmi.state, 0, 0, { dir: previewDir });
    }

    // 9. Mask
    if (selectedRole.loadout.mask) {
      const maskDmi = getWornEquipmentDmi('mask', selectedRole.loadout.mask);
      if (maskDmi) drawDmiSprite(ctx, maskDmi.dmi, maskDmi.state, 0, 0, { dir: previewDir });
    }

    // 10. Head
    if (selectedRole.loadout.head) {
      const headDmi = getWornEquipmentDmi('head', selectedRole.loadout.head);
      if (headDmi) drawDmiSprite(ctx, headDmi.dmi, headDmi.state, 0, 0, { dir: previewDir });
    }

    // 11. Hands
    if (selectedRole.loadout.left_hand) {
      const inHand = getInHandDmiInfo('left', selectedRole.loadout.left_hand);
      drawDmiSprite(ctx, inHand.dmi, inHand.state, 0, 0, { dir: previewDir });
    }
    if (selectedRole.loadout.right_hand) {
      const inHand = getInHandDmiInfo('right', selectedRole.loadout.right_hand);
      drawDmiSprite(ctx, inHand.dmi, inHand.state, 0, 0, { dir: previewDir });
    }

    ctx.restore();
  }, [
    isOpen,
    species,
    skinTone,
    gender,
    previewDir,
    selectedRole,
    rolledSleeves,
    hairstyle,
    hairColor,
    facialHair,
    facialHairColor,
    furColor,
  ]);

  if (!isOpen) return null;

  const handleApply = () => {
    onSaveProfile({
      name,
      gender,
      age,
      species,
      skinTone,
      department,
      job: selectedRole.id,
      hairstyle,
      hairColor,
      facialHair,
      facialHairColor,
      eyeColor,
      furColor: species === 'Vulpakanin' || species === 'Tajaran' ? furColor : undefined,
      startingItems: selectedRole.loadout,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-cyan-950/40 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl text-white shadow-md shadow-cyan-900/40">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center space-x-2">
                <span>Sector 13 Crew Manifest & Character Setup</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-normal">
                  Goob Station Edition
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Species, Hair & Cosmetics, Department Roles & Starting Equipment
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`px-4 py-2.5 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center space-x-2 ${
              activeTab === 'identity'
                ? 'bg-slate-900 border-t-2 border-x border-cyan-500 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dna className="w-4 h-4" />
            <span>1. Identity & Species</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`px-4 py-2.5 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center space-x-2 ${
              activeTab === 'appearance'
                ? 'bg-slate-900 border-t-2 border-x border-cyan-500 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>2. Hairstyles & Cosmetics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('job')}
            className={`px-4 py-2.5 font-mono text-xs font-bold rounded-t-lg transition-all flex items-center space-x-2 ${
              activeTab === 'job'
                ? 'bg-slate-900 border-t-2 border-x border-cyan-500 text-cyan-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>3. Department & Job Assignment</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Live 360 Paperdoll Preview */}
          <div className="md:col-span-4 flex flex-col space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  360° Paperdoll Preview
                </span>
                <button
                  type="button"
                  onClick={rotateDir}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs font-mono transition-colors"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>{previewDir}</span>
                </button>
              </div>

              {/* Canvas viewport */}
              <div className="relative border-2 border-slate-700 rounded-lg bg-slate-950 overflow-hidden shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={150}
                  height={150}
                  className="block mx-auto cursor-pointer"
                  onClick={rotateDir}
                  title="Click to spin character"
                />
                <div className="absolute bottom-1 right-2 text-[10px] font-mono text-slate-500 pointer-events-none">
                  Click to turn
                </div>
              </div>

              {/* Quick toggles */}
              <div className="mt-3 w-full space-y-2">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-300 font-mono">Rolled Sleeves</span>
                  <button
                    type="button"
                    onClick={() => setRolledSleeves(!rolledSleeves)}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-colors ${
                      rolledSleeves
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rolledSleeves ? 'ROLLED' : 'STANDARD'}
                  </button>
                </div>
              </div>
            </div>

            {/* Identity Summary Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Name:</span>
                <span className="text-slate-100 font-bold">{name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Species:</span>
                <span className="text-cyan-400 font-bold">{species}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">Department:</span>
                <span className="text-amber-400 font-bold">{department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="text-emerald-400 font-bold">{selectedRole.title}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Tab View */}
          <div className="md:col-span-8 flex flex-col space-y-4">
            {/* TAB 1: IDENTITY & SPECIES */}
            {activeTab === 'identity' && (
              <div className="space-y-4">
                {/* Name & Gender */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                      Full Name
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={24}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRandomName}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-cyan-400 transition-colors flex items-center space-x-1"
                        title="Random Name"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-mono">Random</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="neuter">Neuter</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                        Age ({age})
                      </label>
                      <input
                        type="range"
                        min={18}
                        max={80}
                        value={age}
                        onChange={(e) => setAge(parseInt(e.target.value, 10))}
                        className="w-full accent-cyan-400 mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Species Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold flex items-center space-x-1.5">
                      <Dna className="w-4 h-4" />
                      <span>Select Species ({SPECIES_CATALOG.length} Allowed Races)</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SPECIES_CATALOG.map((s) => {
                      const isSelected = species === s.type;
                      return (
                        <button
                          key={s.type}
                          type="button"
                          onClick={() => setSpecies(s.type)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-cyan-950/70 border-cyan-400 text-slate-100 shadow-md ring-1 ring-cyan-400/40'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-mono text-xs font-bold leading-tight truncate">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-1">
                            {s.origin}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Species Lore & Perks */}
                  <div className="mt-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
                    <div className="text-cyan-300 font-bold mb-1">{selectedSpeciesTrait.name}</div>
                    <p className="text-slate-400 mb-2">{selectedSpeciesTrait.lore}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                          <Zap className="w-3 h-3" />
                          <span>Racial Perks:</span>
                        </span>
                        {selectedSpeciesTrait.perks.map((p, i) => (
                          <div key={i} className="text-slate-300 text-[11px] flex items-start space-x-1">
                            <span className="text-emerald-400">•</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                          <Flame className="w-3 h-3" />
                          <span>Vulnerabilities:</span>
                        </span>
                        {selectedSpeciesTrait.vulnerabilities.map((v, i) => (
                          <div key={i} className="text-slate-300 text-[11px] flex items-start space-x-1">
                            <span className="text-amber-400">•</span>
                            <span>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: APPEARANCE & COSMETICS */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                {/* Hairstyles Picker */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold mb-2 flex items-center space-x-1.5">
                    <Scissors className="w-4 h-4" />
                    <span>Hairstyle Selection</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {HAIRSTYLES.map((h) => {
                      const isSelected = hairstyle === h.id;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setHairstyle(h.id)}
                          className={`px-3 py-2 rounded-lg border text-left text-xs font-mono transition-all ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-slate-100 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {h.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hair Color Palette */}
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase mb-2 flex items-center space-x-1">
                    <Palette className="w-3.5 h-3.5" />
                    <span>Hair Color</span>
                  </h4>
                  <div className="grid grid-cols-6 gap-2">
                    {HAIR_COLORS.map((hc) => (
                      <button
                        key={hc.name}
                        type="button"
                        onClick={() => {
                          setHairColor(hc.color);
                          setFacialHairColor(hc.color);
                        }}
                        className={`h-7 rounded-lg border flex items-center justify-center transition-all ${
                          hairColor === hc.color
                            ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                        style={{ backgroundColor: hc.color }}
                        title={hc.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Facial Hair */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold mb-2">
                    Facial Hair & Markings
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FACIAL_HAIR.map((fh) => {
                      const isSelected = facialHair === fh.id;
                      return (
                        <button
                          key={fh.id}
                          type="button"
                          onClick={() => setFacialHair(fh.id)}
                          className={`px-3 py-2 rounded-lg border text-left text-xs font-mono transition-all ${
                            isSelected
                              ? 'bg-cyan-950/80 border-cyan-400 text-slate-100 shadow-sm'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {fh.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Species Markings & Fur Colors (For Vulpakanin & Tajaran) */}
                {(species === 'Vulpakanin' || species === 'Tajaran') && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold mb-2">
                      Goob Station Fur Coloration ({species})
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {FUR_COLORS.map((fc) => (
                        <button
                          key={fc.name}
                          type="button"
                          onClick={() => setFurColor(fc.color)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            furColor === fc.color
                              ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <div
                            className="w-full h-5 rounded mb-1 mx-auto"
                            style={{ backgroundColor: fc.color }}
                          />
                          <span className="text-[10px] font-mono text-slate-300 block truncate">
                            {fc.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skin Complexion (For Humans) */}
                {species === 'Human' && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <h3 className="text-xs font-mono text-slate-400 uppercase mb-2">
                      Skin Complexion (12 Tones)
                    </h3>
                    <div className="grid grid-cols-6 gap-2">
                      {SKIN_TONES.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setSkinTone(st.id)}
                          className={`h-7 rounded-lg border transition-all ${
                            skinTone === st.id
                              ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                              : 'border-slate-700 hover:border-slate-500'
                          }`}
                          style={{ backgroundColor: st.color }}
                          title={st.label}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Eye Colors */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-xs font-mono text-slate-400 uppercase mb-2 flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Eye Iris Color</span>
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {EYE_COLORS.map((ec) => (
                      <button
                        key={ec.name}
                        type="button"
                        onClick={() => setEyeColor(ec.color)}
                        className={`h-7 rounded-lg border transition-all ${
                          eyeColor === ec.color
                            ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                        style={{ backgroundColor: ec.color }}
                        title={ec.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DEPARTMENT & JOB ASSIGNMENT */}
            {activeTab === 'job' && (
              <div className="space-y-4">
                {/* Department Filter Buttons */}
                <div>
                  <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold mb-2 flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4" />
                    <span>All Station Departments</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DEPARTMENTS.map((dept) => {
                      const isSelected = department === dept.type;
                      return (
                        <button
                          key={dept.type}
                          type="button"
                          onClick={() => {
                            setDepartment(dept.type);
                            const firstInDept = STATION_ROLES.find((r) => r.department === dept.type);
                            if (firstInDept) setSelectedJobId(firstInDept.id);
                          }}
                          className={`px-3 py-2 rounded-xl border text-left text-xs font-mono transition-all flex items-center space-x-2 ${
                            isSelected
                              ? 'bg-slate-800 border-cyan-400 text-slate-100 shadow-md ring-1 ring-cyan-400/30'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span>{dept.icon}</span>
                          <span className="font-bold truncate">{dept.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Available Roles in Selected Department */}
                <div>
                  <h4 className="text-xs font-mono text-slate-400 uppercase mb-2">
                    Roles in {department}:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STATION_ROLES.filter((r) => r.department === department).map((role) => {
                      const isSelected = selectedJobId === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedJobId(role.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'bg-slate-800 border-cyan-400 text-slate-100 shadow-lg ring-1 ring-cyan-400/40'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold font-mono text-sm text-slate-100">
                              {role.title}
                            </span>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded font-mono font-bold text-white"
                              style={{ backgroundColor: role.color }}
                            >
                              {role.department}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono line-clamp-2">
                            {role.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Role Starting Gear Breakdown */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="text-xs font-mono text-cyan-300 font-bold uppercase mb-2">
                    Starting Equipment Loadout for {selectedRole.title}:
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                    {Object.entries(selectedRole.loadout).map(([slot, item]) => {
                      if (!item) return null;
                      return (
                        <span
                          key={slot}
                          className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-cyan-300 rounded-md"
                        >
                          <span className="text-slate-500 uppercase text-[10px] mr-1">{slot}:</span>
                          <span>{item}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-lg transition-colors"
          >
            Cancel / Close
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-900/40 flex items-center space-x-2 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Apply Profile & Enter Station</span>
          </button>
        </div>
      </div>
    </div>
  );
};
