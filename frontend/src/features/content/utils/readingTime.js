/**
 * readingTime · minutes-to-read estimate from a body of structured blocks.
 *
 * Uses 220 wpm as the reading rate (German leadership audience, longer
 * sentences than English consumer copy, slight discount on the standard
 * 250 wpm). Counts text content only; image and framework blocks add a
 * flat 6-second cost for visual parsing.
 *
 * @param {Array<Object>} blocks · the article.body array of {type, ...}
 * @returns {number} minutes, rounded up to the nearest whole minute
 */
export function readingTime(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return 1;

  let words = 0;
  let visualSeconds = 0;

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
      case 'quote':
      case 'callout':
        words += countWords(block.text);
        if (block.attribution) words += countWords(block.attribution);
        break;
      case 'list':
        for (const item of block.items ?? []) words += countWords(item);
        break;
      case 'framework':
        words += countWords(block.title);
        words += countWords(block.explanation);
        visualSeconds += 6;
        break;
      case 'image':
        words += countWords(block.caption);
        visualSeconds += 6;
        break;
      default:
        words += countWords(block.text);
    }
  }

  const minutesFromWords = words / 220;
  const minutesFromVisuals = visualSeconds / 60;
  return Math.max(1, Math.ceil(minutesFromWords + minutesFromVisuals));
}

function countWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
