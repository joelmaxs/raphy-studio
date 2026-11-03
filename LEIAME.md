# Raphy Studios — site

## Estrutura
```
content/projects/   ← um arquivo por projeto (o painel edita aqui)
src/pages/          ← HTML das páginas (home, about, projects, contact, project = modelo dos projetos)
src/partials/       ← header, footer e loader (usados em todas as páginas)
public/css/         ← estilos (um arquivo por página + global/header/footer)
public/js/          ← scripts
public/assets/      ← imagens (WebP), vídeos, ícones, fontes · uploads/ recebe o que for enviado pelo painel
build.mjs           ← gera o site final em dist/ (não precisa instalar nada)
.pages.yml          ← configuração do painel (Pages CMS)
```

## Endereços
- Home `/` · About `/about` · Projects `/projects` · Contact `/contact`
- Cada projeto com página: `/projects/<endereço>` (ex.: `/projects/rush`)
- Links antigos (`/pages/...` e `project-layout.html?data=...`) redirecionam sozinhos.

## Publicar (Cloudflare Pages + GitHub)
1. Suba esta pasta num repositório do GitHub (pode ser privado). Inclua o `.pages.yml`.
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git → escolha o repositório.
3. Framework preset: **None** · Build command: **`node build.mjs`** · Build output directory: **`dist`**.
4. Save and Deploy. Toda alteração no GitHub (ou no painel) publica sozinha em 1–2 min.

## Painel de projetos (Pages CMS)
1. https://app.pagescms.org → entrar com o GitHub → dar acesso ao repositório.
2. Em **Settings → Collaborators**, convide o e-mail de quem vai editar (não precisa de conta no GitHub).

### Adicionar um projeto
- **Projetos → +** → preencha:
  - *Endereço da página* (ex.: `novo-projeto`), *Nome*, *Ordem*, *Categoria*.
  - *Ao clicar*: **página do projeto** (usa o modelo) ou **link externo** (Behance/YouTube).
  - *Card na página Projects*: capa, vídeo curto e enquadramento.
  - *Destaque na Home*: marque "Mostrar na Home" para ele aparecer lá.
  - *Página do projeto*: preencha só as seções que quiser — as vazias não aparecem.
- Negrito: escreva `<b>texto</b>`. Quebra de linha: Enter.
- Salve. Em 1–2 minutos o site está atualizado.

### Dicas de imagens e vídeos
- Imagens: prefira **WebP** ou JPG até ~2800 px de largura (ex.: exportar do Figma em WebP 80–85%).
- Vídeos dos cards: mp4 curto (2–5 s), **sem áudio**, até ~2560 px, idealmente até 5 MB.

## Rodar localmente (opcional)
```
node build.mjs
npx serve dist      (ou qualquer servidor estático apontando para dist/)
```
