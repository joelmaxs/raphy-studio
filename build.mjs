/**
 * Raphy Studios — gerador do site
 *
 * Lê:   src/pages/*.html, src/partials/*.html, content/projects/*.json, public/**
 * Gera: dist/  (site pronto para publicar)
 *
 * Uso:  node build.mjs          (não precisa instalar nada)
 * Na Cloudflare Pages: Build command = "node build.mjs" · Output directory = "dist"
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/* ───────── configuração do site ───────── */
const SITE = {
  url: "https://raphystudio.com",
  name: "Raphy Studios",
  description:
    "Raphy is an animation studio based in Northeastern Brazil. We create 3D animations, 2D illustrations, music videos, game trailers and a wide range of digital content.",
  image: "/assets/images/images-home/rush_capa.webp",
};

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, "dist");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const write = (p, s) => {
  const full = join(DIST, p);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, s);
};

/* ───────── utilidades ───────── */
const esc = (s = "") =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const stripTags = (s = "") => String(s).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const nl2br = (s = "") => String(s).replace(/\n/g, " <br>\n");
const pad = (n) => String(n).padStart(2, "0");
const abs = (p = "") => (/^https?:/.test(p) ? p : SITE.url + (p.startsWith("/") ? p : "/" + p));

/* ───────── projetos (content/projects/*.json) ───────── */
const projects = readdirSync(join(ROOT, "content/projects"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => {
    const p = JSON.parse(read(`content/projects/${f}`));
    p.slug = (p.slug || f.replace(/\.json$/, "")).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    return p;
  })
  .filter((p) => p.published !== false)
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

const hasPage = (p) => p.link !== "external" && p.page;
const projectHref = (p) => (hasPage(p) ? `/projects/${p.slug}` : p.externalUrl || "#");

/* ───────── partes comuns ───────── */
const partials = {
  header: read("src/partials/header.html"),
  footer: read("src/partials/footer.html").replace("{{year}}", new Date().getFullYear()),
  loader: read("src/partials/loader.html"),
};

const CSS = {
  index: ["global", "header", "footer", "index"],
  about: ["global", "header", "footer", "about"],
  projects: ["global", "header", "footer", "projects"],
  contact: ["global", "header", "footer", "contact"],
  project: ["global", "header", "footer", "project-layout"],
};
const JS = {
  index: ["components/loadComponents.js", "animations/loader.js", "animations/reveal.js", "main.js"],
  about: ["animations/loader.js", "components/loadComponents.js", "animations/reveal.js", "main.js|defer"],
  projects: ["animations/loader.js", "components/loadComponents.js", "animations/reveal.js", "main.js|defer"],
  contact: ["animations/loader.js", "components/loadComponents.js", "animations/reveal.js", "main.js|defer"],
  project: ["https://www.youtube.com/iframe_api", "animations/loader.js", "components/project-layout.js", "components/loadComponents.js", "animations/reveal.js", "main.js|defer"],
};

function head(kind, { title, description, image, path }) {
  const css = CSS[kind].map((n) => `    <link rel="stylesheet" href="/css/${n}.css">`).join("\n");
  return `    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${abs(path)}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="${esc(SITE.name)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${abs(image)}">
    <meta property="og:url" content="${abs(path)}">
    <meta name="twitter:card" content="summary_large_image">

${css}
    <link rel="icon" type="image/x-icon" href="/assets/icons/icon.ico">`;
}

const scripts = (kind) =>
  JS[kind]
    .map((s) => {
      const [src, mode] = s.split("|");
      const url = src.startsWith("http") ? src : `/js/${src}`;
      return `    <script ${mode === "defer" ? "defer " : ""}src="${url}"></script>`;
    })
    .join("\n");

function render(kind, meta, vars = {}) {
  let html = read(`src/pages/${kind}.html`);
  html = html
    .replace("{{head}}", head(kind, meta))
    .replace("{{scripts}}", scripts(kind))
    .replace('<div id="loader-container"></div>', `<div id="loader-container">${partials.loader}</div>`)
    .replace('<div id="header-container"></div>', `<div id="header-container">${partials.header}</div>`)
    .replace('<div id="footer-container"></div>', `<div id="footer-container">${partials.footer}</div>`);
  for (const [k, v] of Object.entries(vars)) html = html.split(`{{${k}}}`).join(v);
  return html;
}

/* ───────── home: projetos em destaque ───────── */
function homeProjects() {
  return projects
    .filter((p) => p.home && p.home.show)
    .sort((a, b) => (a.home.order ?? 999) - (b.home.order ?? 999))
    .map((p, i) => {
      const h = p.home;
      const paras = (h.paragraphs || []).filter(Boolean).map((t) => `\n                            <span>\n                                ${t}\n                            </span>`).join("\n");
      return `
                <a href="${esc(projectHref(p))}" target="_blank" class="project">
                    <div class="project-texts">
                        <div class="project-title reveal">
                            ${nl2br(h.title || p.title)}
                            <span class="project-title-num">${pad(i + 1)}</span>
                        </div>

                        <div class="project-desc reveal">
                            <b>${h.lead || ""}</b>
${paras}
                        </div>
                    </div>

                    <div class="project-img reveal">
                        <img src="${esc(h.cover || p.grid?.cover || "")}" alt="${esc(stripTags(p.title))}" style="object-position: ${esc(h.coverPosition || "center")};">
                    </div>
                </a>`;
    })
    .join("\n");
}

/* ───────── página Projects: grade (padrão 2 · 1 · 3 que se repete) ───────── */
function gridProjects() {
  const GROUPS = [
    { size: 2, open: '<div class="layout layout-1">' },
    { size: 1, open: '<div class="layout layout2">' },
    { size: 3, open: '<div class="layout3">' },
  ];
  const card = (p, n) => {
    const g = p.grid || {};
    const ext = !hasPage(p);
    const video = g.video
      ? `
                    <video autoplay muted loop playsinline>
                        <source src="${esc(g.video)}" type="video/mp4">
                    </video>
`
      : "";
    return `                <a href="${esc(projectHref(p))}" class="project"${ext ? ' target="_blank"' : ""} data-category="${esc(p.category || "commercial")}">${video}
                    <img src="${esc(g.cover || "")}" alt="${esc(stripTags(p.title))}" style="object-position: ${esc(g.coverPosition || "center")};">

                    <div class="project-info">
                        <span>${p.title}</span>
                        <span>${pad(n)}</span>
                    </div>
                </a>`;
  };
  let out = "", i = 0, gi = 0;
  while (i < projects.length) {
    const g = GROUPS[gi % GROUPS.length];
    const items = projects.slice(i, i + g.size).map((p, k) => card(p, i + k + 1));
    out += `            ${g.open}\n${items.join("\n\n")}\n            </div>\n\n`;
    i += g.size;
    gi++;
  }
  return out;
}

/* ───────── página de projeto: conteúdo do painel → formato do template ───────── */
function toLayoutData(p) {
  const g = p.page || {};
  const d = {};
  d.pageStyle = {
    background: g.theme === "white" ? "white" : "black",
    logo: `/assets/icons/logo-raphy-${g.logo === "black" ? "black" : "white"}.svg`,
    menuIcon: `/assets/icons/${g.menuIcon === "dark" ? "menu-close" : "menu"}.svg`,
  };
  if (g.overflowVisible) d.pageStyle.overflowX = "visible";
  if (g.heading?.title) d.title = g.heading.title;
  if (g.heading?.number) d.number = g.heading.number;
  if (g.hero?.show) {
    d.hero = { text: g.hero.text, logo: g.hero.logo };
    if (g.hero.button1Text) d.hero.button1 = { text: g.hero.button1Text, href: g.hero.button1Link || "#" };
    if (g.hero.button2Text) d.hero.button2 = { text: g.hero.button2Text, href: g.hero.button2Link || "#", icon: g.hero.button2Icon };
  }
  if (g.video?.youtubeId) d.video = { youtubeId: g.video.youtubeId, youtubeShortsId: g.video.youtubeShortsId };
  const ds = g.description || {};
  if (ds.text) d.description = ds.text;
  if (ds.header) d["description-header"] = ds.header;
  if (ds.column1 || ds.column2Title || ds.column2Text || ds.column3 || ds.column4)
    d.info = { description_1: ds.column1, description_2_1: ds.column2Title, description_2_2: ds.column2Text, description_3: ds.column3, description_4: ds.column4 };
  if (g.gallery?.length) d.gallery = g.gallery;
  const slider = (s) => (s?.images?.length ? [{ "slide-description": s.text || "" }, { "slide-title": s.title || "" }, { "slide-imgs": s.images }] : undefined);
  d["slide-modelsheet"] = slider(g.modelsheet);
  d["slide-backgrounds"] = slider(g.backgrounds);
  if (g.process?.length) d.process = { steps: g.process };
  const c = g.concept || {};
  if (c.image1 || c.image2 || c.text1)
    d.concept = {
      header: c.header, text1: c.text1, text2: c.text2,
      image1: c.image1 ? { src: c.image1, label: c.image1Label, credit: c.image1Credit } : undefined,
      image2: c.image2 ? { src: c.image2, label: c.image2Label, credit: c.image2Credit } : undefined,
    };
  if (g.fullImage1) d["image-full1"] = g.fullImage1;
  if (g.fullImage2) d["image-full2"] = g.fullImage2;
  const a = g.animation2d || {};
  if (a.image1 || a.image2) Object.assign(d, { "animation2d-description": a.text, "animation2d-header": a.header, "animation2d-img1": a.image1, "animation2d-img2": a.image2 });
  if (g.credits?.people?.length) {
    d["credits-header"] = g.credits.header;
    d.credits = g.credits.people.map((x) => ({ name: x.name, role: x.role }));
  }
  if (g.contact?.show) d.contact = { header: g.contact.header || "GET IN TOUCH" };
  const t = g.trailerBanner || {};
  if (t.show) d.tob = { title: t.title, link: t.link, text1: t.text1, text2: t.text2, text3: t.text3 };
  d.name = stripTags(p.title);
  return JSON.parse(JSON.stringify(d)); // remove campos vazios (undefined)
}

/* ───────── gerar ───────── */
rmSync(DIST, { recursive: true, force: true });
cpSync(join(ROOT, "public"), DIST, { recursive: true });

write("index.html", render("index", { title: "Raphy Studios - Home", description: SITE.description, image: SITE.image, path: "/" }, { homeProjects: homeProjects() }));
write("about/index.html", render("about", { title: "About - Raphy Studios", description: SITE.description, image: SITE.image, path: "/about" }));
write("projects/index.html", render("projects", { title: "Raphy Studios - Projects", description: "Selected animation projects by Raphy Studios: cinematics, short films, game trailers and more.", image: SITE.image, path: "/projects" }, { gridProjects: gridProjects(), projectCount: pad(projects.length) }));
write("contact/index.html", render("contact", { title: "Contact - Raphy Studios", description: "Get in touch with Raphy Studios — general enquiries, commercial proposals and joining the team.", image: SITE.image, path: "/contact" }));

const legacy = {};
for (const p of projects.filter(hasPage)) {
  const data = JSON.stringify(toLayoutData(p)).replace(/</g, "\\u003c");
  const name = stripTags(p.title);
  write(
    `projects/${p.slug}/index.html`,
    render("project", {
      title: `${name} - Raphy Studios`,
      description: p.seoDescription || stripTags(p.page?.description?.text || "") || SITE.description,
      image: p.grid?.cover || SITE.image,
      path: `/projects/${p.slug}`,
    }, { projectData: data })
  );
  if (p.legacyId) legacy[p.legacyId] = p.slug;
}

/* links antigos (/pages/...) continuam funcionando */
write("_redirects", [
  "/index.html / 301",
  "/pages/about.html /about 301",
  "/pages/projects.html /projects 301",
  "/pages/contact.html /contact 301",
  "/pages/about /about 301",
  "/pages/projects /projects 301",
  "/pages/contact /contact 301",
].join("\n") + "\n");
const legacyPage = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Raphy Studios</title>
<script>var m=${JSON.stringify(legacy)};var d=new URLSearchParams(location.search).get("data");location.replace(m[d]?"/projects/"+m[d]:"/projects");</script>
</head><body></body></html>\n`;
write("pages/project-layout.html", legacyPage);
write("pages/project-layout/index.html", legacyPage);

/* SEO */
const urls = ["/", "/about", "/projects", "/contact", ...projects.filter(hasPage).map((p) => `/projects/${p.slug}`)];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${abs(u)}</loc></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${abs("/sitemap.xml")}\n`);

console.log(`✓ site gerado em dist/ — ${projects.length} projetos (${projects.filter(hasPage).length} com página própria)`);
