import React, { useEffect, useRef } from 'react';

const Background3DAnimation = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // 3D Projection parameters
    const centerX = () => canvas.width / 2;
    const centerY = () => canvas.height / 2;
    const fov = 400; // perspective depth scale

    // Central Player Node (3D position)
    const player = { x: 0, y: 0, z: 0, radius: 26, pulse: 0 };

    // Orbiting Franchise Nodes (3D positions)
    const franchises = [
      { name: 'FRANCHISE A', angle: 0, speed: 0.004, radius: 11, distance: 280, yOffset: -60 },
      { name: 'FRANCHISE B', angle: (2 * Math.PI) / 5, speed: 0.003, radius: 11, distance: 300, yOffset: 50 },
      { name: 'FRANCHISE C', angle: (4 * Math.PI) / 5, speed: 0.005, radius: 11, distance: 260, yOffset: -10 },
      { name: 'FRANCHISE D', angle: (6 * Math.PI) / 5, speed: 0.0028, radius: 11, distance: 320, yOffset: 70 },
      { name: 'FRANCHISE E', angle: (8 * Math.PI) / 5, speed: 0.0035, radius: 11, distance: 290, yOffset: -30 }
    ];

    // Flying Bid Particles queue
    let bids = [];

    // Project 3D (x, y, z) coordinates into 2D screen coordinates
    const project = (x, y, z) => {
      const scale = fov / (fov + z);
      const sx = centerX() + x * scale;
      const sy = centerY() + y * scale;
      return { x: sx, y: sy, scale };
    };

    // Main render loop
    const render = () => {
      // Clear with transparent background to inherit parent bg
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid overlay in light gray
      ctx.strokeStyle = 'rgba(163, 163, 163, 0.07)';
      ctx.lineWidth = 1;
      const gridSpacing = 80;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Update central player pulse
      player.pulse += 0.025;
      const playerRadius = player.radius + Math.sin(player.pulse) * 2;

      // Project Player Center
      const pProj = project(player.x, player.y, player.z);

      // Queue of all elements to draw sorted by depth (Z-index)
      const renderQueue = [];

      // Update and project franchises
      franchises.forEach(f => {
        f.angle += f.speed;

        // Circular orbit calculations
        const tx = Math.cos(f.angle) * f.distance;
        const tz = Math.sin(f.angle) * f.distance;
        const ty = f.yOffset + Math.sin(f.angle * 2) * 15; // Vertical wave motion

        const tProj = project(tx, ty, tz);

        renderQueue.push({
          type: 'franchise',
          z: tz,
          name: f.name,
          x: tProj.x,
          y: tProj.y,
          scale: tProj.scale,
          radius: f.radius * tProj.scale,
          tx, ty, tz
        });

        // Trigger dynamic bid particles randomly
        if (Math.random() < 0.012) {
          bids.push({
            startX: tx, startY: ty, startZ: tz,
            currentX: tx, currentY: ty, currentZ: tz,
            progress: 0,
            speed: 0.012 + Math.random() * 0.008
          });
        }
      });

      // Update and project flying bid particles
      bids = bids.filter(bid => {
        bid.progress += bid.speed;
        if (bid.progress >= 1) return false; // Bid arrived at target

        // Interpolate 3D position toward center (0,0,0)
        bid.currentX = bid.startX * (1 - bid.progress);
        bid.currentY = bid.startY * (1 - bid.progress);
        bid.currentZ = bid.startZ * (1 - bid.progress);

        const bProj = project(bid.currentX, bid.currentY, bid.currentZ);

        renderQueue.push({
          type: 'bid',
          z: bid.currentZ,
          x: bProj.x,
          y: bProj.y,
          scale: bProj.scale
        });

        return true;
      });

      // Painter's algorithm: Sort descending by depth Z
      renderQueue.sort((a, b) => b.z - a.z);

      // Render all items in depth order
      renderQueue.forEach(item => {
        if (item.type === 'franchise') {
          // Draw faint orbit connection line
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * item.scale})`;
          ctx.lineWidth = 1 * item.scale;
          ctx.moveTo(pProj.x, pProj.y);
          ctx.lineTo(item.x, item.y);
          ctx.stroke();

          // Franchise node
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.15 * item.scale})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 * item.scale})`;
          ctx.lineWidth = 1.5 * item.scale;
          ctx.stroke();

          // Franchise label
          ctx.font = `bold ${Math.max(9, Math.round(10 * item.scale))}px 'Outfit', sans-serif`;
          ctx.fillStyle = `rgba(255, 255, 255, 0.95)`;
          ctx.textAlign = 'center';
          ctx.fillText(item.name, item.x, item.y - item.radius - 5);
        } else if (item.type === 'bid') {
          // Flying bid dot
          ctx.beginPath();
          ctx.arc(item.x, item.y, 3 * item.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * item.scale})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * item.scale})`;
          ctx.lineWidth = 0.8 * item.scale;
          ctx.stroke();
        }
      });

      // Draw central bid target (Player Node) at Z = 0
      ctx.beginPath();
      ctx.arc(pProj.x, pProj.y, playerRadius * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pProj.x, pProj.y, playerRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Label inside central player node
      ctx.font = 'bold 9px "Outfit", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('DRAFT TARGET', pProj.x, pProj.y);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Clean up animation on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default Background3DAnimation;
