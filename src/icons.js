const paths = {
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
