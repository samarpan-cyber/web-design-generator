// Copy for real estate designs. Short, warm, plain. No dashes. No invented facts:
// no prices, completion dates, RERA numbers, amenities, awards or sales figures unless the site or the details supplied them.
// The checklists are general buying and leasing guidance, not claims about the company.
import { noDash } from './copy.js';

export const SEGMENT_COPY = {
  residential: {
    headline: ['Homes designed around how you live', 'Find the home that fits your days', 'Come home to somewhere that feels right', 'Space for the life you are building'],
    sub: 'Apartments and homes with clear information, honest timelines and a team that answers its phone.',
    types: [['Apartments', 'Well planned homes in connected neighbourhoods.'], ['Villas', 'More room, more privacy, your own front door.'], ['Row houses', 'The middle ground between a flat and a villa.'], ['Penthouses', 'Top floor living with space to breathe.']],
    projectsLabel: 'Projects', typesT: 'Homes for every stage of life', stepsT: 'From first look to the keys',
    steps: [['Tell us what you need', 'Budget, size, location and timing.'], ['Shortlist and visit', 'See the homes that fit, in person.'], ['Paperwork and loan', 'Clear documents and help with finance.'], ['Handover', 'Keys in hand and a final walkthrough.']],
    checkT: 'Before you buy a home', check: ['Check the project and builder registration on your state RERA portal.', 'Ask for the promised possession date in writing.', 'Compare carpet area, not only built up area.', 'Read the payment schedule before you pay a booking amount.', 'Visit the site at different times of day.', 'Ask what maintenance will cost after handover.'],
    faq: [['What is the difference between carpet area and built up area?', 'Carpet area is the space inside your walls. Built up area adds wall thickness and balconies. Always compare homes on carpet area.'], ['Can I visit before I book?', 'Yes. Request a site visit with the form and the team will confirm a time.'], ['How do I know a project is registered?', 'Ask for the RERA number and check it on your state RERA website.'], ['Can you help with a home loan?', 'Ask the team. Many developers work with banks and can point you to the right documents.']]
  },
  luxury: {
    headline: ['Residences, not just addresses', 'Spaces made to be lived in slowly', 'Where design and privacy meet', 'A home worth coming back to'],
    sub: 'Considered architecture, generous space and a service that respects your time.',
    types: [['Villas', 'Private, landscaped and built for entertaining.'], ['Penthouses', 'Skyline views and room to roam.'], ['Branded residences', 'Hotel style living with a home at its heart.'], ['Estates', 'Land, space and quiet on a larger scale.']],
    projectsLabel: 'Residences', typesT: 'A collection of residences', stepsT: 'A private process',
    steps: [['A private conversation', 'Share what matters most to you.'], ['Curated viewings', 'Only the residences that fit.'], ['Clear terms', 'Documents explained, no surprises.'], ['Handover', 'A final walkthrough, keys and a warm welcome.']],
    checkT: 'Before you invest in a residence', check: ['Check the project and builder registration on your state RERA portal.', 'Ask for specifications in writing, down to the finishes.', 'Understand ownership, parking and common area rights.', 'Ask about maintenance, services and how they are charged.', 'Visit the site at different times of day.', 'Review the payment schedule against construction stages.'],
    faq: [['Can I arrange a private viewing?', 'Yes. Use the form to request a time and the team will confirm it.'], ['Are floor plans available?', 'Ask the team. They can share plans and specifications for each residence.'], ['How do I verify a project?', 'Ask for the RERA number and check it on your state RERA website.'], ['Can you help non resident buyers?', 'Ask the team about documents and processes for buyers abroad.']]
  },
  commercial: {
    headline: ['Spaces that work as hard as you do', 'Room for your business to grow', 'Commercial space, clearly explained', 'Where good business gets a good address'],
    sub: 'Offices, retail and industrial space with straight answers on size, terms and timing.',
    types: [['Offices', 'Floor plates and suites for teams of every size.'], ['Retail', 'Frontage and footfall for shops and showrooms.'], ['Warehouses', 'Storage and logistics space with room to manoeuvre.'], ['Co-working', 'Flexible desks and cabins without the long commitment.']],
    projectsLabel: 'Spaces', typesT: 'Space for every kind of business', stepsT: 'From brief to keys',
    steps: [['Share your brief', 'Team size, area, location and budget.'], ['Shortlist', 'A short list of spaces that fit.'], ['Tour and compare', 'Walk the space and see the numbers side by side.'], ['Sign and move in', 'Terms agreed, fit out planned, doors open.']],
    checkT: 'Before you lease or buy commercial space', check: ['Confirm the permitted use and zoning for your business.', 'Check power load, parking ratio and lift capacity.', 'Ask about lock in period, deposit and rent escalation.', 'Compare carpet area with the area you pay for.', 'Check fire and occupancy certificates.', 'Ask what maintenance and common charges include.'],
    faq: [['How much space does my team need?', 'Use the space calculator and change the numbers to match how your team works. Then ask for a tour.'], ['Can the space be customised?', 'Ask the team what fit out options are allowed and who pays for them.'], ['What are the lease terms?', 'Ask for the lock in, deposit, escalation and notice terms in writing.'], ['Can I see the building before I decide?', 'Yes. Request a visit and the team will arrange a tour.']]
  },
  plots: {
    headline: ['Land with a future built in', 'Start with the ground you stand on', 'Plots you can verify and visit', 'Your piece of the map'],
    sub: 'Clear titles, clear layouts and a site you can walk before you decide.',
    types: [['Residential plots', 'Build the home you have drawn.'], ['Farm land', 'Open space for weekends or for farming.'], ['Commercial plots', 'Frontage and access for business use.'], ['Gated layouts', 'Planned roads, utilities and a community around you.']],
    projectsLabel: 'Plots', typesT: 'Land for every plan', stepsT: 'From site visit to registration',
    steps: [['Pick a layout', 'Browse locations and plot sizes.'], ['Visit the site', 'Walk the land and check access.'], ['Verify the papers', 'Title, approvals and conversion status.'], ['Book and register', 'Agree terms and complete registration.']],
    checkT: 'Before you buy a plot', check: ['Verify clear title and a complete chain of ownership.', 'Check the layout approval and land use conversion status.', 'Confirm road access, water and electricity.', 'Visit the plot and check boundaries on site.', 'Check the project on your state RERA portal where it applies.', 'Have a lawyer review the sale agreement.'],
    faq: [['How do I check a plot is genuine?', 'Ask for the title documents and approvals, and have a lawyer review them before you pay.'], ['Can I visit the site?', 'Yes. Request a site visit and the team will confirm a time.'], ['Are utilities available?', 'Ask the team which utilities are in place today and which are planned.'], ['Can I build straight away?', 'Ask about approvals and building rules for the layout.']]
  },
  mixed: {
    headline: ['Homes and workplaces, built with care', 'Spaces for living and for business', 'Property that fits the plan', 'From first home to first office'],
    sub: 'Residential and commercial property with clear information from the first call to the handover.',
    types: [['Apartments', 'Well planned homes in connected neighbourhoods.'], ['Villas', 'More room, more privacy, your own front door.'], ['Offices', 'Floor plates and suites for teams of every size.'], ['Retail', 'Frontage and footfall for shops and showrooms.']],
    projectsLabel: 'Projects', typesT: 'Property for living and for business', stepsT: 'How we work with you',
    steps: [['Tell us what you need', 'Home or workplace, size, location and budget.'], ['Shortlist and visit', 'See the options that fit, in person.'], ['Paperwork and terms', 'Clear documents and straight answers.'], ['Handover', 'Keys in hand and a final walkthrough.']],
    checkT: 'Before you buy or lease', check: ['Check the project and builder registration on your state RERA portal.', 'Ask for the possession or handover date in writing.', 'Compare carpet area, not only built up area.', 'Confirm permitted use for any commercial space.', 'Read payment and lease terms before you commit.', 'Visit the site at different times of day.'],
    faq: [['Can I visit before I decide?', 'Yes. Request a site visit with the form and the team will confirm a time.'], ['How do I know a project is registered?', 'Ask for the RERA number and check it on your state RERA website.'], ['Do you handle both homes and offices?', 'See the projects page for what is available now, or ask the team.'], ['Can you help with finance?', 'Ask the team. They can point you to the right documents and lenders.']]
  }
};
export const AGENCY_STEPS = [['Tell us what you want', 'Buy, rent or sell, with your budget and area.'], ['See matching listings', 'A short list instead of a long scroll.'], ['Visit and compare', 'We arrange the viewings and answer your questions.'], ['Close with confidence', 'Documents checked, terms clear, keys handed over.']];

export const ESTATE = {
  nav: { home: 'Home', projects: 'Projects', about: 'About', guide: 'Guide', contact: 'Book a Visit' },
  kicker: n => `Welcome to ${n}`,
  ctaVisit: 'Book a Site Visit', ctaProjects: 'View Projects', ctaSend: 'Request a Visit', ctaCall: 'Call Us',
  aboutK: 'About us', aboutT: 'Property, explained plainly',
  whyK: 'Why people talk to us', whyT: 'What you can expect',
  why: [['Straight answers', 'Prices, areas and timelines explained without the fine print game.'], ['Time to look properly', 'Visits arranged around you, not around our diary.'], ['Paperwork that makes sense', 'Documents explained before you sign anything.'], ['Support after the handover', 'Questions do not stop when the keys change hands.']],
  projK: 'What we offer', projS: 'Browse what is available and ask for a visit when something catches your eye.',
  amenK: 'Amenities', amenT: 'What comes with it',
  statsK: 'In numbers',
  reraK: 'RERA registered', reraNote: 'Always confirm the number on your state RERA portal.',
  locK: 'Where we work', locT: 'Locations',
  testiK: 'In their words', testiT: 'What clients say',
  faqK: 'Good to know', faqT: 'Common questions',
  guideK: 'Buyer guide', calcK: 'Planning tools',
  emiT: 'Monthly payment estimate', emiNote: 'Indicative only. Check current rates and terms with your lender.', emiAmount: 'Loan amount', emiRate: 'Interest rate (% a year)', emiYears: 'Years', emiOut: 'Estimated monthly payment',
  areaT: 'How much space do you need?', areaNote: 'A rule of thumb you can change. Ask for a tour to confirm what really fits.', areaPeople: 'People', areaPer: 'Sq ft per person', areaOut: 'Estimated area',
  filterT: 'Filter', filterAll: 'All',
  contactK: 'Visit us', contactT: 'Book your site visit', contactS: 'Share a few details and the team will confirm a time.',
  bandT: 'Ready to see it in person?', bandS: 'Book a visit and the team will take it from there.', bandBtn: 'Book Now',
  foot: 'Property advice with time, honesty and clear paperwork.',
  formN: 'Your name', formE: 'Email', formP: 'Phone', formD: 'Preferred day or time', formM: 'What are you looking for?', formI: 'Interested in'
};
export function estateCopy(segment) { const seg = SEGMENT_COPY[segment] || SEGMENT_COPY.residential; const walk = x => (typeof x === 'string' ? noDash(x) : Array.isArray(x) ? x.map(walk) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, walk(v)])) : x); const c = walk(JSON.parse(JSON.stringify({ ...ESTATE, seg }))); c.kicker = n => noDash(ESTATE.kicker(n)); return c; }
export const estateHeadline = (segment, seed = 0) => { const a = (SEGMENT_COPY[segment] || SEGMENT_COPY.residential).headline; return noDash(a[Math.abs(seed) % a.length]); };
