/**
 * On iPhone / iPad Safari, serve the vCard at `/` so iOS opens the native
 * contact sheet immediately — no button press.
 *
 * Escape hatch: `/?page=1` (or any non-root path) still shows the HTML page.
 */

const IOS_UA = /iPhone|iPad|iPod/i;

function wantsHtmlPage(url) {
  return (
    url.searchParams.has("page") ||
    url.searchParams.get("view") === "page" ||
    url.searchParams.has("html")
  );
}

function isIosUserAgent(ua) {
  return IOS_UA.test(ua || "");
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  const isRoot =
    url.pathname === "/" || url.pathname === "" || url.pathname === "/index.html";

  if (
    request.method === "GET" &&
    isRoot &&
    isIosUserAgent(request.headers.get("user-agent")) &&
    !wantsHtmlPage(url)
  ) {
    const vcfRequest = new Request(new URL("/contact.vcf", url), request);
    const asset = await env.ASSETS.fetch(vcfRequest);
    const headers = new Headers(asset.headers);
    headers.set("Content-Type", "text/vcard; charset=utf-8");
    headers.set(
      "Content-Disposition",
      'inline; filename="christian-reichinger.vcf"'
    );
    headers.set("Cache-Control", "public, max-age=300");
    return new Response(asset.body, { status: 200, headers });
  }

  return next();
}
