<!-- LandingCanvas.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let width: number;
  let height: number;
  let points: Point[] = [];
  let target = { x: 0, y: 0 };
  let animateHeader = true;

  interface Point {
    x: number;
    y: number;
    originX: number;
    originY: number;
    closest?: Point[];
    circle?: Circle;
    active?: number;
  }

  class Circle {
    pos: Point;
    radius: number;
    color: string;
    active?: number;

    constructor(pos: Point, radius: number, color: string) {
      this.pos = pos;
      this.radius = radius;
      this.color = color;
    }

    draw() {
      if (!this.active) return;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = `rgba(156,217,249,${this.active})`;
      // ctx.fillStyle = `rgba(228,213,183,${this.active})`;
      ctx.fill();
    }
  }

  const initHeader = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    target = { x: width / 2, y: height / 2 };

    if (canvas) {
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext('2d')!;
    }

    // create points
    points = [];
    for (let x = 0; x < width; x += width / 20) {
      for (let y = 0; y < height; y += height / 20) {
        const px = x + Math.random() * width / 20;
        const py = y + Math.random() * height / 20;
        const p = { x: px, originX: px, y: py, originY: py };
        points.push(p);
      }
    }

    // for each point find the 5 closest points
    for (let i = 0; i < points.length; i++) {
      const closest: Point[] = [];
      const p1 = points[i];
      for (let j = 0; j < points.length; j++) {
        const p2 = points[j];
        if (!(p1 === p2)) {
          let placed = false;
          for (let k = 0; k < 5; k++) {
            if (!placed) {
              if (closest[k] === undefined) {
                closest[k] = p2;
                placed = true;
              }
            }
          }

          for (let k = 0; k < 5; k++) {
            if (!placed) {
              if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                closest[k] = p2;
                placed = true;
              }
            }
          }
        }
      }
      p1.closest = closest;
    }

    // assign a circle to each point
    for (const p of points) {
      const c = new Circle(p, 2 + Math.random() * 2, 'rgba(255,255,255,0.3)');
      // const c = new Circle(p, 2 + Math.random() * 2, 'rgba(228,213,183,0.3)');
      p.circle = c;
    }
  };

  const getDistance = (p1: Point, p2: Point): number => {
    return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  };

  const drawLines = (p: Point) => {
    if (!p.active) return;
    for (const closest of p.closest!) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(closest.x, closest.y);
      ctx.strokeStyle = `rgba(156,217,249,${p.active})`;
      // ctx.strokeStyle = `rgba(228,213,183,${p.active})`;
      ctx.stroke();
    }
  };

  const shiftPoint = (p: Point) => {
    import('gsap').then(({ TweenLite }) => {
      TweenLite.to(p, 1 + 1 * Math.random(), {
        x: p.originX - 50 + Math.random() * 100,
        y: p.originY - 50 + Math.random() * 100,
        ease: 'Circ.easeInOut',
        onComplete: () => {
          shiftPoint(p);
        }
      });
    });
  };

  const animate = () => {
    if (animateHeader) {
      ctx.clearRect(0, 0, width, height);
      for (const p of points) {
        if (Math.abs(getDistance(target, p)) < 4000) {
          p.active = 0.3;
          p.circle!.active = 0.6;
        } else if (Math.abs(getDistance(target, p)) < 20000) {
          p.active = 0.1;
          p.circle!.active = 0.3;
        } else if (Math.abs(getDistance(target, p)) < 40000) {
          p.active = 0.02;
          p.circle!.active = 0.1;
        } else {
          p.active = 0;
          p.circle!.active = 0;
        }

        drawLines(p);
        p.circle!.draw();
      }
    }
    requestAnimationFrame(animate);
  };

  const initAnimation = () => {
    animate();
    for (const p of points) {
      shiftPoint(p);
    }
  };

  const mouseMove = (e: MouseEvent) => {
    let posx = 0;
    let posy = 0;
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    target.x = posx;
    target.y = posy;
  };

  const scrollCheck = () => {
    if (document.body.scrollTop > height) animateHeader = false;
    else animateHeader = true;
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const addListeners = () => {
    if (!('ontouchstart' in window)) {
      window.addEventListener('mousemove', mouseMove);
    }
    window.addEventListener('scroll', scrollCheck);
    window.addEventListener('resize', resize);
  };

  onMount(() => {
    initHeader();
    initAnimation();
    addListeners();
  });
</script>

<style>
  #demo-canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
  }
</style>

<canvas id="demo-canvas" bind:this={canvas}></canvas>
