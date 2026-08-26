import { useEffect, useRef } from "react";

type Node = { x: number; y: number; r: number; anomaly: boolean };

export default function LiveGrid({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const nodes: Node[] = [];
    const edges: [number, number][] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = (n: number) => {
      let a = n | 0;
      a = (a + 0x6d2b79f5) | 0;
      let t0 = Math.imul(a ^ (a >>> 15), 1 | a);
      t0 = (t0 + Math.imul(t0 ^ (t0 >>> 7), 61 | t0)) ^ t0;
      return ((t0 ^ (t0 >>> 14)) >>> 0) / 4294967296;
    };

    const build = () => {
      nodes.length = 0;
      edges.length = 0;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const count = 26;
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: 40 + seed(i * 17) * (w - 80),
          y: 40 + seed(i * 31 + 4) * (h - 80),
          r: 2.2 + seed(i * 9) * 2.4,
          anomaly: i === 7,
        });
      }
      for (let i = 0; i < count; i++) {
        let best = -1;
        let bestD = Infinity;
        let second = -1;
        let secondD = Infinity;
        for (let j = 0; j < count; j++) {
          if (i === j) continue;
          const d = (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2;
          if (d < bestD) {
            second = best;
            secondD = bestD;
            best = j;
            bestD = d;
          } else if (d < secondD) {
            second = j;
            secondD = d;
          }
        }
        if (best >= 0 && i < best) edges.push([i, best]);
        if (second >= 0 && i < second) edges.push([i, second]);
      }
    };

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      t += 0.008;

      ctx.lineCap = "round";
      edges.forEach(([a, b], ei) => {
        const na = nodes[a];
        const nb = nodes[b];
        const pulse = (Math.sin(t * 2 + ei) + 1) / 2;
        ctx.strokeStyle = `rgba(78, 143, 203, ${0.12 + pulse * 0.22})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();

        const u = (t * 0.35 + ei * 0.08) % 1;
        ctx.fillStyle = "rgba(248, 148, 47, 0.85)";
        ctx.beginPath();
        ctx.arc(na.x + (nb.x - na.x) * u, na.y + (nb.y - na.y) * u, 1.4, 0, Math.PI * 2);
        ctx.fill();
      });

      nodes.forEach((n) => {
        if (n.anomaly) {
          const ring = 10 + Math.sin(t * 3) * 4;
          ctx.strokeStyle = `rgba(255, 102, 0, ${0.55 + Math.sin(t * 3) * 0.2})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(n.x, n.y, ring, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = "rgba(255, 102, 0, 0.22)";
          ctx.beginPath();
          ctx.arc(n.x, n.y, ring + 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([3, 6]);
          ctx.strokeStyle = "rgba(255, 102, 0, 0.7)";
          ctx.beginPath();
          ctx.moveTo(n.x - 18, n.y + 10);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#FF6600";
          ctx.beginPath();
          ctx.arc(n.x, n.y, 4.2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#8EC0E8";
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      resize();
      build();
    };
    onResize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={ref} className={`block w-full h-full ${className}`} />;
}
