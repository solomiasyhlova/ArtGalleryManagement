import type { RequestHandler } from 'express';

/**
 * Sends the client's `index.html` to browser navigations, so a reload of a client route (e.g.
 * `/artworks/:id`, which the API also serves) renders the app. Only `GET`/`HEAD` requests that
 * prefer HTML match: the client's API calls send `Accept: application/json`, and curl, health
 * checks and `<img>` requests (which accept any type) negotiate to JSON, so they keep the API's
 * behavior.
 */
export function spaFallback(indexFile: string): RequestHandler {
  return (req, res, next) => {
    const isRead = req.method === 'GET' || req.method === 'HEAD';
    if (!isRead || req.accepts(['json', 'html']) !== 'html') {
      next();
      return;
    }
    // Always revalidate, so a redeploy's new hashed asset names are picked up.
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexFile, (error) => {
      // A client that hung up mid-response also lands here; there's nothing left to send then.
      if (error && !res.headersSent) next(error);
    });
  };
}
