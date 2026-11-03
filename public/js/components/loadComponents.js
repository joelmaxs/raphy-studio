async function loadComponent(elementId, file) {
    const element = document.getElementById(elementId);

    if (!element) {
        return false;
    }

    // O build já coloca header/footer/loader dentro da página.
    if (element.children.length) {
        return true;
    }

    try {
        const response = await fetch(file);

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${file}`);
        }

        const data = await response.text();
        element.innerHTML = data;

        return true;
    } catch (error) {
        console.error(`Erro ao carregar ${file}:`, error);
        return false;
    }
}

function initNavbar() {
    const openBtn = document.getElementById("open-btn");
    const closeBtn = document.getElementById("close-btn");
    const menuPanel = document.getElementById("menu-panel");

    if (!openBtn || !closeBtn || !menuPanel) {
        return;
    }

    openBtn.addEventListener("click", () => {
        menuPanel.classList.remove("close");
        menuPanel.classList.add("active");
    });

    closeBtn.addEventListener("click", () => {
        menuPanel.classList.remove("active");
        menuPanel.classList.add("close");
    });
}

function setActiveMenuItem() {
    const currentPath = normalizePath(window.location.pathname);
    const menuLinks = document.querySelectorAll(".item-menu");

    menuLinks.forEach(link => {
        const linkPath = normalizePath(
            new URL(link.href, window.location.origin).pathname
        );

        link.classList.remove("active");

        if (linkPath === currentPath) {
            link.classList.add("active");
        }
    });
}

function normalizePath(path) {
    path = path.replace(/\/+$/, "");

    if (path === "") {
        return "/index.html";
    }

    if (!path.startsWith("/")) {
        path = "/" + path;
    }

    return path;
}

function loadProject() {
    // Os dados do projeto vêm embutidos na página pelo build (content/projects/*.json).
    const dataEl = document.getElementById("project-data");

    if (!dataEl) {
        return;
    }

    try {
        const project = JSON.parse(dataEl.textContent);

        buildProjectPage(project);
        document.body.classList.add("project-ready");
    } catch (error) {
        console.error("Erro ao montar o projeto:", error);
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    await loadComponent(
        "loader-container",
        "/components/loader.html"
    );

    await loadComponent(
        "header-container",
        "/components/header.html"
    );

    await loadComponent(
        "footer-container",
        "/components/footer.html"
    );

    initNavbar();
    setActiveMenuItem();
    loadProject();
    initLoader();
});