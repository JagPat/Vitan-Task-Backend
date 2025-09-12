/**
 * Lightweight language detection utility (heuristic)
 * - ASCII dominant → 'en'
 * - Devanagari range → 'hi'
 * - Arabic range → 'ar'
 * - Basic Spanish keywords → 'es'
 */
function detectLanguage(text = '') {
  if (!text) return 'en';
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  if (hasDevanagari) return 'hi';
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (hasArabic) return 'ar';
  const lowered = text.toLowerCase();
  const spanishHints = ['crear tarea', 'asignar', 'proyecto', 'pendiente'];
  if (spanishHints.some(k => lowered.includes(k))) return 'es';
  // Default: English
  return 'en';
}

module.exports = { detectLanguage };

