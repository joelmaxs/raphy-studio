const logos = document.querySelectorAll(".logos-aleatorias img");

if (logos.length > 0) {
    let ultimaLogo = Number(localStorage.getItem("ultimaLogo"));
    let sorteio;

    do {
        sorteio = Math.floor(Math.random() * logos.length);
    } while (sorteio === ultimaLogo);

    logos[sorteio].style.display = "block";
    localStorage.setItem("ultimaLogo", sorteio);
}

document.addEventListener("DOMContentLoaded", () => {
    const mainImage = document.querySelector(".main-image");

    if (mainImage) {
        const classes = [
            "about1",
            "about2",
            "about3",
            "about4"
        ];

        let ultimaImagem = Number(
            localStorage.getItem("ultimaImagem")
        );

        let sorteio;

        do {
            sorteio = Math.floor(Math.random() * classes.length);
        } while (sorteio === ultimaImagem);

        mainImage.classList.add(classes[sorteio]);
        localStorage.setItem("ultimaImagem", sorteio);
    }
});

function setupGallery(images) {
    const gallery = document.querySelector(".synopsis-gallery");
    const modal = document.getElementById("image-modal");
    const modalImg = document.getElementById("modal-img");

    if (!gallery || !modal || !modalImg) {
        return;
    }

    gallery.innerHTML = "";

    if (!images || !images.length) {
        gallery.style.display = "none";
        return;
    }

    images.forEach(image => {
        const img = document.createElement("img");

        img.src = image;
        img.classList.add("gallery-img");
        img.alt = "Imagem do projeto";
        img.loading = "lazy";

        gallery.appendChild(img);
    });

    gallery.addEventListener("click", function (e) {
        if (window.innerWidth < 1366) {
            return;
        }

        if (!e.target.classList.contains("gallery-img")) {
            return;
        }

        modalImg.src = e.target.src;
        modal.style.display = "flex";
    });

    modal.addEventListener("click", function () {
        modal.style.display = "none";
        modalImg.src = "";
    });
}

function setupSliderBehavior(sliderSection) {
    const container = sliderSection.querySelector(
        ".project-slider-container"
    );

    const track = sliderSection.querySelector(
        ".project-slider-track"
    );

    if (!container || !track) {
        console.error("Estrutura do slider incompleta.");
        return;
    }

    const originalSlides = Array.from(
        track.querySelectorAll(".project-slide:not(.is-clone)")
    );

    const slideCount = originalSlides.length;

    if (slideCount === 0) {
        return;
    }

    if (slideCount === 1) {
        track.style.transform = "translateX(0)";
        return;
    }

    const fragmentBefore = document.createDocumentFragment();
    const fragmentAfter = document.createDocumentFragment();

    originalSlides.forEach(slide => {
        const cloneBefore = slide.cloneNode(true);
        cloneBefore.classList.add("is-clone");

        fragmentBefore.appendChild(cloneBefore);

        const cloneAfter = slide.cloneNode(true);
        cloneAfter.classList.add("is-clone");

        fragmentAfter.appendChild(cloneAfter);
    });

    track.insertBefore(fragmentBefore, track.firstChild);
    track.appendChild(fragmentAfter);

    let slideWidth = 0;
    let currentIndex = slideCount;
    let currentTranslate = 0;
    let prevTranslate = 0;

    let isDragging = false;
    let startX = 0;

    let autoplayTimer = null;
    let isTransitioning = false;

    const AUTOPLAY_DELAY = 3500;

    function getSlideWidth() {
        const slide = track.querySelector(".project-slide");

        if (!slide) {
            return 0;
        }

        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.gap) || 0;

        return slide.getBoundingClientRect().width + gap;
    }

    function setPositionByIndex(animate = true) {
        slideWidth = getSlideWidth();

        if (!slideWidth) {
            return;
        }

        currentTranslate = -currentIndex * slideWidth;

        track.style.transition = animate
            ? "transform 0.5s ease"
            : "none";

        track.style.transform =
            `translate3d(${currentTranslate}px, 0, 0)`;

        prevTranslate = currentTranslate;
        isTransitioning = animate;
    }

    function checkLoopReset() {
        isTransitioning = false;

        if (currentIndex >= slideCount * 2) {
            currentIndex -= slideCount;
            setPositionByIndex(false);
            return;
        }

        if (currentIndex < slideCount) {
            currentIndex += slideCount;
            setPositionByIndex(false);
        }
    }

    function goToNext() {
        if (isDragging || isTransitioning) {
            return;
        }

        currentIndex++;
        setPositionByIndex(true);
    }

    function startAutoplay() {
        stopAutoplay();

        autoplayTimer = setInterval(
            goToNext,
            AUTOPLAY_DELAY
        );
    }

    function stopAutoplay() {
        if (autoplayTimer !== null) {
            clearInterval(autoplayTimer);
            autoplayTimer = null;
        }
    }

    function getPositionX(e) {
        return e.clientX;
    }

    function dragStart(e) {
        if (
            e.pointerType === "mouse" &&
            e.button !== 0
        ) {
            return;
        }

        isDragging = true;
        startX = getPositionX(e);

        stopAutoplay();

        track.style.transition = "none";
        container.classList.add("dragging");

        container.setPointerCapture?.(e.pointerId);
    }

    function dragMove(e) {
        if (!isDragging) {
            return;
        }

        const currentX = getPositionX(e);
        const diff = currentX - startX;

        currentTranslate = prevTranslate + diff;

        track.style.transform =
            `translate3d(${currentTranslate}px, 0, 0)`;
    }

    function dragEnd(e) {
        if (!isDragging) {
            return;
        }

        isDragging = false;

        container.classList.remove("dragging");

        container.releasePointerCapture?.(e.pointerId);

        const movedBy = currentTranslate - prevTranslate;

        slideWidth = getSlideWidth();

        const threshold = slideWidth * 0.15;

        if (movedBy < -threshold) {
            currentIndex++;
        } else if (movedBy > threshold) {
            currentIndex--;
        }

        setPositionByIndex(true);
        startAutoplay();
    }

    function handleResize() {
        setPositionByIndex(false);
    }

    container.addEventListener(
        "pointerdown",
        dragStart
    );

    container.addEventListener(
        "pointermove",
        dragMove
    );

    container.addEventListener(
        "pointerup",
        dragEnd
    );

    container.addEventListener(
        "pointercancel",
        dragEnd
    );

    track.addEventListener(
        "transitionend",
        checkLoopReset
    );

    window.addEventListener(
        "resize",
        handleResize
    );

    sliderSection._sliderInstance = {
        container,
        track,
        stopAutoplay,
        dragStart,
        dragMove,
        dragEnd,
        checkLoopReset,
        handleResize
    };

    sliderSection.dataset.sliderInitialized = "true";

    setPositionByIndex(false);
    startAutoplay();
}