import { renderNoir } from './t1-noir.js';
import { renderBento } from './t2-bento.js';
import { renderBlueprint } from './t3-blueprint.js';
import { renderAurora } from './t4-aurora.js';
import { renderKinetic } from './t5-kinetic.js';

export const TEMPLATES = [
  { id: 'noir', defaultTheme: 'dark', name: 'Circuit Noir', tagline: 'Dark tech. Live circuit canvas. Ctrl K search.', best: 'Chips, power and embedded', render: renderNoir },
  { id: 'bento', defaultTheme: 'light', name: 'Bento Lab', tagline: 'Warm, editorial, serif. Bento tiles and masonry.', best: 'Friendly B2B and distributors', render: renderBento },
  { id: 'blueprint', defaultTheme: 'dark', name: 'Blueprint', tagline: 'Engineering sheet. Table catalogue and RFQ form.', best: 'Test gear and custom engineering', render: renderBlueprint },
  { id: 'aurora', defaultTheme: 'dark', name: 'Aurora Glass', tagline: 'Soft futurism. Bottom dock and pinned story.', best: 'IoT, wireless and modern brands', render: renderAurora },
  { id: 'kinetic', defaultTheme: 'light', name: 'Kinetic', tagline: 'Loud editorial type. Full-screen menu.', best: 'Bold brands that want attention', render: renderKinetic },
];
export const getTemplate = id => TEMPLATES.find(t => t.id === id);
