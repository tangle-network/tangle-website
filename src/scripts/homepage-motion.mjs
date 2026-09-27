export function startMotion(reduced, flow) {
  if (reduced) {
    flow?.classList.add('static');
    document.querySelector('.sb-flow')?.classList.add('static');
  } else {
    document.documentElement.classList.add('js');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.14 },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    // Narrow-screen scroll motion: fade each stacked tile/stage up as it
    // enters. Used by the mobile branches below (the static stack that
    // replaces the desktop pinned story), so small screens still animate.
    const revealStacked = (root) => {
      const rio = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) { e.target.classList.add('srin'); rio.unobserve(e.target); }
          }
        },
        { threshold: 0.16, rootMargin: '0px 0px -8% 0px' },
      );
      root.querySelectorAll('.sb-tile, .istage').forEach((el) => rio.observe(el));
    };

    // Scroll-driven Sandbox chapter: tiles activate and traces draw with progress.
    const sb = document.querySelector('.sb-flow');
    if (sb && window.matchMedia('(min-width: 861px)').matches) {
      const tiles = [...sb.querySelectorAll('.sb-tile')];
      const lines = [...sb.querySelectorAll('.sb-line')];
      let ticking = false;
      const update = () => {
        ticking = false;
        const rect = sb.getBoundingClientRect();
        const total = sb.offsetHeight - window.innerHeight;
        const prog = Math.min(1, Math.max(0, -rect.top / total));
        tiles.forEach((t, i) => t.classList.toggle('on', prog > 0.06 + i * 0.055));
        lines.forEach((l, i) => {
          const lp = Math.min(1, Math.max(0, (prog - (0.12 + i * 0.055)) / 0.32));
          l.style.strokeDashoffset = String(1 - lp);
        });
        sb.classList.toggle('done', prog > 0.88);
      };
      const onScroll = () => {
        if (!ticking) { ticking = true; requestAnimationFrame(update); }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    } else if (sb) {
      sb.classList.add('static', 'reveal-on');
      revealStacked(sb);
    }

    // Scroll-driven Intelligence stages. Narrow screens get the static stack.
    //
    // CHOREO is the one place to tune the ship-stage deal-out. Per card:
    //   at    when the card lands, as a fraction of stage-2 scroll (0..1)
    //   tilt  resting rotation in degrees
    //   from  entry offset: y px, rotation deg, scale
    // Stage 2 begins at STAGE2_START of total flow scroll and the deal-out
    // uses the remainder. Edit numbers, reload, judge. Nothing else moves.
    const STAGE2_START = 0.54;
    const CHOREO = [
      { at: 0.05, tilt: -3.2, from: { y: 130, rot: -10, scale: 1.06 } },
      { at: 0.3, tilt: 2.6, from: { y: 150, rot: 9, scale: 1.06 } },
      { at: 0.55, tilt: -1.8, from: { y: 150, rot: -8, scale: 1.05 } },
      { at: 0.78, tilt: 2.2, from: { y: 170, rot: 10, scale: 1.05 } },
    ];
    if (flow) {
      if (window.matchMedia('(min-width: 861px)').matches) {
        const stepIO = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) flow.dataset.stage = e.target.dataset.step;
            }
          },
          { threshold: 0.51 },
        );
        flow.querySelectorAll('.intel-step').forEach((el) => stepIO.observe(el));

        const cards = [...flow.querySelectorAll('.ship-card')];
        const ease = (t) => 1 - Math.pow(1 - t, 3);
        let ticking = false;
        const deal = () => {
          ticking = false;
          const rect = flow.getBoundingClientRect();
          const total = flow.offsetHeight - window.innerHeight;
          const prog = Math.min(1, Math.max(0, -rect.top / total));
          const p2 = Math.min(1, Math.max(0, (prog - STAGE2_START) / (1 - STAGE2_START)));
          cards.forEach((card, i) => {
            const c = CHOREO[i];
            const t = ease(Math.min(1, Math.max(0, (p2 - c.at) / 0.22)));
            card.style.opacity = String(t);
            card.style.transform =
              `translateY(${(1 - t) * c.from.y}px) ` +
              `rotate(${c.from.rot + (c.tilt - c.from.rot) * t}deg) ` +
              `scale(${c.from.scale + (1 - c.from.scale) * t})`;
          });
        };
        window.addEventListener('scroll', () => {
          if (!ticking) { ticking = true; requestAnimationFrame(deal); }
        }, { passive: true });
        deal();
      } else {
        flow.classList.add('static', 'reveal-on');
        revealStacked(flow);
      }
    }
  }
}
