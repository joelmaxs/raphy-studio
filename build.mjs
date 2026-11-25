/**
 * Raphy Studios — gerador do site
 *
 * Lê:   src/pages/*.html, src/partials/*.html, content/projects/*.json, public/**
 * Gera: dist/  (site pronto para publicar)
 *
 * Uso:  npm install  (uma vez)  →  node build.mjs
 *       Sem o "sharp" instalado o site é gerado igual, só sem as versões menores das imagens.
 * Na Cloudflare Pages: Build command = "node build.mjs" · Output directory = "dist"
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, cpSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, extname } from "node:path";
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
  writeFileSync(full, p.endsWith(".html") ? optimizeHtml(s) : s);
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
    // painel: "Ao clicar" é um bloco único — página própria OU link externo
    if (Array.isArray(p.destination)) {
      const d = p.destination[0] || { type: "external", url: "" };
      if (d.type === "page") {
        p.link = "page";
        p.page = { theme: d.theme, logo: d.logo, menuIcon: d.menuIcon, overflowVisible: d.overflowVisible, sections: d.sections || [] };
        if (d.seoDescription) p.seoDescription = d.seoDescription;
      } else {
        p.link = "external";
        p.externalUrl = d.url || "";
        delete p.page;
      }
    }
    // painel: destaque na Home só existe se o bloco foi adicionado
    if (Array.isArray(p.homeHighlight)) {
      const h = p.homeHighlight[0];
      p.home = h ? { show: true, ...h } : { show: false };
    }
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
  index: ["components/loadComponents.js", "animations/loader.js", "animations/reveal.js", "main.js", "media.js|defer"],
  about: ["animations/loader.js", "components/loadComponents.js", "animations/reveal.js", "main.js|defer", "media.js|defer"],
  projects: ["animations/loader.js", "components/loadComponents.js", "animations/reveal.js", "main.js|defer", "projects-filter.js|defer", "media.js|defer"],
  contact: ["animations/loader.js", "components/loadComponents.js", "animations/reveal.js", "main.js|defer", "media.js|defer"],
  project: ["https://www.youtube.com/iframe_api", "animations/loader.js", "components/project-layout.js", "components/loadComponents.js", "animations/reveal.js", "main.js|defer", "media.js|defer"],
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

    <link rel="preconnect" href="https://fonts.cdnfonts.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.cdnfonts.com/css/neue-haas-grotesk-display-pro">
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
                    <video autoplay muted loop playsinline data-cover="${esc(g.cover || "")}">
                        <source src="${esc(g.video)}" type="video/mp4">
                    </video>
`
      : "";
    return `                <a href="${esc(projectHref(p))}" class="project"${ext ? ' target="_blank"' : ""} data-category="${esc(p.category || "commercial")}">${video}
                    <img src="${esc(g.cover || "")}" sizes="(min-width: 768px) 50vw, 100vw" alt="${esc(stripTags(p.title))}" style="object-position: ${esc(g.coverPosition || "center")};">

                    <div class="project-info">
                        <span>${p.title}</span>
                        <span>${pad(n)}</span>
                    </div>
                </a>`;
  };
  // grade montada no painel (content/projects-page.json); sem configuração, segue o padrão 2 / 1 / 3
  const OPEN = { 1: GROUPS[1].open, 2: GROUPS[0].open, 3: GROUPS[2].open };
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const used = new Set();
  const rows = [];
  let cfg = {};
  try { cfg = JSON.parse(read("content/projects-page.json")); } catch {}
  for (const r of cfg.rows || []) {
    const refs = (Array.isArray(r.projects) ? r.projects : [r.projects])
      .map((v) => String(v || "").replace(/^.*\//, "").replace(/\.json$/, ""))
      .map((slug) => bySlug.get(slug))
      .filter((p) => p && !used.has(p.slug));
    const size = Math.min(Number(r.layout) || refs.length, 3);
    for (let k = 0; k < refs.length; k += size) {
      const chunk = refs.slice(k, k + size);
      chunk.forEach((p) => used.add(p.slug));
      rows.push(chunk);
    }
  }
  const rest = projects.filter((p) => !used.has(p.slug));
  let gi = 0;
  for (let i = 0; i < rest.length; gi++) {
    const size = GROUPS[gi % GROUPS.length].size;
    rows.push(rest.slice(i, i + size));
    i += size;
  }
  let out = "", n = 0;
  for (const row of rows) {
    const items = row.map((p) => card(p, ++n));
    out += `            ${OPEN[row.length]}\n${items.join("\n\n")}\n            </div>\n\n`;
  }
  return out;
}

/* ───────── página de projeto: blocos do painel (page.sections) → HTML pronto ───────── */
const fmt = (t = "") => String(t).replace(/\n/g, "<br>");
const span = (id, v, cls = "") => `<span${cls ? ` class="${cls}"` : ""}${id ? ` id="${id}"` : ""}${v ? "" : ' style="display: none;"'}>${v ? fmt(v) : ""}</span>`;

// projetos antigos (campos fixos) viram a lista de blocos, na ordem do modelo original
function legacySections(g = {}) {
  const out = [];
  if (g.hero?.show) out.push({ type: "hero", ...g.hero });
  if (g.heading?.title || g.heading?.number) out.push({ type: "title", title: g.heading.title, number: g.heading.number });
  if (g.video?.youtubeId) out.push({ type: "video", ...g.video });
  const ds = g.description || {};
  if (ds.text || ds.column1 || ds.column2Title || ds.column2Text || ds.column3 || ds.column4) out.push({ type: "description", ...ds });
  if (g.gallery?.length) out.push({ type: "gallery", images: g.gallery });
  if (g.modelsheet?.images?.length) out.push({ type: "slider", ...g.modelsheet });
  const c = g.concept || {};
  if (c.image1 || c.image2 || c.text1) out.push({ type: "concept", ...c });
  if (g.fullImage1) out.push({ type: "fullImage", image: g.fullImage1 });
  if (g.process?.length) out.push({ type: "process", steps: g.process });
  if (g.backgrounds?.images?.length) out.push({ type: "slider", ...g.backgrounds });
  const an = g.animation2d || {};
  if (an.image1 || an.image2) out.push({ type: "twoImages", ...an });
  if (g.fullImage2) out.push({ type: "fullImage", image: g.fullImage2 });
  if (g.credits?.people?.length) out.push({ type: "credits", ...g.credits });
  if (g.contact?.show) out.push({ type: "contact", header: g.contact.header });
  if (g.trailerBanner?.show) out.push({ type: "trailerBanner", ...g.trailerBanner });
  return out;
}

function renderSections(p) {
  const g = p.page || {};
  const list = Array.isArray(g.sections) ? g.sections : legacySections(g);
  let fulls = 0;
  const B = {
    title: (s) => `
        <div class="project-title">
            <div>
                ${span("project-title_text", s.title)}
                ${span("project-title_num", s.number)}
            </div>
        </div>`,
    hero: (s) => `
        <section class="hero-container">
            <span class="hero-text" id="hero-text">${fmt(s.text || "")}</span>
            ${s.logo ? `<img id="hero-img" alt="${esc(stripTags(p.title))}" class="hero-img" src="${esc(s.logo)}">` : ""}
            <div class="hero-btn">${s.button1Text ? `
                <a href="${esc(s.button1Link || "#")}" class="hero-btn1" id="hero-btn1">
                    <span id="hero-btn1-text">${esc(s.button1Text)}</span>
                </a>` : ""}${s.button2Text ? `
                <a href="${esc(s.button2Link || "#")}" class="hero-btn2" id="hero-btn2" target="_blank" rel="noopener">
                    <span id="hero-btn2-text">${esc(s.button2Text)}</span>${s.button2Icon ? `
                    <img alt="" class="icon-hero-btn" id="hero-btn2-icon" src="${esc(s.button2Icon)}">` : ""}
                </a>` : ""}
            </div>
        </section>`,
    video: (s) => s.youtubeId ? `
        <section class="video-wrapper" data-yt="${esc(s.youtubeId)}" data-yt-mobile="${esc(s.youtubeShortsId || "")}">
            <iframe id="project-video" title="${esc(stripTags(p.title))}" frameborder="0" loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen></iframe>
        </section>` : "",
    description: (s) => `
        <section class="project-description">
            <div class="project-description-header">
                ${span("project-description-header-text", s.text)}
                ${span("section-header-description", s.header, "section-header")}
            </div>
            <div class="project-info">
                <div class="project-info-columns">
                    ${span("project-description_1", s.column1)}
                    <span id="project-description_2">
                        ${span("project-description_2_1", s.column2Title)}
                        ${span("project-description_2_2", s.column2Text)}
                    </span>
                    ${span("project-description_3", s.column3)}
                    ${span("project-description_4", s.column4)}
                </div>
            </div>
        </section>`,
    gallery: (s) => (s.images || []).length ? `
        <div class="synopsis-gallery">${s.images.map((src) => `<img src="${esc(src)}" class="gallery-img" sizes="(min-width: 768px) 50vw, 100vw" alt="${esc(stripTags(p.title))}" loading="lazy">`).join("")}</div>` : "",
    slider: (s) => (s.images || []).length ? `
        <section class="project-slider">
            <div class="project-slider-texts">
                <span class="project-slider-texts_description">${fmt(s.text || "")}</span>
                <span class="section-header">${esc(s.title || "")}</span>
            </div>
            <div class="project-slider-container">
                <div class="project-slider-track">${s.images.map((src, i) => `<div class="project-slide" data-slide="${i + 1}"><img src="${esc(src)}" sizes="85vw" alt="${esc(s.title || stripTags(p.title))}" draggable="false" loading="lazy"></div>`).join("")}</div>
            </div>
        </section>` : "",
    concept: (s) => {
      const img = (n, cls) => s[`image${n}`] ? `
                <div class="container-concept-img${cls}" id="concept-img-${n}" style="background-image: url(&quot;${esc(s[`image${n}`])}&quot;);">
                    <div class="concept-img_text">
                        <span id="concept-img-${n}-label">${esc(s[`image${n}Label`] || "")}</span>
                        <span id="concept-img-${n}-credit">${esc(s[`image${n}Credit`] || "")}</span>
                    </div>
                </div>` : "";
      return `
        <section class="concept">
            <div class="concept-left">
                <div class="section-header" id="concept-header">${esc(s.header || "")}</div>
                <div class="concept-text">
                    ${span("concept-text-1", s.text1)}
                    ${span("concept-text-2", s.text2)}
                </div>${img(1, "")}
            </div>${img(2, " concept-img-2")}
        </section>`;
    },
    fullImage: (s) => s.image ? `
        <div class="project-image-fullscream"${fulls++ ? ' id="image-fullscream2"' : ""} style="background-image: url(&quot;${esc(s.image)}&quot;);" role="img" aria-label="${esc(stripTags(p.title))}"></div>` : "",
    process: (s) => (s.steps || []).length ? `
        <section class="process" id="process" style="height: ${60 + s.steps.length * 60 + 60}vh;" data-steps="${esc(JSON.stringify(s.steps.map((x) => ({ title: x.title || "", text: x.text || "", image: x.image || "" }))))}">
            <div class="process-sticky">
                <div class="process-img">
                    <img id="process-img" src="${esc(s.steps[0].image || "")}" alt="${esc(s.steps[0].title || "")}">
                </div>
                <div class="process-texto">
                    <b id="process-title"></b>
                    <span id="process-text"></span>
                </div>
            </div>
        </section>` : "",
    twoImages: (s) => (s.image1 || s.image2) ? `
        <section class="project-animation2d">
            <div class="project-animation2d-texts">
                <span class="project-animation2d-texts_description">${fmt(s.text || "")}</span>
                <span class="section-header">${esc(s.header || "")}</span>
            </div>
            <div class="project-animation2d-images">${s.image1 ? `
                <div class="project-animation2d-image" id="project-animation2d-image_1"><img src="${esc(s.image1)}" sizes="(min-width: 768px) 50vw, 100vw" alt="" loading="lazy"></div>` : ""}${s.image2 ? `
                <div class="project-animation2d-image" id="project-animation2d-image_2"><img src="${esc(s.image2)}" sizes="(min-width: 768px) 50vw, 100vw" alt="" loading="lazy"></div>` : ""}
            </div>
        </section>` : "",
    credits: (s) => (s.people || []).length ? `
        <section class="project-credits">
            <div class="credits-container reveal02">
                ${span("credits-header", s.header, "section-header")}
                <div id="participants-name">${s.people.map((x) => `<div class="credit-item"><span class="credit-name">${esc(x.name || "")}</span>${x.role ? `<span class="credit-role">${esc(x.role)}</span>` : ""}</div>`).join("")}</div>
            </div>
        </section>` : "",
    contact: (s) => `
        <section class="contact reveal03">
            <a href="/contact" id="contact-text">
                <span>Let's</span><br>
                <span>Talk</span>
            </a>
            <span class="section-header" id="contact-header">${esc(s.header || "/ GET IN TOUCH")}</span>
        </section>`,
    trailerBanner: (s) => `
        <section class="banner-container" id="tob-banner">
            <a href="${esc(s.link || "#")}" class="banner" target="_blank" rel="noopener noreferrer">
                <span id="banner-title">${fmt(s.title || "")}</span>
                <span class="banner-btn">
                    <span>WATCH NOW</span>
                    <img src="/assets/images/images-tob/vector.svg" alt="" class="icon-banner-btn">
                </span>
            </a>
        </section>
        <section class="tob-text-container" id="tob-text">
            <div class="tob-text">
                <span id="tob-text-1">${fmt(s.text1 || "")}</span>
                <span id="tob-text-2">${fmt(s.text2 || "")}</span>
                <span id="tob-text-3"><b>${fmt(s.text3 || "")}</b></span>
                <img src="/assets/icons/logo-raphy-white.svg" alt="Raphy Studios">
            </div>
        </section>`,
  };
  return list.map((s) => (B[s.type] ? B[s.type](s) : "")).join("\n");
}

function pageStyle(p) {
  const g = p.page || {};
  return {
    background: g.theme === "white" ? "white" : "black",
    logo: `/assets/icons/logo-raphy-${g.logo === "black" ? "black" : "white"}.svg`,
    menuIcon: `/assets/icons/${g.menuIcon === "dark" ? "menu-close" : "menu"}.svg`,
    ...(g.overflowVisible ? { overflowX: "visible" } : {}),
  };
}


/* ───────── otimização de imagens e vídeos ─────────
 * Imagens: o build cria versões menores (640/1280/1920 px, WebP) em dist/_img/ e coloca
 *          srcset nas <img>, para o celular e telas comuns não baixarem a imagem gigante.
 *          Também vale para imagens novas enviadas pelo painel (inclusive JPG/PNG).
 * Vídeos:  só carregam quando chegam perto da tela (js/media.js). Se existir "nome-m.mp4"
 *          ao lado do vídeo, o celular usa essa versão menor; "nome-poster.webp" vira a capa.
 */
let sharp = null;
try { sharp = (await import("sharp")).default; } catch { console.warn("! sharp não instalado — imagens sem versões menores (rode npm install)"); }
const IMG = new Map(); // "/assets/…/x.webp" → { w, set: [[url, largura], …] }
const WIDTHS = [640, 1280, 1920];
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

async function optimizeImages() {
  if (!sharp) return;
  const files = walk(join(DIST, "assets")).filter((f) => /\.(webp|jpe?g|png)$/i.test(f) && !/[\\/](icons|font[^\\/]*)[\\/]/.test(f));
  const one = async (f) => {
    const rel = relative(DIST, f).split("\\").join("/");
    const url = "/" + rel;
    const base = rel.slice(0, -extname(rel).length);
    const isWebp = /\.webp$/i.test(f);
    let w;
    try { w = (await sharp(f).metadata()).width; } catch { return; }
    const set = [];
    for (const W of WIDTHS) {
      if (W >= w * 0.9) break;
      const out = `_img/${base}-${W}.webp`;
      mkdirSync(dirname(join(DIST, out)), { recursive: true });
      await sharp(f).resize({ width: W }).webp({ quality: 78, effort: 5 }).toFile(join(DIST, out));
      set.push(["/" + out, W]);
    }
    if (isWebp) set.push([url, w]);
    else {
      const out = `_img/${base}.webp`;
      mkdirSync(dirname(join(DIST, out)), { recursive: true });
      await sharp(f).webp({ quality: 82, effort: 5 }).toFile(join(DIST, out));
      set.push(["/" + out, w]);
    }
    if (set.length > 1 || !isWebp) IMG.set(url, { w, set });
  };
  const queue = [...files];
  await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await one(queue.shift()); }));
}

const imgInfo = (src) => IMG.get(decodeURI(String(src).replace(/&amp;/g, "&").split("?")[0]));
const srcsetOf = (info) => info.set.map(([u, w]) => `${encodeURI(u)} ${w}w`).join(", ");
// fundos (CSS): telas comuns usam a versão de 1920px, telas retina a original
function bgImageSet(cssUrl) {
  const info = imgInfo(cssUrl);
  const v = info && info.set.find(([, w]) => w === 1920);
  return v ? `image-set(url("${encodeURI(v[0])}") 1x, url("${cssUrl}") 2x)` : null;
}

function optimizeHtml(html) {
  const mainAt = html.indexOf("<main");
  let imgCount = 0;
  html = html.replace(/<img\b[^>]*>/g, (tag, at) => {
    const src = (tag.match(/\ssrc="([^"]+)"/) || [])[1];
    const inMain = mainAt >= 0 && at > mainAt;
    if (inMain) imgCount++;
    let t = tag;
    const info = src && imgInfo(src);
    if (info) {
      t = t.replace(/\ssrc="/, ` srcset="${srcsetOf(info)}" src="`);
      if (!/\ssizes=/.test(t)) t = t.replace("<img", '<img sizes="100vw"');
    }
    if (src && !/\sdecoding=/.test(t)) t = t.replace("<img", '<img decoding="async"');
    // as 3 primeiras imagens do conteúdo carregam logo; o resto só perto da tela
    if (src && inMain && imgCount > 3 && !/\sloading=|data-eager/.test(t)) t = t.replace("<img", '<img loading="lazy"');
    return t;
  });
  html = html.replace(/<video\b([^>]*)>([\s\S]*?)<\/video>/g, (all, attrs, inner) => {
    const eager = /data-eager/.test(attrs);
    const src = (inner.match(/<source[^>]*\ssrc="([^"]+)"/) || [])[1];
    if (!src || !src.startsWith("/")) return all;
    const pub = (u) => existsSync(join(ROOT, "public", decodeURI(u)));
    const mob = src.replace(/\.mp4$/, "-m.mp4");
    const poster = src.replace(/\.mp4$/, "-poster.webp");
    const a = eager ? "src" : "data-src";
    const sources = pub(mob)
      ? `<source ${a}="${src}" type="video/mp4" media="(min-width: 768px)"><source ${a}="${mob}" type="video/mp4">`
      : `<source ${a}="${src}" type="video/mp4">`;
    let at = attrs.replace(/\s(autoplay|preload="[^"]*"|preload)(?=[\s>]|$)/g, "");
    const cover = (at.match(/\sdata-cover="([^"]*)"/) || [])[1];
    const coverInfo = cover && imgInfo(cover);
    const coverSmall = coverInfo && (coverInfo.set.find(([, w]) => w === 1280) || coverInfo.set[coverInfo.set.length - 1]);
    at = at.replace(/\sdata-cover="[^"]*"/, "");
    if (pub(poster) && !/\sposter=/.test(at)) at += ` ${eager ? "poster" : "data-poster"}="${poster}"`;
    else if (coverSmall) at += ` data-poster="${encodeURI(coverSmall[0])}"`;
    else if (cover) at += ` data-poster="${cover}"`;
    at += eager ? ' autoplay preload="auto"' : ' preload="none" data-lazy-video';
    return `<video${at}>${sources}</video>`;
  });
  // fundos em style="" (blocos do painel)
  html = html.replace(/background-image: url\(&quot;([^&]+)&quot;\);/g, (m, u) => {
    const set = bgImageSet(u);
    return set ? `${m} background-image: ${set.replace(/"/g, "&quot;")};` : m;
  });
  return html;
}

function optimizeCss() {
  for (const f of walk(join(DIST, "css")).filter((f) => f.endsWith(".css"))) {
    const css = readFileSync(f, "utf8");
    const out = css.replace(/background-image:\s*url\(["']?\.\.(\/assets\/[^"')]+)["']?\);/g, (m, u) => {
      const set = bgImageSet(u);
      return set ? `${m}\n    background-image: ${set};` : m;
    });
    if (out !== css) writeFileSync(f, out);
  }
}

/* ───────── gerar ───────── */
rmSync(DIST, { recursive: true, force: true });
cpSync(join(ROOT, "public"), DIST, { recursive: true });
await optimizeImages();
optimizeCss();

write("index.html", render("index", { title: "Raphy Studios - Home", description: SITE.description, image: SITE.image, path: "/" }, { homeProjects: homeProjects() }));
write("about/index.html", render("about", { title: "About - Raphy Studios", description: SITE.description, image: SITE.image, path: "/about" }));
write("projects/index.html", render("projects", { title: "Raphy Studios - Projects", description: "Selected animation projects by Raphy Studios: cinematics, short films, game trailers and more.", image: SITE.image, path: "/projects" }, { gridProjects: gridProjects(), projectCount: pad(projects.length), originalsCount: pad(projects.filter((p) => p.category === "originals").length), commercialCount: pad(projects.filter((p) => (p.category || "commercial") !== "originals").length) }));
write("contact/index.html", render("contact", { title: "Contact - Raphy Studios", description: "Get in touch with Raphy Studios — general enquiries, commercial proposals and joining the team.", image: SITE.image, path: "/contact" }));

const legacy = {};
for (const p of projects.filter(hasPage)) {
  const data = JSON.stringify({ pageStyle: pageStyle(p), name: stripTags(p.title) }).replace(/</g, "\\u003c");
  const name = stripTags(p.title);
  write(
    `projects/${p.slug}/index.html`,
    render("project", {
      title: `${name} - Raphy Studios`,
      description: p.seoDescription || stripTags(p.page?.description?.text || "") || SITE.description,
      image: p.grid?.cover || SITE.image,
      path: `/projects/${p.slug}`,
    }, { projectData: data, sections: renderSections(p) })
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
