// Copy engine: one place for voice, wit and rules.
// Rules enforced here and by tests: no em/en dashes, no paragraph walls, no repeated lines.
// Voice: professional, plainly spoken, a little dry wit, always nudging toward an action.

/* ---------- text hygiene ---------- */
export const noDash = s => String(s ?? '').replace(/\s*[\u2013\u2014]\s*/g, ', ').replace(/\s+-\s+/g, ', ').replace(/\s{2,}/g, ' ').trim();

/** First sentence that fits, cut cleanly. Never ends mid-thought with an ellipsis. */
export function brief(text, max = 120) {
  let t = noDash(text).replace(/\s+/g, ' ');
  if (!t) return '';
  const sentences = t.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [t];
  let out = '';
  for (const s of sentences) {
    const next = (out + ' ' + s).trim();
    if (next.length > max) break;
    out = next;
    break; // one sentence is enough
  }
  if (!out) {
    out = t.slice(0, max);
    const cut = Math.max(out.lastIndexOf(', '), out.lastIndexOf(' '));
    out = out.slice(0, cut > 40 ? cut : max).replace(/[,;:]$/, '');
  }
  return /[.!?]$/.test(out) ? out : out + '.';
}

const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/* ---------- topic detection ---------- */
const TOPICS = [
  ['power', /power|inverter|ups\b|battery|charger|transformer|solar|smps|psu|supply|energy|capacitor|bms/i],
  ['iot', /iot|sensor|wireless|ble\b|lora|wi-?fi|smart|gateway|connected|module|telemetry/i],
  ['pcb', /pcb|assembly|ems\b|smt\b|box build|prototyp|board|manufactur/i],
  ['test', /test|measure|oscilloscope|emc|emi|calibrat|analy[sz]er|instrument|meter/i],
  ['components', /component|crystal|resistor|connector|relay|switch|cable|distribut|semiconductor|chip|ic\b/i],
  ['auto', /motor|drive|ev\b|vehicle|controller|automotive|pmsm|servo/i],
  ['rf', /\brf\b|antenna|telecom|5g|radio|signal|network/i],
  ['lighting', /\bled\b|lighting|luminaire|lamp/i],
  ['automation', /automation|plc\b|scada|industrial|robot/i]
];
export function topicOf(m) {
  const hay = [m.name, ...m.products.map(p => p.name), ...m.industries, ...m.cats].join(' ');
  let best = 'general', score = 0;
  for (const [t, re] of TOPICS) { const n = (hay.match(new RegExp(re.source, 'gi')) || []).length; if (n > score) { score = n; best = t; } }
  return best;
}
export const NOUN = { power: 'power gear', iot: 'connected hardware', pcb: 'boards', test: 'test gear', components: 'components', auto: 'drive systems', rf: 'wireless hardware', lighting: 'lighting', automation: 'automation gear', general: 'electronics' };

/* ---------- headlines: five per topic, one per design voice ---------- */
const HEAD = {
  power: ['Power that never takes a day off.', 'Steady volts. Zero drama.', 'Keep the lights on. Literally.', 'Clean current for serious work.', 'Brownouts are for other people.'],
  iot: ['Connect everything. Debug nothing.', 'Smart devices, minus the guesswork.', 'Hardware that talks back, politely.', 'Sensors with something to say.', 'Make the physical world reply.'],
  pcb: ['Boards built right the first time.', 'From schematic to shelf, no surprises.', 'Solder joints you can bet a launch on.', 'Layouts that survive real life.', 'Less rework. More shipping.'],
  test: ['Measure twice. Ship once.', 'Find the fault before your customer does.', 'Precision that survives the audit.', 'Numbers you can defend.', 'Truth, to three decimal places.'],
  components: ['The right part, on time, every time.', 'Every component. One dependable source.', 'Stock you can count on. Specs you can trust.', 'Fewer shortages. Better Mondays.', 'Parts that behave.'],
  auto: ['Motors that obey. Controllers that think.', 'Move faster. Waste less current.', 'Torque, on demand.', 'Drives built for hard days.', 'Smooth is a spec, not a feeling.'],
  rf: ['Signals that arrive intact.', 'Wireless that keeps its word.', 'Range is a promise. Keep it.', 'Clear channels, clear conscience.', 'Less noise. More network.'],
  lighting: ['Brighter results. Smaller bills.', 'Light that does its homework.', 'See better. Spend less.', 'Illumination, engineered.', 'Turn it on. Forget about it.'],
  automation: ['Machines that run themselves. Mostly.', 'Fewer stoppages. More output.', 'Automation without the anxiety.', 'Let the line do the lifting.', 'Uptime, on purpose.'],
  general: ['Electronics that earn their place.', 'Engineering you will not have to explain twice.', 'Reliable by design. Charming by accident.', 'Hardware with a backbone.', 'Built to run when it counts.']
};
const SUB = {
  power: 'Reliable conversion, backup and control for equipment that cannot blink.',
  iot: 'Modules and devices that connect cleanly and keep reporting.',
  pcb: 'Design, assembly and testing from one accountable team.',
  test: 'Instruments and services that turn guesses into readings.',
  components: 'A broad catalogue with the paperwork to match.',
  auto: 'Controllers and drives tuned for torque, efficiency and uptime.',
  rf: 'Wireless and network hardware built for signal integrity.',
  lighting: 'Efficient fixtures, specified properly and delivered on schedule.',
  automation: 'Control hardware that keeps lines moving and operators calm.',
  general: 'Practical electronics, supplied by people who read the datasheet.'
};

/* ---------- product micro-descriptions (2 variants each, picked by name + voice) ---------- */
const DESC = [
  [/capacitor|mlcc/i, ['Holds charge. Holds its tolerance.', 'Small footprint, steady behaviour.', 'Smooths the rails so the rest can shine.', 'Stores energy without storing drama.']],
  [/crystal|oscillator/i, ['Keeps time so your firmware does not have to guess.', 'Stable clocks for systems that hate drift.', 'The metronome your circuit never knew it needed.', 'Tight frequency, calm timing.']],
  [/resistor/i, ['Limits current without limiting your options.', 'Plain, precise and predictable.', 'Small value, big influence.', 'Tolerance you can plan around.']],
  [/relay/i, ['Switches big loads on a small signal.', 'A click that carries real weight.', 'Isolation with a satisfying snap.', 'Lets logic boss the power around.']],
  [/connector|terminal|cable|wire/i, ['The part you notice only when it fails. It will not.', 'Joins things firmly and keeps them joined.', 'A solid handshake between two boards.', 'Contacts built for a thousand reconnects.']],
  [/sensor|probe|detector|encoder/i, ['Turns the physical world into clean data.', 'Notices what you cannot.', 'Small eyes on a big process.', 'Reads the room, reports the numbers.']],
  [/inverter/i, ['Turns DC into AC you can build a business on.', 'Efficient conversion, minus the hum.', 'Sunshine in, usable power out.', 'Clean waveform, calm load.']],
  [/drive|vfd|servo|motor|controller/i, ['Precise motion control for rough conditions.', 'Speed, torque and restraint in one box.', 'Starts soft, runs smart, stops on cue.', 'Turns a motor into a team player.']],
  [/ups|backup/i, ['Power cuts become someone else\'s problem.', 'Seamless backup for the moment the grid blinks.', 'A calm voice when the lights go out.', 'Keeps the server up and the shouting down.']],
  [/psu|supply|smps|charger|adapter/i, ['Stable rails for sensitive electronics.', 'Clean output, DIN-rail or bench.', 'Steady volts, however rough the input.', 'Feeds your circuit exactly what it asked for.']],
  [/battery|bms/i, ['Smart cells, supervised properly.', 'Energy storage with a safety conscience.', 'Knows its limits so you do not test them.', 'Charge, protect, repeat.']],
  [/pcb|board|assembly|smt|box build/i, ['From bare board to working unit.', 'Built, inspected and ready to power up.', 'Solder, inspect, ship, repeat.', 'Where schematics grow up.']],
  [/display|lcd|oled|screen|hmi/i, ['Readable in daylight, dependable at night.', 'The face your machine shows the world.', 'Crisp pixels, clear decisions.', 'Information you can read at a glance.']],
  [/oscilloscope|analy[sz]er|meter|scope|instrument|tester/i, ['See the signal. Settle the argument.', 'Measurement you can defend in a review.', 'Shows the waveform. Hides nothing.', 'Evidence for every design debate.']],
  [/emi|emc/i, ['Pass compliance without a second attempt.', 'Because interference never RSVPs.', 'Quiet emissions, loud results.', 'Find the noise before the auditor does.']],
  [/module|iot|wireless|ble|lora|wifi|wi-fi|gateway/i, ['Wireless that joins the network and stays.', 'Drop it in. Connect it up. Move on.', 'Range, reliability and a small footprint.', 'Gives your product a voice.']],
  [/led|lighting|lamp|luminaire/i, ['Bright, efficient and quietly durable.', 'Light that does not flinch.', 'More lumens, fewer watts.', 'Glare-free and long-lived.']],
  [/development|dev board|kit|prototyp/i, ['Go from idea to blinking LED today.', 'A shortcut from concept to working demo.', 'Everything you need to start tinkering.', 'Prototype first, perfect later.']],
  [/software|erp|tally|cloud|server/i, ['Software that keeps the numbers honest.', 'Less admin. More actual work.', 'Books that balance themselves, almost.', 'Order where there was spreadsheet chaos.']],
  [/switch|breaker|mcb|contactor/i, ['Cuts the circuit when it counts.', 'Firm action, clean contacts.', 'Protects everything downstream.', 'A decisive click, every time.']],
  [/transformer|coil|inductor/i, ['Steps voltage up or down without fuss.', 'Magnetics done properly.', 'Quiet, efficient and well wound.', 'Right voltage, right place.']],
  [/accessor|tool|solder|equipment/i, ['The kit your bench keeps reaching for.', 'Small tools, big difference.', 'Makes the daily grind a little smoother.', 'Handy today, essential tomorrow.']]
];
/** Returns up to two distinct lines: [catalogue line, highlight line]. Lines are never reused across products. */
export function describe(name, voice, used, which = 0) {
  for (const [re, vs] of DESC) if (re.test(name)) {
    const start = (hash(name) + voice + which * 2) % vs.length;
    for (let k = 0; k < vs.length; k++) { const v = vs[(start + k) % vs.length]; if (!used.has(v)) { used.add(v); return v; } }
    return '';
  }
  return '';
}

/* ---------- sector one-liners ---------- */
export const SECTOR_LINE = {
  Automotive: ['Vibration, heat and heartbreak, handled.', 'Where parts earn their warranty.'],
  Medical: ['Zero margin for "close enough".', 'Precision that someone\'s health leans on.'],
  'Industrial Automation': ['Fewer stoppages, calmer shift managers.', 'Built for floors that never go quiet.'],
  'IoT & Smart Devices': ['Little devices, big opinions.', 'Everything online, nothing mysterious.'],
  'Power & Energy': ['Because outages make terrible headlines.', 'Every electron, accounted for.'],
  Telecom: ['Signal in, signal out, no drama.', 'Uptime is the only brand promise.'],
  'Aerospace & Defence': ['Specified tightly. Tested harder.', 'Documentation as serious as the hardware.'],
  'Embedded & Semiconductor': ['Silicon with a purpose.', 'Where firmware meets the real world.'],
  'PCB & EMS': ['Layouts that survive production.', 'From first article to full run.'],
  'Test & Measurement': ['Prove it, then ship it.', 'Data beats opinion.'],
  Lighting: ['Efficient, glare-free and long-lived.', 'Bright ideas with a payback period.'],
  Components: ['The small parts that decide big outcomes.', 'Catalogue depth without the scavenger hunt.']
};
const SECTOR_GENERIC = ['Where reliability is the whole brief.', 'Specified carefully, delivered properly.', 'Built for people who read datasheets.', 'Less downtime, more shipped.', 'Quietly dependable, loudly appreciated.', 'Tough environment? Good.'];
export function sectorLine(name, i, voice) {
  const l = SECTOR_LINE[name];
  return l ? l[(i + voice) % l.length] : SECTOR_GENERIC[(i + voice) % SECTOR_GENERIC.length];
}

/* ---------- per-design voices ---------- */
export function voiceCopy(voice, m, topic) {
  const n = NOUN[topic];
  const V = [
    { // 0 NOIR: confident, dry tech wit
      eyebrow: 'Quotes open. Excuses closed.', ctaA: 'See the hardware', ctaB: 'Request a quote',
      marqueeLead: 'Built for', featKicker: 'On the bench', featTitle: 'Fresh from the lineup', featLink: 'Browse everything',
      statsKicker: 'By the numbers', statsTitle: 'Numbers, no spin', bandTitle: 'Got a spec? Send it over.', bandSub: 'We read datasheets for fun. Mostly.', bandCta: 'Start a quote',
      prodTitle: 'The full lineup', prodSub: `Search it, shortlist it, quote it. Your ${n} shopping list writes itself.`, search: 'Search the lineup', empty: 'Nothing matched. Try a shorter word.', add: 'Add to quote', details: 'Details',
      solTitle: 'Where it earns its keep', solSub: 'Different industries, same standard: it works on day one and day one thousand.',
      stepsTitle: 'Quotes without the ping-pong', steps: [['Shortlist', 'Tap Add to quote on anything that fits.'], ['Describe', 'Add quantities and a deadline. Skip the essay.'], ['Send', 'One message, one reply, one plan.']],
      aboutTitle: 'The people behind the parts', aboutSub: 'Straight talk about who is on the other end of your order.', factsTitle: 'Find us', certsTitle: 'Proof, not promises',
      contactTitle: 'Tell us what you are building', contactSub: 'Short is fine. Specific is better.', send: 'Send request', direct: 'Prefer a direct line?',
      foot: 'Quality is a habit, not a department.', navCta: 'Talk to us', pill: 'Open quotes'
    },
    { // 1 BENTO: warm, friendly-smart
      eyebrow: 'Now taking quote requests', ctaA: 'Browse the catalogue', ctaB: 'Talk to sales',
      marqueeLead: 'Trusted in', featKicker: 'Start here', featTitle: 'A few favourites', featLink: 'See the whole catalogue',
      statsKicker: 'At a glance', statsTitle: 'The short version, in digits', bandTitle: 'Your next project starts with a hello.', bandSub: 'Tell us the goal. We will help with the parts.', bandCta: 'Ask for a quote',
      prodTitle: 'Everything we supply', prodSub: 'Filter by name, pick what you like, and we will price it together.', search: 'Search products', empty: 'No match yet. Try a different word.', add: 'Add to quote', details: 'Learn more',
      solTitle: 'Made for real workloads', solSub: 'The industries we show up for, and the one thing they all ask: will it last?',
      stepsTitle: 'Getting a quote, simplified', steps: [['Pick', 'Choose the products you need.'], ['Share', 'Tell us quantity and timeline.'], ['Relax', 'We reply with a clear price.']],
      aboutTitle: 'A little about us', aboutSub: 'Who we are, in plain English.', factsTitle: 'Say hello', certsTitle: 'Standards we stand behind',
      contactTitle: 'Let\'s talk it through', contactSub: 'Share the basics and we will take it from there.', send: 'Send message', direct: 'Or reach us directly',
      foot: 'Good parts. Good people. Good Mondays.', navCta: 'Get a quote', pill: 'Say hello'
    },
    { // 2 BLUEPRINT: precise, deadpan engineer humour
      eyebrow: 'Revision C. Approved by nobody yet.', ctaA: 'Open the catalogue', ctaB: 'Submit an RFQ',
      marqueeLead: 'Applications', featKicker: 'Fig. 01', featTitle: 'Selected drawings', featLink: 'Full catalogue',
      statsKicker: 'Key figures', statsTitle: 'Measured, not guessed', bandTitle: 'Attach your drawing. We will do the rest.', bandSub: 'Tolerances welcome.', bandCta: 'Open RFQ form',
      prodTitle: 'Catalogue', prodSub: 'Every item, one line each. Sorted by curiosity.', search: 'FILTER ITEMS', empty: 'NO ITEMS MATCH THE QUERY.', add: '+ RFQ', details: 'Datasheet',
      solTitle: 'Applications', solSub: 'Where these parts have been specified, tested and eventually forgotten, which is the goal.',
      stepsTitle: 'RFQ procedure', steps: [['Step 1', 'Mark the items you need.'], ['Step 2', 'State quantities and dates.'], ['Step 3', 'Receive pricing. Compare. Proceed.']],
      aboutTitle: 'Company profile', aboutSub: 'Scope, location and standards.', factsTitle: 'Contact block', certsTitle: 'Compliance',
      contactTitle: 'Request for quotation', contactSub: 'Fill in what you know. Guess the rest.', send: 'Submit RFQ', direct: 'Direct lines',
      foot: 'Dimensions in millimetres. Opinions in footnotes.', navCta: 'RFQ', pill: 'Sheet index'
    },
    { // 3 AURORA: smooth, futuristic, short
      eyebrow: 'Hardware, but make it effortless', ctaA: 'Explore the range', ctaB: 'Get a quote',
      marqueeLead: 'Powering', featKicker: 'Spotlight', featTitle: 'Engineered to stand out', featLink: 'View the range',
      statsKicker: 'The glow-up', statsTitle: 'Proof, in numbers', bandTitle: 'Make something remarkable.', bandSub: 'We will bring the hardware.', bandCta: 'Start a quote',
      prodTitle: 'The range', prodSub: 'Tap, compare and shortlist. Your quote builds itself.', search: 'Search the range', empty: 'Nothing here. Try another word.', add: 'Add to quote', details: 'Open',
      solTitle: 'Sectors we light up', solSub: 'Where our hardware quietly does the heavy lifting.',
      stepsTitle: 'Three taps to a quote', steps: [['Choose', 'Add what you need.'], ['Tell us', 'Quantity, timeline, done.'], ['Hear back', 'Pricing lands in your inbox.']],
      aboutTitle: 'Our story, shortened', aboutSub: 'The essentials, nothing extra.', factsTitle: 'Reach out', certsTitle: 'Certified calm',
      contactTitle: 'Say the word', contactSub: 'We will take it from here.', send: 'Send it', direct: 'Direct channels',
      foot: 'Designed to disappear into your product.', navCta: 'Quote', pill: 'Hello'
    },
    { // 4 KINETIC: loud, punchy, editorial
      eyebrow: 'Loud hardware. Quiet failures.', ctaA: 'See the index', ctaB: 'Contact',
      marqueeLead: 'For', featKicker: 'Highlights', featTitle: 'Start with these', featLink: 'All products',
      statsKicker: 'Receipts', statsTitle: 'Numbers that talk', bandTitle: 'Let\'s talk.', bandSub: 'Seriously. It is free.', bandCta: 'Request a quote',
      prodTitle: 'Index', prodSub: 'Pick a product. Add it to the quote. That is the whole process.', search: 'Filter products', empty: 'Nothing matches.', add: '+ Quote', details: 'Open',
      solTitle: 'Made for hard jobs', solSub: 'Rough environments, tight tolerances, zero patience for excuses.',
      stepsTitle: 'How to order', steps: [['One', 'Pick products.'], ['Two', 'Add quantities.'], ['Three', 'Hit send.']],
      aboutTitle: 'Who we are', aboutSub: 'Short version below.', factsTitle: 'Where', certsTitle: 'Standards',
      contactTitle: 'Say hello', contactSub: 'Tell us the job. We will bring the hardware.', send: 'Send', direct: 'Direct',
      foot: 'Built right. Shipped on time. Mostly.', navCta: 'Quote', pill: 'Menu'
    }
  ];
  return V[voice % V.length];
}

export function headline(topic, voice) { return HEAD[topic][voice % 5]; }
export function subline(m, topic) { return brief(m.rawDesc || '', 130) || SUB[topic]; }
