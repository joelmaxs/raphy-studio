// Vídeos leves: cada vídeo só baixa quando chega perto da tela (e se estiver visível —
// os vídeos dos cards ficam escondidos no celular e não baixam lá) e pausa quando sai dela.
(function () {
    var videos = Array.prototype.slice.call(document.querySelectorAll("video[data-lazy-video]"));

    if (!videos.length) return;

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function load(video) {
        if (video.dataset.loaded) return;

        video.dataset.loaded = "1";

        if (video.dataset.poster) video.poster = video.dataset.poster;

        video.querySelectorAll("source[data-src]").forEach(function (source) {
            source.src = source.dataset.src;
        });

        video.preload = reduceMotion ? "metadata" : "auto";
        video.load();
    }

    function play(video) {
        if (reduceMotion) return;

        var promise = video.play();

        if (promise && promise.catch) promise.catch(function () {});
    }

    if (!("IntersectionObserver" in window)) {
        videos.forEach(function (video) { load(video); play(video); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            var video = entry.target;

            if (entry.isIntersecting) {
                if (!video.offsetWidth && !video.offsetHeight) return;

                load(video);
                play(video);
            } else if (video.dataset.loaded) {
                video.pause();
            }
        });
    }, { rootMargin: "400px 0px" });

    videos.forEach(function (video) { observer.observe(video); });
})();
