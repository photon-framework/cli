import type { Document } from "domhandler";

const createSitemapUrl = (
  xml: Array<string>,
  loc: string,
  lastmod: string,
  priority: number
) => {
  xml.push("<url>");
  xml.push(`<loc>${loc}</loc>`);
  xml.push(`<lastmod>${lastmod}</lastmod>`);
  xml.push(`<priority>${priority.toFixed(2)}</priority>`);
  xml.push("</url>");
};

export const createSitemap = (
  contentFiles: Map<string, Document>,
  canonical: string
) => {
  const date = new Date().toISOString().split("T")[0]!;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  createSitemapUrl(xml, `${canonical}/`, date, 1);
  for (const path of contentFiles.keys()) {
    createSitemapUrl(xml, `${canonical}/${path}`, date, 0.75);
  }

  xml.push("</urlset>");

  return xml.join("");
};
