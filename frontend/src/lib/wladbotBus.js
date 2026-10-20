/**
 * wladbotBus — tiny event bus for inter-component WladBot drawer triggers.
 *
 * Why: the FolderRail (in the Video Studio Sidebar) needs to open the
 * globally-mounted FloatingWladBotDrawer with a specific folder + prefilled
 * briefing message. Both components are far apart in the tree, so a tiny
 * window-level event keeps them decoupled — no Context provider needed.
 *
 * Events:
 *   - 'wladbot:open'    detail: { folderId?, briefingMessage? }
 *   - 'wladbot:close'
 *   - 'wladbot:pagecontext' detail: { folderId?, entryId?, entryTitle?, pageLabel? }
 *       Published by any page that knows the user's current "active" folder
 *       so the FAB drawer can pre-select it instead of guessing.
 *       Subscribers receive the LATEST value via getLastPageContext() too.
 */

const EV_OPEN = 'wladbot:open';
const EV_CLOSE = 'wladbot:close';
const EV_PAGE_CONTEXT = 'wladbot:pagecontext';

// Last-known page context — late subscribers (e.g. the drawer mounted after
// the page rendered) can read this synchronously instead of waiting for the
// next event.
let _lastPageContext = null;

export const openWladBotDrawer = ({ folderId, briefingMessage } = {}) => {
  window.dispatchEvent(new CustomEvent(EV_OPEN, { detail: { folderId, briefingMessage } }));
};

export const closeWladBotDrawer = () => {
  window.dispatchEvent(new CustomEvent(EV_CLOSE));
};

export const subscribeWladBotOpen = (cb) => {
  const handler = (e) => cb(e.detail || {});
  window.addEventListener(EV_OPEN, handler);
  return () => window.removeEventListener(EV_OPEN, handler);
};

export const subscribeWladBotClose = (cb) => {
  const handler = () => cb();
  window.addEventListener(EV_CLOSE, handler);
  return () => window.removeEventListener(EV_CLOSE, handler);
};

export const setWladBotPageContext = (ctx) => {
  _lastPageContext = ctx && (ctx.folderId || ctx.entryId || ctx.pageLabel) ? ctx : null;
  window.dispatchEvent(new CustomEvent(EV_PAGE_CONTEXT, { detail: _lastPageContext }));
};

export const clearWladBotPageContext = () => {
  _lastPageContext = null;
  window.dispatchEvent(new CustomEvent(EV_PAGE_CONTEXT, { detail: null }));
};

export const getLastPageContext = () => _lastPageContext;

export const subscribeWladBotPageContext = (cb) => {
  const handler = (e) => cb(e.detail || null);
  window.addEventListener(EV_PAGE_CONTEXT, handler);
  return () => window.removeEventListener(EV_PAGE_CONTEXT, handler);
};
