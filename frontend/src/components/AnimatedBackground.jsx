import { useEffect, useRef } from "react";

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId = 0;
    let nodes = [];
    let routes = [];
    let particles = [];
    let startTime = performance.now();

    const GRID_SPACING = 44;
    const ROUTE_COUNT = 4;
    const PARTICLE_COUNT = 60;

    const random = (min, max) => min + Math.random() * (max - min);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const nodeColor = (fill) => {
      if (fill >= 0.85) return "#E24B4A";
      if (fill >= 0.6) return "#BA7517";
      return "#1d9e75";
    };

    const initNodes = () => {
      const cols = 6;
      const cellW = canvas.width / cols;
      const rows = Math.ceil(canvas.height / GRID_SPACING);
      const count = Math.floor(random(20, 31));
      nodes = [];

      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols) % rows;
        const jitterX = random(-cellW * 0.25, cellW * 0.25);
        const jitterY = random(-GRID_SPACING * 0.25, GRID_SPACING * 0.25);
        nodes.push({
          x: col * cellW + cellW * 0.5 + jitterX,
          y: row * GRID_SPACING + GRID_SPACING * 0.5 + jitterY,
          fill: Math.random(),
          radius: random(4, 8),
          phase: random(0, Math.PI * 2),
        });
      }
    };

    const initRoutes = () => {
      routes = [];
      if (nodes.length < 2) return;

      for (let i = 0; i < ROUTE_COUNT; i++) {
        const a = pick(nodes);
        let b = pick(nodes);
        let guard = 0;
        while (b === a && guard < 10) {
          b = pick(nodes);
          guard++;
        }
        routes.push({
          from: a,
          to: b,
          progress: Math.random(),
          speed: random(0.0008, 0.0016),
        });
      }
    };

    const spawnParticle = () => {
      const edge = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;

      if (edge === 0) {
        x = random(0, canvas.width);
        y = -5;
        vx = random(-0.15, 0.15);
        vy = random(0.2, 0.6);
      } else if (edge === 1) {
        x = canvas.width + 5;
        y = random(0, canvas.height);
        vx = random(-0.6, -0.2);
        vy = random(-0.15, 0.15);
      } else if (edge === 2) {
        x = random(0, canvas.width);
        y = canvas.height + 5;
        vx = random(-0.15, 0.15);
        vy = random(-0.6, -0.2);
      } else {
        x = -5;
        y = random(0, canvas.height);
        vx = random(0.2, 0.6);
        vy = random(-0.15, 0.15);
      }

      return {
        x,
        y,
        vx,
        vy,
        radius: random(1, 3),
        life: 0,
        maxLife: random(180, 420),
        color: Math.random() > 0.5 ? "#5DCAA5" : "#1d9e75",
      };
    };

    const initParticles = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, spawnParticle);
    };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
      initRoutes();
      initParticles();
      startTime = performance.now();
    };

    const drawBackground = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, "#071510");
      grad.addColorStop(0.4, "#0d2318");
      grad.addColorStop(1, "#0a1a10");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawGrid = () => {
      ctx.strokeStyle = "rgba(29,158,117,0.06)";
      ctx.lineWidth = 0.5;

      for (let x = 0; x <= canvas.width; x += GRID_SPACING) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y <= canvas.height; y += GRID_SPACING) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    };

    const drawNodes = (time) => {
      nodes.forEach((node) => {
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.002 + node.phase);
        const haloR = node.radius * (2.2 + pulse * 1.8);
        const color = nodeColor(node.fill);

        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const haloGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, haloR);
        haloGrad.addColorStop(0, `rgba(${r},${g},${b},${0.35 * pulse})`);
        haloGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, haloR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawRoutes = () => {
      routes.forEach((route) => {
        const { from, to } = route;
        ctx.strokeStyle = "rgba(93,202,165,0.18)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const t = route.progress;
        const dotX = from.x + (to.x - from.x) * t;
        const dotY = from.y + (to.y - from.y) * t;

        const dotGlow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 8);
        dotGlow.addColorStop(0, "rgba(93,202,165,0.9)");
        dotGlow.addColorStop(1, "rgba(93,202,165,0)");
        ctx.fillStyle = dotGlow;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(93,202,165,0.95)";
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
        ctx.fill();

        route.progress += route.speed;
        if (route.progress > 1) route.progress = 0;
      });
    };

    const drawParticles = () => {
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        const out =
          p.x < -20 ||
          p.x > canvas.width + 20 ||
          p.y < -20 ||
          p.y > canvas.height + 20 ||
          p.life >= p.maxLife;

        if (out) {
          particles[i] = spawnParticle();
          return;
        }

        const r = parseInt(p.color.slice(1, 3), 16);
        const g = parseInt(p.color.slice(3, 5), 16);
        const b = parseInt(p.color.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const draw = (time) => {
      drawBackground();
      drawGrid();
      drawNodes(time);
      drawRoutes();
      drawParticles();
      animationId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      init();
    };

    init();
    animationId = requestAnimationFrame(draw);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full -z-10" />;
};

export default AnimatedBackground;
