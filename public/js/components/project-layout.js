function buildProjectPage(project) {
    setupPageStyle(project);
    setupTitle(project);
    setupHero(project);
    setupVideo(project.video);
    setupDescription(project);
    setupGallery(project.gallery);
    setupSliders(project);
    setupConcept(project);
    setupFullscreenImages(project);
    setupProcess(project);
    setupAnimation2d(project);
    setupCredits(project);
    setupContact(project);
    setupTob(project);
}

function setText(selector, value) {
    const el = document.querySelector(selector);

    if (!el) return;

    if (value) {
        el.innerHTML = formatText(value);
    } else {
        el.style.display = "none";
    }
}

function formatText(text) {
    if (!text) return "";

    return text.replace(/\n/g, "<br>");
}

function hideSection(selectorOrEl) {
    const el =
        typeof selectorOrEl === "string"
            ? document.querySelector(selectorOrEl)
            : selectorOrEl;

    if (el) el.style.display = "none";
}

function setBackgroundImage(el, src) {
    if (!el) return;

    if (src) {
        el.style.backgroundImage = `url("${src}")`;
    }
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

function setupTitle(project) {
    const section = document.querySelector(".project-title");

    if (!section) return;

    if (!project.title && !project.number) {
        hideSection(section);
        return;
    }

    setText("#project-title_text", project.title);
    setText("#project-title_num", project.number);
}

function setupHero(project) {
    const section = document.querySelector(".hero-container");

    if (!section) return;

    const hero = project.hero;

    if (!hero) {
        hideSection(section);
        return;
    }

    const text = document.querySelector("#hero-text");
    const logo = document.querySelector("#hero-img");

    const button1 = document.querySelector("#hero-btn1");
    const button1Text = document.querySelector("#hero-btn1-text");

    const button2 = document.querySelector("#hero-btn2");
    const button2Text = document.querySelector("#hero-btn2-text");
    const button2Icon = document.querySelector("#hero-btn2-icon");

    if (text) {
        text.innerHTML = formatText(hero.text || "");
    }

    if (logo && hero.logo) {
        logo.src = hero.logo;
    } else if (logo) {
        hideSection(logo);
    }

    if (hero.button1) {
        if (button1) {
            button1.href = hero.button1.href || "#";
        }

        if (button1Text) {
            button1Text.textContent = hero.button1.text || "";
        }
    } else {
        hideSection(button1);
    }

    if (hero.button2) {
        if (button2) {
            button2.href = hero.button2.href || "#";
        }

        if (button2Text) {
            button2Text.textContent = hero.button2.text || "";
        }

        if (button2Icon && hero.button2.icon) {
            button2Icon.src = hero.button2.icon;
        } else if (button2Icon) {
            hideSection(button2Icon);
        }
    } else {
        hideSection(button2);
    }
}

let youtubePlayer = null;
let videoObserver = null;

function setupVideo(video) {
    const iframe = document.querySelector("#project-video");
    const wrapper = document.querySelector(".video-wrapper");

    if (!iframe || !wrapper) {
        console.warn("Elemento do vídeo não encontrado.");
        return;
    }

    if (!video || !video.youtubeId) {
        hideSection(wrapper);
        return;
    }

    const isMobile = window.innerWidth <= 768;

    const videoId =
        isMobile && video.youtubeShortsId
            ? video.youtubeShortsId
            : video.youtubeId;

    iframe.src =
        `https://www.youtube.com/embed/${videoId}` +
        `?enablejsapi=1` +
        `&autoplay=0` +
        `&mute=1` +
        `&controls=1` +
        `&playsinline=1`;

    iframe.addEventListener(
        "load",
        () => {
            if (!window.YT || !YT.Player) {
                console.warn("YouTube API ainda não carregou.");
                return;
            }

            youtubePlayer = new YT.Player(iframe, {
                events: {
                    onReady: () => {
                        setupVideoObserver(iframe);
                    }
                }
            });
        },
        { once: true }
    );
}

function setupVideoObserver(iframe) {
    if (videoObserver) {
        videoObserver.disconnect();
    }

    videoObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (!youtubePlayer) return;

                if (entry.intersectionRatio >= 0.7) {
                    youtubePlayer.playVideo();
                } else {
                    youtubePlayer.pauseVideo();
                }
            });
        },
        {
            threshold: [0, 0.7]
        }
    );

    videoObserver.observe(iframe);
}

function setupDescription(project) {
    const section = document.querySelector(".project-description");

    if (!project.description && !project.info) {
        hideSection(section);
        return;
    }

    setText("#project-description-header-text", project.description);
    setText("#section-header-description", project["description-header"]);

    const info = project.info || {};

    setText("#project-description_1", info.description_1);
    setText("#project-description_2_1", info.description_2_1);
    setText("#project-description_2_2", info.description_2_2);
    setText("#project-description_3", info.description_3);
    setText("#project-description_4", info.description_4);
}

// setupGallery(): definida em js/main.js (galeria + modal de imagem).

function setupSliders(project) {
    const sliderSections = document.querySelectorAll(".project-slider");

    if (!sliderSections.length) {
        return;
    }

    sliderSections.forEach(section => {
        const sliderKey = section.dataset.slider;

        if (!sliderKey) {
            return;
        }

        const data = project[sliderKey];

        if (!data || !Array.isArray(data)) {
            hideSection(section);
            return;
        }

        const descriptionObj = data.find(item =>
            Object.prototype.hasOwnProperty.call(item, "slide-description")
        );

        const titleObj = data.find(item =>
            Object.prototype.hasOwnProperty.call(item, "slide-title")
        );

        const imgsObj = data.find(item =>
            Object.prototype.hasOwnProperty.call(item, "slide-imgs")
        );

        const description =
            descriptionObj?.["slide-description"] || "";

        const title = titleObj?.["slide-title"] || "";
        const imgs = imgsObj?.["slide-imgs"] || [];

        if (!imgs.length) {
            hideSection(section);
            return;
        }

        const descriptionElement = section.querySelector(
            ".project-slider-texts_description"
        );

        const titleElement = section.querySelector(".section-header");
        const track = section.querySelector(".project-slider-track");

        if (descriptionElement) {
            descriptionElement.innerHTML = formatText(description);
        }

        if (titleElement) {
            titleElement.textContent = title;
        }

        if (!track) {
            console.error("project-slider-track não encontrado.");
            return;
        }

        track.innerHTML = "";

        imgs.forEach((src, index) => {
            const slide = document.createElement("div");

            slide.className = "project-slide";
            slide.dataset.slide = index + 1;

            const img = document.createElement("img");

            img.src = src;
            img.alt = title;
            img.draggable = false;

            slide.appendChild(img);
            track.appendChild(slide);
        });

        setupSliderBehavior(section);
    });
}

function setupFullscreenImages(project) {
    const fullscreenDivs = document.querySelectorAll(
        ".project-image-fullscream"
    );

    const imgs = [
        project["image-full1"],
        project["image-full2"]
    ];

    fullscreenDivs.forEach((div, i) => {
        if (imgs[i]) {
            setBackgroundImage(div, imgs[i]);
        } else {
            hideSection(div);
        }
    });
}

function setupProcess(project) {
    const section = document.getElementById("process");

    if (!section) {
        return;
    }

    const process = project.process;

    if (
        !process ||
        !Array.isArray(process.steps) ||
        !process.steps.length
    ) {
        hideSection(section);
        return;
    }

    const steps = process.steps;

    const imgEl = document.getElementById("process-img");
    const titleEl = document.getElementById("process-title");
    const textEl = document.getElementById("process-text");

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

function setupConcept(project) {
    const section = document.querySelector(".concept");

    if (!section) return;

    const concept = project.concept;

    if (!concept) {
        hideSection(section);
        return;
    }

    const header = document.querySelector("#concept-header");

    if (header) {
        header.textContent = concept.header || "";
    }

    setText("#concept-text-1", concept.text1);
    setText("#concept-text-2", concept.text2);

    setupConceptImage(
        concept.image1,
        "#concept-img-1",
        "#concept-img-1-label",
        "#concept-img-1-credit"
    );

    setupConceptImage(
        concept.image2,
        "#concept-img-2",
        "#concept-img-2-label",
        "#concept-img-2-credit"
    );
}

function setupConceptImage(
    data,
    containerSelector,
    labelSelector,
    creditSelector
) {
    const container = document.querySelector(containerSelector);

    if (!container) return;

    if (!data || !data.src) {
        hideSection(container);
        return;
    }

    container.style.backgroundImage =
        `url("${data.src}")`;

    const label = document.querySelector(labelSelector);

    if (label) {
        label.textContent = data.label || "";
    }

    const credit = document.querySelector(creditSelector);

    if (credit) {
        credit.textContent = data.credit || "";
    }
}

function setupAnimation2d(project) {
    const section = document.querySelector(".project-animation2d");

    if (!section) return;

    if (
        !project["animation2d-img1"] &&
        !project["animation2d-img2"]
    ) {
        hideSection(section);
        return;
    }

    const descriptionEl = section.querySelector(
        ".project-animation2d-texts_description"
    );

    const headerEl = section.querySelector(
        ".project-animation2d-texts .section-header"
    );

    if (descriptionEl) {
        descriptionEl.innerHTML = formatText(
            project["animation2d-description"] || ""
        );
    }

    if (headerEl) {
        headerEl.textContent =
            project["animation2d-header"] || "";
    }

    const container1 = document.querySelector(
        "#project-animation2d-image_1"
    );

    const img1 = container1?.querySelector("img");

    if (img1 && project["animation2d-img1"]) {
        img1.src = project["animation2d-img1"];
    } else {
        hideSection(container1);
    }

    const container2 = document.querySelector(
        "#project-animation2d-image_2"
    );

    const img2 = container2?.querySelector("img");

    if (img2 && project["animation2d-img2"]) {
        img2.src = project["animation2d-img2"];
    } else {
        hideSection(container2);
    }
}

function setupCredits(project) {
    const section = document.querySelector(".project-credits");

    if (!section) return;

    if (
        !project.credits ||
        !Array.isArray(project.credits) ||
        !project.credits.length
    ) {
        hideSection(section);
        return;
    }

    setText("#credits-header", project["credits-header"]);

    const container = document.querySelector("#participants-name");

    if (!container) return;

    container.innerHTML = "";

    project.credits.forEach(person => {
        const item = document.createElement("div");
        item.classList.add("credit-item");

        const name = document.createElement("span");
        name.classList.add("credit-name");
        name.textContent = person.name || "";

        item.appendChild(name);

        if (person.role) {
            const roleElement = document.createElement("span");

            roleElement.classList.add("credit-role");

            roleElement.textContent = Array.isArray(person.role)
                ? person.role.join(", ")
                : person.role;

            item.appendChild(roleElement);
        }

        container.appendChild(item);
    });
}

function setupContact(project) {
    const section = document.querySelector(".contact");

    if (!section) return;

    if (!project.contact) {
        hideSection(section);
        return;
    }

    section.style.display = "";

    const contact = project.contact;

    if (typeof contact === "object") {
        const contactText =
            document.querySelector("#contact-text");

        const contactHeader =
            document.querySelector("#contact-header");

        if (contactText && contact.text) {
            contactText.innerHTML = formatText(contact.text);
        }

        if (contactHeader && contact.header) {
            contactHeader.textContent = contact.header;
        }
    }
}

function setupTob(project) {
    const bannerSection = document.querySelector("#tob-banner");
    const textSection = document.querySelector("#tob-text");

    if (!bannerSection && !textSection) {
        return;
    }

    if (!project.tob) {
        if (bannerSection) {
            hideSection(bannerSection);
        }

        if (textSection) {
            hideSection(textSection);
        }

        return;
    }

    const tob = project.tob;

    if (bannerSection) {
        bannerSection.innerHTML = `
            <a
                href="${tob.link || "https://www.youtube.com/watch?v=5r5KbFUPCEo"}"
                class="banner"
                target="_blank"
                rel="noopener noreferrer"
            >
                <span id="banner-title"></span>

                <span class="banner-btn">
                    <span>WATCH NOW</span>

                    <img
                        src="/assets/images/images-tob/vector.svg"
                        alt="Icon"
                        class="icon-banner-btn"
                    >
                </span>
            </a>
        `;

        const bannerTitle =
            bannerSection.querySelector("#banner-title");

        if (bannerTitle) {
            bannerTitle.innerHTML = formatText(
                tob.title || "TEARS OF BLOOD\nFIRST TRAILER"
            );
        }

        bannerSection.style.display = "";
    }

    if (textSection) {
        textSection.innerHTML = `
            <div class="tob-text">
                <span id="tob-text-1"></span>
                <span id="tob-text-2"></span>
                <span id="tob-text-3">
                    <b></b>
                </span>

                <img
                    src="/assets/icons/logo-raphy-white.svg"
                    alt="Raphy Studios"
                >
            </div>
        `;

        const text1 =
            textSection.querySelector("#tob-text-1");

        const text2 =
            textSection.querySelector("#tob-text-2");

        const text3 =
            textSection.querySelector("#tob-text-3");

        if (text1) {
            text1.innerHTML = formatText(tob.text1 || "");
        }

        if (text2) {
            text2.innerHTML = formatText(tob.text2 || "");
        }

        if (text3) {
            const bold = text3.querySelector("b");

            if (bold) {
                bold.innerHTML = formatText(tob.text3 || "");
            } else {
                text3.innerHTML = formatText(tob.text3 || "");
            }
        }

        textSection.style.display = "";
    }
}