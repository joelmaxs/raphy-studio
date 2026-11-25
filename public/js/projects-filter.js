// Filtro All / Originals / Commercial da página Projects
(function () {
      var root = document, self = { _t: [], rpOn: function (el, ev, fn) { el.addEventListener(ev, fn); } };
      var nav = root.querySelector('.pf'), grid = root.querySelector('section.projects');
      if (!nav || !grid) return;
      var items = Array.prototype.slice.call(grid.querySelectorAll('.project'));
      // linhas como vieram do painel, para voltar a elas no "All"
      var rows = Array.prototype.slice.call(grid.children).map(function (d) { return { cls: d.className, list: Array.prototype.slice.call(d.querySelectorAll('.project')) }; });
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      var pick = function (f) { return items.filter(function (x) { return f === 'all' || x.getAttribute('data-category') === f; }); };
      nav.querySelectorAll('.pf-i').forEach(function (b) { var c = b.querySelector('.pf-n'); if (c) c.textContent = pad(pick(b.getAttribute('data-filter')).length); });
      var build = function (list, f) {
        grid.innerHTML = '';
        if (f === 'all') {
          rows.forEach(function (r) { var d = document.createElement('div'); d.className = r.cls; r.list.forEach(function (x) { d.appendChild(x); }); grid.appendChild(d); });
          return;
        }
        var i = 0, k = 0, P = [2, 1, 3];
        while (i < list.length) {
          var n = Math.min(P[k % 3], list.length - i), d = document.createElement('div');
          d.className = n === 1 ? 'layout layout2' : n === 2 ? 'layout layout-1' : 'layout3';
          list.slice(i, i + n).forEach(function (x) { d.appendChild(x); });
          grid.appendChild(d); i += n; k++;
        }
      };
      var cur = 'all', busy = false, T = function (fn, ms) { self._t.push(setTimeout(fn, ms)); };
      nav.querySelectorAll('.pf-i').forEach(function (b) {
        self.rpOn(b, 'click', function () {
          var f = b.getAttribute('data-filter');
          if (f === cur || busy) return;
          busy = true; cur = f;
          nav.querySelectorAll('.pf-i').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          var out = Array.prototype.slice.call(grid.querySelectorAll('.project')), h0 = grid.offsetHeight;
          grid.style.height = h0 + 'px'; grid.classList.add('pf-anim');
          // saída: os cards sobem e somem, um depois do outro
          out.forEach(function (x, i) { x.style.transitionDelay = (i * 45) + 'ms'; x.classList.add('pf-leave'); });
          T(function () {
            var list = pick(f);
            items.forEach(function (x) { x.style.transition = 'none'; x.style.transitionDelay = '0ms'; x.classList.remove('pf-leave'); x.classList.add('pf-enter'); });
            build(list, f);
            grid.style.height = 'auto'; var h1 = grid.offsetHeight;
            grid.style.height = h0 + 'px'; void grid.offsetHeight; grid.style.height = h1 + 'px';
            // entrada: os novos cards sobem de baixo, em sequência
            requestAnimationFrame(function () { requestAnimationFrame(function () {
              list.forEach(function (x, i) { x.style.transition = ''; x.style.transitionDelay = (i * 90) + 'ms'; x.classList.remove('pf-enter'); });
            }); });
            T(function () { grid.style.height = ''; grid.classList.remove('pf-anim'); list.forEach(function (x) { x.style.transitionDelay = ''; }); busy = false; }, 1000 + list.length * 90);
          }, 380 + out.length * 45);
        });
      });
    })();

