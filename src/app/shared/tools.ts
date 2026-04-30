export type PdfGroup = 'organize' | 'optimize' | 'convert-to' | 'convert-from' | 'edit' | 'security';

export interface Tool {
  id: string;
  name: string;
  desc: string;
  icon: string;
  route: string;
  color: string;
  category: 'pdf' | 'finance' | 'lifestyle';
  group?: PdfGroup;
  status?: 'live' | 'soon';
}

export const TOOLS: Tool[] = [
  // ORGANIZE PDF
  { id: 'merge', name: 'Merge PDF', desc: 'Combine multiple PDFs in any order into one file.', icon: 'M', route: '/pdf/merge', color: 'from-orange-500 to-amber-500', category: 'pdf', group: 'organize', status: 'live' },
  { id: 'split', name: 'Split PDF', desc: 'Extract page ranges or split each page out.', icon: 'S', route: '/pdf/split', color: 'from-rose-500 to-pink-500', category: 'pdf', group: 'organize', status: 'live' },
  { id: 'remove-pages', name: 'Remove pages', desc: 'Delete unwanted pages by number or range.', icon: '✖', route: '/pdf/remove-pages', color: 'from-rose-500 to-red-600', category: 'pdf', group: 'organize', status: 'live' },
  { id: 'extract-pages', name: 'Extract pages', desc: 'Pull selected pages into a new PDF.', icon: '↗', route: '/pdf/extract-pages', color: 'from-orange-500 to-rose-500', category: 'pdf', group: 'organize', status: 'live' },
  { id: 'organize', name: 'Organize PDF', desc: 'Reorder, duplicate or delete pages visually.', icon: '⋮⋮', route: '/pdf/organize', color: 'from-violet-500 to-purple-600', category: 'pdf', group: 'organize', status: 'live' },
  { id: 'scan', name: 'Scan to PDF', desc: 'Capture pages with your camera, save as a PDF.', icon: '📷', route: '/pdf/scan', color: 'from-rose-500 to-orange-500', category: 'pdf', group: 'organize', status: 'live' },

  // OPTIMIZE PDF
  { id: 'compress', name: 'Compress PDF', desc: 'Rewrite the file with object streams to shrink it.', icon: 'C', route: '/pdf/compress', color: 'from-emerald-500 to-teal-500', category: 'pdf', group: 'optimize', status: 'live' },
  { id: 'repair', name: 'Repair PDF', desc: 'Recover what\'s readable from a damaged PDF.', icon: '🛠', route: '/pdf/repair', color: 'from-emerald-500 to-green-600', category: 'pdf', group: 'optimize', status: 'live' },

  // CONVERT TO PDF
  { id: 'images-to-pdf', name: 'JPG to PDF', desc: 'Combine JPG / PNG images into a single PDF.', icon: '🖼', route: '/pdf/images-to-pdf', color: 'from-amber-500 to-orange-600', category: 'pdf', group: 'convert-to', status: 'live' },
  { id: 'html-to-pdf', name: 'HTML to PDF', desc: 'Paste HTML and save it as a PDF document.', icon: '</>', route: '/pdf/html-to-pdf', color: 'from-amber-500 to-yellow-500', category: 'pdf', group: 'convert-to', status: 'live' },

  // CONVERT FROM PDF
  { id: 'pdf-to-jpg', name: 'PDF to JPG', desc: 'Render every page as a high-quality JPG / PNG.', icon: '🖼', route: '/pdf/pdf-to-jpg', color: 'from-yellow-500 to-orange-500', category: 'pdf', group: 'convert-from', status: 'live' },

  // EDIT PDF
  { id: 'rotate', name: 'Rotate PDF', desc: 'Rotate any page by 90° / 180° / 270°.', icon: '↻', route: '/pdf/rotate', color: 'from-sky-500 to-blue-500', category: 'pdf', group: 'edit', status: 'live' },
  { id: 'page-numbers', name: 'Add page numbers', desc: 'Number every page in any corner you choose.', icon: '#', route: '/pdf/page-numbers', color: 'from-indigo-500 to-blue-600', category: 'pdf', group: 'edit', status: 'live' },
  { id: 'watermark', name: 'Add watermark', desc: 'Stamp text watermarks across every page.', icon: 'W', route: '/pdf/watermark', color: 'from-fuchsia-500 to-pink-600', category: 'pdf', group: 'edit', status: 'live' },
  { id: 'crop', name: 'Crop PDF', desc: 'Trim margins from every page by percentage.', icon: '✂', route: '/pdf/crop', color: 'from-purple-500 to-fuchsia-600', category: 'pdf', group: 'edit', status: 'live' },
  { id: 'edit', name: 'Edit PDF', desc: 'Add text labels and shapes anywhere on a page.', icon: '✎', route: '/pdf/edit', color: 'from-violet-500 to-indigo-600', category: 'pdf', group: 'edit', status: 'live' },

  // SECURITY
  { id: 'unlock', name: 'Unlock PDF', desc: 'Remove permission restrictions from a PDF.', icon: '🔓', route: '/pdf/unlock', color: 'from-lime-500 to-emerald-600', category: 'pdf', group: 'security', status: 'live' },
  { id: 'sign', name: 'Sign PDF', desc: 'Draw your signature and stamp it onto a page.', icon: '✍', route: '/pdf/sign', color: 'from-pink-500 to-rose-600', category: 'pdf', group: 'security', status: 'live' },
  { id: 'redact', name: 'Redact PDF', desc: 'Permanently black out areas of a PDF.', icon: '█', route: '/pdf/redact', color: 'from-slate-700 to-slate-900', category: 'pdf', group: 'security', status: 'live' },

  // FINANCE
  { id: 'currency', name: 'Currency Converter', desc: 'Live exchange rates for 30+ world currencies.', icon: '$', route: '/currency', color: 'from-green-500 to-emerald-600', category: 'finance', status: 'live' },
  { id: 'crypto', name: 'Cryptocurrency', desc: 'Live coin prices, 24h changes & market caps.', icon: '₿', route: '/crypto', color: 'from-yellow-500 to-orange-500', category: 'finance', status: 'live' },

  // LIFESTYLE
  { id: 'weather', name: 'Live Weather', desc: 'Real-time weather, hourly + 7-day forecast.', icon: '☀', route: '/weather', color: 'from-cyan-500 to-sky-600', category: 'lifestyle', status: 'live' },
];

export const PDF_TOOLS = TOOLS.filter(t => t.category === 'pdf');
export const FINANCE_TOOLS = TOOLS.filter(t => t.category === 'finance');
export const LIFESTYLE_TOOLS = TOOLS.filter(t => t.category === 'lifestyle');

export const PDF_GROUPS: { id: PdfGroup; label: string }[] = [
  { id: 'organize', label: 'Organize PDF' },
  { id: 'optimize', label: 'Optimize PDF' },
  { id: 'convert-to', label: 'Convert to PDF' },
  { id: 'convert-from', label: 'Convert from PDF' },
  { id: 'edit', label: 'Edit PDF' },
  { id: 'security', label: 'PDF Security' },
];
