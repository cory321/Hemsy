export type PresetIconKey = string;

export interface PresetItem {
  key: PresetIconKey;
  label: string;
}

export interface PresetCategory {
  id: string;
  label: string;
  items: PresetItem[];
}

// Central mapping from our keys to public asset paths
const presetKeyToPath: Record<PresetIconKey, string> = {
  // Accessories
  'accessories.belt': '/presets/garments/accessories/belt.svg',
  'accessories.bowtie': '/presets/garments/accessories/bowtie.svg',
  'accessories.gloves': '/presets/garments/accessories/gloves.svg',
  'accessories.hat': '/presets/garments/accessories/hat.svg',
  'accessories.scarf': '/presets/garments/accessories/scarf.svg',
  'accessories.tie': '/presets/garments/accessories/tie.svg',

  // Bottoms
  'bottoms.dress_pants_slacks':
    '/presets/garments/bottoms/dress-pants-slacks.svg',
  'bottoms.jeans': '/presets/garments/bottoms/jeans.svg',
  'bottoms.shorts': '/presets/garments/bottoms/shorts.svg',
  'bottoms.skirt_1': '/presets/garments/bottoms/skirt-1.svg',
  'bottoms.skirt_2': '/presets/garments/bottoms/skirt-2.svg',

  // Dresses & Formal
  'dresses.casual_dress_knee_length':
    '/presets/garments/dresses and formal/casual-dress-knee-length.svg',
  'dresses.casual_dress_knee_length_flowy':
    '/presets/garments/dresses and formal/casual-dress-knee-length-flowy.svg',
  'dresses.evening_gown_1':
    '/presets/garments/dresses and formal/evening-gown-formal-1.svg',
  'dresses.evening_gown_2':
    '/presets/garments/dresses and formal/evening-gown-formal-2.svg',
  'dresses.wedding_dress':
    '/presets/garments/dresses and formal/wedding-dress.svg',
  'dresses.suit_jacket': '/presets/garments/dresses and formal/suit-jacket.svg',
  'dresses.waistcoat_vest':
    '/presets/garments/dresses and formal/waistcoat-vest.svg',

  // Outerwear
  'outerwear.cardigan': '/presets/garments/outerwear/cardigan.svg',
  'outerwear.jacket': '/presets/garments/outerwear/jacket.svg',
  'outerwear.jumpsuit_romper':
    '/presets/garments/outerwear/jumpsuit-romper.svg',
  'outerwear.overalls': '/presets/garments/outerwear/overalls.svg',
  'outerwear.overcoat': '/presets/garments/outerwear/overcoat.svg',
  'outerwear.puffer_jacket': '/presets/garments/outerwear/puffer-jacket.svg',

  // Specialty / Non-wearable
  'specialty.blankets': '/presets/garments/specialty/blankets.svg',
  'specialty.childrens_generic':
    '/presets/garments/specialty/childrens-generic.svg',
  'specialty.sportswear_jersey':
    '/presets/garments/specialty/sportswear-jersey.svg',
  'specialty.choir_graduation_robe':
    '/presets/garments/specialty/choir-graduation-robe.svg',
  'specialty.costume_theatrical':
    '/presets/garments/specialty/costume-theatrical.svg',
  'specialty.uniform_workwear':
    '/presets/garments/specialty/uniform-workwear.svg',

  // Tops
  'tops.blouse': '/presets/garments/tops/blouse.svg',
  'tops.button_up_shirt': '/presets/garments/tops/button-up-shirt.svg',
  'tops.camisole': '/presets/garments/tops/camisole.svg',
  'tops.hoodie_pullover': '/presets/garments/tops/hoodie-pullover.svg',
  'tops.sweater_knit_top': '/presets/garments/tops/sweater-knit-top.svg',
  'tops.tank_top': '/presets/garments/tops/tank-top.svg',
  'tops.tshirt': '/presets/garments/tops/tshirt.svg',
};

export function getPresetIconUrl(key?: PresetIconKey | null): string | null {
  if (!key) return null;
  const path = presetKeyToPath[key];
  if (!path) return null;
  // Ensure spaces and special characters are correctly encoded in URLs
  return encodeURI(path);
}

export function getPresetIconLabel(key?: PresetIconKey | null): string | null {
  if (!key) return null;

  // Search through all categories to find the item with matching key
  for (const category of presetCatalog) {
    const item = category.items.find((item) => item.key === key);
    if (item) {
      return item.label;
    }
  }

  return null;
}

export const presetCatalog: PresetCategory[] = [
  {
    id: 'tops',
    label: 'Tops',
    items: [
      { key: 'tops.button_up_shirt', label: 'Button-up Shirt' },
      { key: 'tops.tshirt', label: 'T-Shirt' },
      { key: 'tops.blouse', label: 'Blouse' },
      { key: 'tops.sweater_knit_top', label: 'Sweater / Knit Top' },
      { key: 'tops.hoodie_pullover', label: 'Hoodie / Pullover' },
      { key: 'tops.tank_top', label: 'Tank Top / Sleeveless' },
      { key: 'tops.camisole', label: 'Camisole' },
    ],
  },
  {
    id: 'bottoms',
    label: 'Bottoms',
    items: [
      { key: 'bottoms.dress_pants_slacks', label: 'Dress Pants / Slacks' },
      { key: 'bottoms.jeans', label: 'Jeans' },
      { key: 'bottoms.skirt_1', label: 'Skirt' },
      { key: 'bottoms.shorts', label: 'Shorts' },
    ],
  },
  {
    id: 'dresses_formal',
    label: 'Dresses & Formal',
    items: [
      { key: 'dresses.casual_dress_knee_length', label: 'Casual Dress' },
      {
        key: 'dresses.casual_dress_knee_length_flowy',
        label: 'Casual Dress (Flowy)',
      },
      { key: 'dresses.evening_gown_1', label: 'Evening Gown' },
      { key: 'dresses.evening_gown_2', label: 'Evening Gown 2' },
      { key: 'dresses.wedding_dress', label: 'Wedding Dress' },
      { key: 'dresses.suit_jacket', label: 'Suit Jacket / Blazer' },
      { key: 'dresses.waistcoat_vest', label: 'Waistcoat / Vest' },
    ],
  },
  {
    id: 'outerwear',
    label: 'Outerwear',
    items: [
      { key: 'outerwear.overcoat', label: 'Overcoat' },
      { key: 'outerwear.jacket', label: 'Jacket' },
      { key: 'outerwear.cardigan', label: 'Cardigan' },
      { key: 'outerwear.puffer_jacket', label: 'Puffer Jacket' },
      { key: 'outerwear.jumpsuit_romper', label: 'Jumpsuit / Romper' },
      { key: 'outerwear.overalls', label: 'Overalls' },
    ],
  },
  {
    id: 'specialty',
    label: 'Specialty',
    items: [
      { key: 'specialty.childrens_generic', label: "Children's Clothing" },
      { key: 'specialty.uniform_workwear', label: 'Uniform / Workwear' },
      { key: 'specialty.costume_theatrical', label: 'Costume / Theatrical' },
      { key: 'specialty.sportswear_jersey', label: 'Sportswear / Jersey' },
      {
        key: 'specialty.choir_graduation_robe',
        label: 'Choir / Graduation Robe',
      },
    ],
  },
  {
    id: 'accessories',
    label: 'Accessories',
    items: [
      { key: 'accessories.scarf', label: 'Scarf' },
      { key: 'accessories.hat', label: 'Hat' },
      { key: 'accessories.gloves', label: 'Gloves' },
      { key: 'accessories.tie', label: 'Tie' },
      { key: 'accessories.bowtie', label: 'Bowtie' },
      { key: 'accessories.belt', label: 'Belt' },
    ],
  },
  {
    id: 'non_wearable',
    label: 'Non-Wearable',
    items: [{ key: 'specialty.blankets', label: 'Blankets / Quilts' }],
  },
];
