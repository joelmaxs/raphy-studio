// Filtro All / Originals / Commercial da página Projects
(function () {
    var nav = document.querySelector(".pf");
    var grid = document.querySelector("section.projects");
    if (!nav || !grid) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll(".project"));
    var cur = "all";

    function build(list) {
        grid.innerHTML = "";
        var i = 0, k = 0, P = [2, 1, 3];
        while (i < list.length) {
            var n = Math.min(P[k % 3], list.length - i);
            var d = document.createElement("div");
            d.className = n === 1 ? "layout layout2" : n === 2 ? "layout layout-1" : "layout3";
            list.slice(i, i + n).forEach(function (x) { d.appendChild(x); });
            grid.appendChild(d);
            i += n; k++;
        }
    }

    nav.querySelectorAll(".pf-i").forEach(function (b) {
        b.addEventListener("click", function () {
            var f = b.getAttribute("data-filter");
            if (f === cur) return;
            cur = f;
            nav.querySelectorAll(".pf-i").forEach(function (x) {
                x.classList.toggle("is-on", x === b);
                x.setAttribute("aria-pressed", x === b ? "true" : "false");
            });
            grid.classList.add("pf-out");
            setTimeout(function () {
                build(items.filter(function (x) { return f === "all" || x.getAttribute("data-category") === f; }));
                grid.classList.remove("pf-out");
            }, 350);
        });
    });
})();
