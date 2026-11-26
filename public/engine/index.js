import { renderNoir } from './t1-noir.js';
import { renderBento } from './t2-bento.js';
import { renderBlueprint } from './t3-blueprint.js';
import { renderAurora } from './t4-aurora.js';
import { renderKinetic } from './t5-kinetic.js';

export const TEMPLATES = [
  { id: 'noir', defaultTheme: 'dark', name: 'Circuit Noir', tagline: 'Dark-first · animated PCB traces · spotlight product rail', render: renderNoir },
  { id: 'bento', defaultTheme: 'light', name: 'Bento Lab', tagline: 'Light-first · bento grid · scroll-scaling hero · quote basket', render: renderBento },
  { id: 'blueprint', defaultTheme: 'dark', name: 'Blueprint', tagline: 'Engineering drawing · self-drawing schematic · crosshair cursor', render: renderBlueprint },
  { id: 'aurora', defaultTheme: 'dark', name: 'Aurora Glass', tagline: 'Glassmorphism · living gradient mesh · pinned scroll story', render: renderAurora },
  { id: 'kinetic', defaultTheme: 'light', name: 'Kinetic', tagline: 'Editorial type · velocity marquee · hover-image product index', render: renderKinetic },
];
export const getTemplate = id => TEMPLATES.find(t => t.id === id);
