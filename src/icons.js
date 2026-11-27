const paths = {
  find: '<circle cx="11" cy="11" r="5.5"/><path d="m15.5 15.5 3.5 3.5"/>',
  request: '<path d="M4 7.5h16v10H4z"/><path d="m4.5 8 7.5 5.5L19.5 8"/>',
  understand: '<path d="M7 4.5h7l4 4V19.5H7z"/><path d="M14 4.5v4h4"/><path d="M9.5 12.5h5M9.5 15.5h5"/>',
  shield: '<path d="M12 3.5 19 6.5v5.2c0 3.6-2.4 6.4-7 8.3-4.6-1.9-7-4.7-7-8.3V6.5z"/><path d="m8.8 11.6 2.1 2.1 4.2-4.2"/>',
  chart: '<path d="M5 19V5M5 19h14"/><path d="M8.5 15.5v-4M12 15.5V8M15.5 15.5v-2"/>',
  people: '<circle cx="9" cy="9" r="2.1"/><circle cx="16" cy="9.4" r="1.7"/><path d="M4.8 17.4c.6-2.1 2.2-3.2 4.2-3.2s3.5 1.1 4.1 3.2M14 14.3c.8-.4 1.7-.6 2.5-.6 1.5 0 2.7.8 3.3 2.4"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  benefits: '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  tax: '<path d="M6 19 18 5"/><circle cx="8" cy="7.5" r="2.2"/><circle cx="16" cy="16.5" r="2.2"/>',
  mccloud: '<path d="M5 17c3-1 4-6 7-6s4 5 7 6"/><path d="M5 7c3 1 4 6 7 6s4-5 7-6"/>',
  records: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 9h16M4 14h16M9 9v11"/>',
  adviser: '<circle cx="9" cy="9" r="2.2"/><circle cx="16" cy="9.5" r="1.8"/><path d="M4.8 17.5c.6-2.2 2.3-3.3 4.2-3.3s3.6 1.1 4.2 3.3M14 14.4c.8-.4 1.8-.6 2.6-.6 1.5 0 2.8.8 3.4 2.5"/>',
  catalogue: '<path d="M8 6h11M8 12h11M8 18h11"/><path d="M4.5 6h.5M4.5 12h.5M4.5 18h.5"/>',
};

export function icon(name) {
  const body = paths[name] || paths.catalogue;
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
