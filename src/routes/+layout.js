// Every route is static: prerender all of them so direct loads of pages without
// their own server load (About, Contact, Retro) get real HTML, not the SPA 404.
export const prerender = true;
