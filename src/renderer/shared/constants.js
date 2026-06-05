// Shared domain constants used by both windows.

// Crop categories. `value` is the canonical token stored in the database;
// `fr` is the French label shown to users; `ar` is the small Arabic hint.
export const CROP_CATEGORIES = [
  { value: 'Forage', fr: 'Forage', ar: 'العلفية' },
  { value: 'Céréales', fr: 'Céréales', ar: 'الحبوب' },
  { value: 'Maraîchage', fr: 'Maraîchage', ar: 'الخضروات' },
  { value: 'Arboriculture', fr: 'Arboriculture', ar: 'الأشجار المثمرة' },
  { value: 'Autre', fr: 'Autre', ar: 'أخرى' }
];

const CROP_BY_VALUE = CROP_CATEGORIES.reduce((acc, c) => {
  acc[c.value] = c;
  return acc;
}, {});

export function cropFr(value) {
  return CROP_BY_VALUE[value]?.fr || value || '';
}

export function cropAr(value) {
  return CROP_BY_VALUE[value]?.ar || '';
}

// Format a numeric amount with thousands separators and the " DA" suffix.
// Falls back to the raw string when the value is not numeric.
export function formatDA(value) {
  if (value === null || value === undefined || value === '') return '—';
  const num = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  if (Number.isNaN(num)) return `${value} DA`;
  return `${num.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} DA`;
}

export function fullName(farmer) {
  if (!farmer) return '';
  return `${farmer.last_name || ''} ${farmer.first_name || ''}`.trim();
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Pretty French-style date display (DD/MM/YYYY) from an ISO yyyy-mm-dd value.
export function displayDate(iso) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
