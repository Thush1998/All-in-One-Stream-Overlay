/**
 * Minimal inline Lottie JSON for a star-burst particle effect.
 * Self-contained — no CDN or network request needed.
 * Duration: ~1.5s, 60fps, gold + white particles.
 */
const starBurstData = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 90,
  w: 400,
  h: 400,
  nm: 'StarBurst',
  ddd: 0,
  assets: [],
  layers: [
    ...Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const dist = 160 + (i % 3) * 30;
      const tx = Math.round(Math.cos(angle) * dist);
      const ty = Math.round(Math.sin(angle) * dist);
      const size = 6 + (i % 4) * 4;
      const isGold = i % 3 !== 2;
      const color = isGold ? [1, 0.84, 0] : [1, 1, 1];
      return {
        ddd: 0,
        ind: i + 1,
        ty: 4,
        nm: `star_${i}`,
        sr: 1,
        ks: {
          o: {
            a: 1,
            k: [
              { t: 0, s: [0], e: [100], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
              { t: 20, s: [100], e: [100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
              { t: 70, s: [100], e: [0], i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } },
              { t: 90, s: [0] },
            ],
          },
          r: { a: 0, k: angle * (180 / Math.PI) },
          p: {
            a: 1,
            k: [
              { t: 0, s: [200, 200, 0], e: [200 + tx, 200 + ty, 0], i: { x: [0.2], y: [1] }, o: { x: [0.4], y: [0] } },
              { t: 90, s: [200 + tx, 200 + ty, 0] },
            ],
          },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [0, 0, 100], e: [100, 100, 100], i: { x: [0.3], y: [1.4] }, o: { x: [0.7], y: [0] } },
              { t: 30, s: [100, 100, 100], e: [60, 60, 100], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } },
              { t: 90, s: [0, 0, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: 'gr',
            it: [
              {
                ty: 'sr',
                nm: 'Star',
                sy: 1,
                d: 1,
                pt: { a: 0, k: 5 },
                p: { a: 0, k: [0, 0] },
                r: { a: 0, k: 0 },
                ir: { a: 0, k: size * 0.4 },
                is: { a: 0, k: 0 },
                or: { a: 0, k: size },
                os: { a: 0, k: 0 },
              },
              {
                ty: 'fl',
                c: { a: 0, k: [...color, 1] },
                o: { a: 0, k: 100 },
                r: 1,
                nm: 'Fill',
              },
            ],
            nm: 'StarGroup',
          },
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0,
      };
    }),
  ],
};

export default starBurstData;
