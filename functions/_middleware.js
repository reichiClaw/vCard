/**
 * Pass-through middleware.
 *
 * iOS contact-sheet auto-open is handled in the client after the HTML page
 * (with Call / Email CTAs) has rendered — so dismissing the sheet still leaves
 * a usable page underneath / in history.
 */

export async function onRequest(context) {
  return context.next();
}
