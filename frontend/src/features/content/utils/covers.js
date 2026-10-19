/**
 * Cover-resolver · Players'-Tribune-style editorial photography for every
 * article, even when the article itself has no `cover` field yet.
 *
 * Strategy: pick from a curated pool of Unsplash editorial photos, bucketed
 * by category. The bucket is chosen via `categoryForArticle()` (taxonomy);
 * the photo inside the bucket is chosen by a deterministic hash of the
 * article slug so the same article always shows the same cover.
 *
 * The pool URLs are Unsplash's CDN with width/quality params · hotlink-safe,
 * fast (auto-format=avif/webp where supported), and crop-aware via fit=crop.
 * If you ever want to override one article: set `cover: '/path/to/file.jpg'`
 * on the article record and `resolveCover()` will return that path verbatim.
 */
import { categoryForArticle } from '../data/taxonomy';
import { topicCover } from './topicCovers';

// Curated editorial photo pool. Each entry is the Unsplash photo ID · we
// render the full CDN URL at request time. Keep ~6 per bucket so the same
// photo doesn't repeat on a single category section.
const POOL = {
  // KI-Praxis · abstract tech, light/dark code, dim AI imagery
  'C-01': [
    '1677442136019-21780ecad995', // soft neural abstract
    '1620712943543-bcc4688e7485', // dark monitor light
    '1518770660439-4636190af475', // circuit dark macro
    '1620712943543-26fcaad3dc12', // ai face profile
    '1591453089816-0fbb971b454c', // glowing data stream
    '1639762681485-074b7f938ba0', // editorial chatgpt-style
  ],
  // Methoden & Frameworks · editorial business, notebooks, hands at work
  'C-02': [
    '1517048676732-d65bc937f952', // boardroom hands meeting
    '1454165804606-c3d57bc86b40', // notebook desk pencil
    '1551836022-d5d88e9218df', // whiteboard sketch
    '1498050108023-c5249f4df085', // laptop minimal flat
    '1556761175-5973dc0f32e7',    // architectural office, dark
    '1542744173-8e7e53415bb0',    // executive notes
  ],
  // Rhetorik & Kommunikation · speakers, microphones, conferences, faces
  'C-03': [
    '1505373877841-8d25f7d46678', // speaker on stage
    '1475721027785-f74eccf877e2', // microphone close
    '1559223607-a43f990c692c',    // moderator close
    '1521737711867-e3b97375f902', // panel from above
    '1559523182-a284c3fb7cff',    // single mic in light
    '1591115765373-5207764f72e4', // contemplative debate
  ],
  // Rollen & Karriere · portraits, contemplative, identity
  'C-04': [
    '1507003211169-0a1dd7228f2d', // portrait man window light
    '1573497019940-1c28c88b4f3e', // portrait woman editorial
    '1581092334651-ddf26d9a09d0', // portrait suit serious
    '1573497019418-b400bb3ab074', // portrait woman thinking
    '1500648767791-00dcc994a43e', // portrait monochrome
    '1521119989659-a83eee488004', // portrait standing window
  ],
  // Plattform & LeaderOS · products, screens, architecture, sets
  'C-05': [
    '1497366216548-37526070297c', // architecture corridor
    '1497366811353-6870744d04b2', // workspace minimal
    '1493612276216-ee3925520721', // editorial product set
    '1486325212027-8081e485255e', // architecture editorial
    '1517245386807-bb43f82c33c4', // angled architecture dark
    '1485827404703-89b55fcc595e', // led arrows minimal
  ],
};

const FALLBACK = POOL['C-02'];

function hash(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Resolve a cover URL for an article.
 *
 * @param {object} article · registry article record
 * @param {'wide'|'square'|'portrait'|'lead'} [shape] · controls width/ratio
 * @returns {string} CDN URL
 */
export function resolveCover(article, shape = 'wide') {
  if (article?.cover) return article.cover;

  const code = categoryForArticle(article);
  const bucket = POOL[code] || FALLBACK;
  const id = bucket[hash(article?.slug || '') % bucket.length];

  // shape → Unsplash crop params. We always use fit=crop + auto=format so
  // the CDN serves AVIF/WebP where supported.
  const cropParams = {
    wide:     'w=1600&h=1000&fit=crop&crop=faces,edges',
    lead:     'w=2200&h=1400&fit=crop&crop=faces,edges',
    square:   'w=900&h=900&fit=crop&crop=faces,center',
    portrait: 'w=900&h=1200&fit=crop&crop=faces,edges',
  }[shape] || 'w=1600&h=1000&fit=crop';

  return `https://images.unsplash.com/photo-${id}?${cropParams}&auto=format&q=80`;
}

/**
 * Lokales Cover · themenpassendes Editorial-Foto (utils/topicCovers.js,
 * public/journal/topics/). Primärer Fallback für Artikel-Hero und og:image:
 * liegt im Bundle, braucht keinen CSP-Eintrag, und derselbe Slug zeigt immer
 * dasselbe Bild. Die abstrakten Texturen unter /journal/covers/ bleiben für
 * Flächen ohne Artikelbezug.
 */
export const LOCAL_COVER_COUNT = 10;

export function localCoverPath(article) {
  return topicCover(article);
}

/**
 * Convenience: a low-res blurred placeholder for the same photo ·
 * useful as a CSS background-image while the main img loads.
 */
export function resolveCoverPlaceholder(article) {
  if (article?.cover) return null;
  const code = categoryForArticle(article);
  const bucket = POOL[code] || FALLBACK;
  const id = bucket[hash(article?.slug || '') % bucket.length];
  return `https://images.unsplash.com/photo-${id}?w=40&blur=20&q=20&auto=format`;
}
