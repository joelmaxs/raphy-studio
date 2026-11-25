// As seções da página de projeto já vêm prontas do build (blocos do painel, na ordem escolhida).
// Aqui ficam só os comportamentos: cores da página, vídeo, galeria, sliders e processo.
function buildProjectPage(project) {
    setupPageStyle(project);
    document.querySelectorAll(".video-wrapper[data-yt]").forEach(setupVideo);
    document.querySelectorAll(".synopsis-gallery").forEach(setupGalleryModal);
    document.querySelectorAll(".project-slider").forEach(section => setupSliderBehavior(section));
    document.querySelectorAll("section.process[data-steps]").forEach(setupProcess);
}

function hideSection(el) {
    if (el) el.style.display = "none";
}

function setupPageStyle(project) {
    const pageStyle = project.pageStyle;

    if (!pageStyle) return;

    const body = document.body;

    if (pageStyle.background) {
        if (pageStyle.background === "white") {
            body.style.background = "var(--white)";
        } else if (pageStyle.background === "black") {
            body.style.background = "var(--black)";
        }
    }

    const logo = document.querySelector(".logo");

    if (logo && pageStyle.logo) {
        logo.style.content = `url("${pageStyle.logo}")`;
    }

    const menuIcon = document.querySelector("#menu-open-icon");

    if (menuIcon && pageStyle.menuIcon) {
        menuIcon.style.content = `url("${pageStyle.menuIcon}")`;
    }

    if (pageStyle.overflowX) {
        body.style.overflowX = pageStyle.overflowX;
    }
}

let youtubePlayer = null;

function setupVideo(wrapper) {
    const iframe = wrapper.querySelector("iframe");

    if (!iframe) return;

    const isMobile = window.innerWidth <= 768;
    const videoId = isMobile && wrapper.dataset.ytMobile
        ? wrapper.dataset.ytMobile
        : wrapper.dataset.yt;

    iframe.src =
        `https://www.youtube.com/embed/${videoId}` +
        `?enablejsapi=1&autoplay=0&mute=1&controls=1&playsinline=1`;

    iframe.addEventListener("load", () => {
        if (!window.YT || !YT.Player) return;

        const player = new YT.Player(iframe, {
            events: {
                onReady: () => {
                    new IntersectionObserver(entries => {
                        entries.forEach(entry => {
                            if (entry.intersectionRatio >= 0.7) player.playVideo();
                            else player.pauseVideo();
                        });
                    }, { threshold: [0, 0.7] }).observe(iframe);
                }
            }
        });

        youtubePlayer = youtubePlayer || player;
    }, { once: true });
}

function setupGalleryModal(gallery) {
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");

    if (!modal || !modalImg) return;

    gallery.addEventListener("click", e => {
        if (window.innerWidth < 1366) return;
        if (!e.target.classList.contains("gallery-img")) return;

        modalImg.src = e.target.src;
        modal.style.display = "flex";
    });

    if (!modal.dataset.bound) {
        modal.dataset.bound = "1";
        modal.addEventListener("click", () => {
            modal.style.display = "none";
            modalImg.src = "";
        });
    }
}

function setupProcess(section) {
    let steps = [];

    try {
        steps = JSON.parse(section.dataset.steps || "[]");
    } catch (e) {
        steps = [];
    }

    if (!steps.length) {
        hideSection(section);
        return;
    }

    const imgEl = section.querySelector("#process-img");
    const titleEl = section.querySelector("#process-title");
    const textEl = section.querySelector("#process-text");

    if (!imgEl || !titleEl || !textEl) {
        return;
    }

    const INTRO_VH = 60;
    const OUTRO_VH = 60;

    section.style.height =
        `${INTRO_VH + steps.length * 60 + OUTRO_VH}vh`;

    imgEl.src = steps[0].image || "";
    imgEl.alt = steps[0].title || "";

    let currentStep = -1;
    let outroActive = false;

    function trocarPasso(index) {
        if (index === currentStep) {
            return;
        }

        const step = steps[index];

        if (!step) {
            return;
        }

        currentStep = index;

        imgEl.classList.add("fade");

        setTimeout(() => {
            const tempImg = new Image();

            tempImg.src = step.image || "";

            tempImg.onload = () => {
                imgEl.src = step.image;
                imgEl.alt = step.title || "";

                titleEl.textContent = step.title || "";
                textEl.textContent = step.text || "";

                imgEl.classList.remove("fade");

                titleEl.classList.remove("ativo");
                textEl.classList.remove("ativo");

                requestAnimationFrame(() => {
                    titleEl.classList.add("ativo");
                    textEl.classList.add("ativo");
                });
            };

            tempImg.onerror = () => {
                imgEl.src = step.image || "";
                imgEl.alt = step.title || "";

                titleEl.textContent = step.title || "";
                textEl.textContent = step.text || "";

                imgEl.classList.remove("fade");

                titleEl.classList.add("ativo");
                textEl.classList.add("ativo");
            };
        }, 50);
    }

    function onScroll() {
        const rect = section.getBoundingClientRect();
        const scrollY = -rect.top;
        const totalHeight = rect.height - window.innerHeight;

        if (
            rect.top > 0 ||
            rect.bottom < window.innerHeight
        ) {
            return;
        }

        const introHeight =
            (INTRO_VH / 100) * window.innerHeight;

        const outroHeight =
            (OUTRO_VH / 100) * window.innerHeight;

        const stepsHeight =
            totalHeight -
            introHeight -
            outroHeight;

        const outroStart =
            introHeight + stepsHeight;

        if (scrollY < introHeight) {
            const introProgress = Math.min(
                Math.max(scrollY / introHeight, 0),
                1
            );

            imgEl.classList.remove("escalada");

            imgEl.style.transform =
                `scale(${0.8 + introProgress * 0.2})`;

            titleEl.classList.remove("ativo");
            textEl.classList.remove("ativo");

            outroActive = false;
            currentStep = -1;

            return;
        }

        if (scrollY >= outroStart) {
            imgEl.classList.remove("escalada");

            if (!outroActive) {
                titleEl.classList.remove("ativo");
                textEl.classList.remove("ativo");

                outroActive = true;
                currentStep = -1;
            }

            const outroProgress = Math.min(
                Math.max(
                    (scrollY - outroStart) / outroHeight,
                    0
                ),
                1
            );

            imgEl.style.transform =
                `scale(${1 - outroProgress * 0.2})`;

            return;
        }

        imgEl.style.transform = "";
        imgEl.classList.add("escalada");

        outroActive = false;

        const remainingScroll =
            scrollY - introHeight;

        const progress = Math.min(
            Math.max(
                remainingScroll / stepsHeight,
                0
            ),
            0.999
        );

        const index = Math.floor(
            progress * steps.length
        );

        trocarPasso(index);
    }

    window.addEventListener(
        "scroll",
        onScroll,
        { passive: true }
    );

    onScroll();
}

