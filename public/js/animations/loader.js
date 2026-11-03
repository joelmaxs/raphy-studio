function initLoader() {

    const fill = document.getElementById("progress-fill");
    const text = document.getElementById("progress-text");
    const loader = document.getElementById("loader");

    if (!fill || !text || !loader) {
        console.error("LOADER - elementos não encontrados");
        return;
    }

    const imagens = Array.from(document.images).filter(img => {
        if (!img.src || !img.getAttribute("src")) {
            return false;
        }

        if (
            img.closest(".gallery") ||
            img.closest(".project-gallery") ||
            img.closest(".synopsis-gallery")
        ) {
            return false;
        }

        return true;
    });

    const urls = [...new Set(
        imagens.map(img => img.currentSrc || img.src)
    )];

    const totalRecursos = urls.length;

    if (totalRecursos === 0) {
        finalizarLoader();
        return;
    }

    let carregados = 0;
    const processados = new Set();

    function recursoCarregado(url) {
        if (processados.has(url)) {
            return;
        }

        processados.add(url);
        carregados++;

        const progress = Math.min(
            100,
            Math.floor((carregados / totalRecursos) * 100)
        );

        fill.style.width = progress + "%";
        text.innerText = `${progress}% `;

        if (carregados >= totalRecursos) {
            finalizarLoader();
        }
    }

    function finalizarLoader() {

        fill.style.width = "100%";
        text.innerText = "100%";

        loader.classList.add("sair");

        setTimeout(() => {
            loader.style.display = "none";
        }, 600);
    }

    urls.forEach(url => {
        const img = imagens.find(
            image => (image.currentSrc || image.src) === url
        );

        if (!img) {
            recursoCarregado(url);
            return;
        }

        if (img.complete) {
            recursoCarregado(url);
            return;
        }

        img.addEventListener(
            "load",
            () => recursoCarregado(url),
            { once: true }
        );

        img.addEventListener(
            "error",
            () => {
                console.warn("LOADER - erro:", url);
                recursoCarregado(url);
            },
            { once: true }
        );

        setTimeout(() => {
            if (!processados.has(url)) {
                console.warn("LOADER - timeout:", url);
                recursoCarregado(url);
            }
        }, 2000);
    });
}