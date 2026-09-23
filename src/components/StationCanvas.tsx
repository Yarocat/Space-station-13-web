import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Tile, PlayerMob, Projectile, EditorTool, TurfType, StructureType, ItemType } from '../types';
import { TURFS_REGISTRY } from '../data/assets';
import {
  preloadCommonDmis,
  addDmiRedrawListener,
  drawDmiSprite,
  getTurfDmiInfo,
  getStructureDmiInfo,
  getItemDmiInfo,
  getWornEquipmentDmi,
  getSpeciesDmiInfo,
  getInHandDmiInfo,
} from '../systems/dmiSystem';
import { drawMobSprite, drawStructureRsiSprite, drawTurfRsiSprite, preloadSpriteAssets } from '../systems/spriteManager';
import { ZoomIn, ZoomOut, Locate } from 'lucide-react';

interface StationCanvasProps {
  map: Tile[][];
  player: PlayerMob;
  projectiles: Projectile[];
  onTileClick: (x: number, y: number, isRightClick?: boolean, screenPos?: { x: number; y: number }) => void;
  showAtmosOverlay: boolean;
  isEditorMode: boolean;
  selectedEditorTurf?: TurfType;
  selectedEditorObject?: StructureType | ItemType;
  currentEditorTool?: EditorTool;
  hoveredTile: { x: number; y: number } | null;
  setHoveredTile: (pos: { x: number; y: number } | null) => void;
}

const TILE_SIZE = 32;

export const StationCanvas: React.FC<StationCanvasProps> = ({
  map,
  player,
  projectiles,
  onTileClick,
  showAtmosOverlay,
  isEditorMode,
  hoveredTile,
  setHoveredTile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState<number>(1.5);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [followPlayer, setFollowPlayer] = useState<boolean>(true);

  // Smooth visual position ref for player to prevent teleport-like jumps
  const visualPosRef = useRef<{ x: number; y: number }>({ x: player.x, y: player.y });

  const mapHeight = map.length;
  const mapWidth = map[0]?.length || 0;

  // Preload standard DMI and RSI textures on initial mount
  useEffect(() => {
    preloadCommonDmis();
    preloadSpriteAssets();
  }, []);

  // Center camera on player
  const centerOnPlayer = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const cur = visualPosRef.current;
    const targetX = clientWidth / 2 - (cur.x + 0.5) * TILE_SIZE * scale;
    const targetY = clientHeight / 2 - (cur.y + 0.5) * TILE_SIZE * scale;
    setPan({ x: targetX, y: targetY });
  }, [scale]);

  // Initial center on mount
  useEffect(() => {
    centerOnPlayer();
  }, []);

  // Handle Canvas Mouse Move for hover & dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setPan({
        x: mouseX - dragStart.x,
        y: mouseY - dragStart.y,
      });
      setFollowPlayer(false);
      return;
    }

    const worldX = Math.floor((mouseX - pan.x) / (TILE_SIZE * scale));
    const worldY = Math.floor((mouseY - pan.y) / (TILE_SIZE * scale));

    if (worldX >= 0 && worldX < mapWidth && worldY >= 0 && worldY < mapHeight) {
      setHoveredTile({ x: worldX, y: worldY });
    } else {
      setHoveredTile(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle click or right-click drag pans
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDragging(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left - pan.x,
        y: e.clientY - rect.top - pan.y,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (e.button === 0 || e.button === 2) {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = Math.floor((mouseX - pan.x) / (TILE_SIZE * scale));
      const worldY = Math.floor((mouseY - pan.y) / (TILE_SIZE * scale));

      if (worldX >= 0 && worldX < mapWidth && worldY >= 0 && worldY < mapHeight) {
        onTileClick(worldX, worldY, e.button === 2, { x: e.clientX, y: e.clientY });
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setScale((prev) => Math.min(3.5, Math.max(0.6, prev * zoomFactor)));
  };

  // Continuous animation and render loop using requestAnimationFrame
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      // Resize canvas to container
      if (containerRef.current) {
        if (
          canvas.width !== containerRef.current.clientWidth ||
          canvas.height !== containerRef.current.clientHeight
        ) {
          canvas.width = containerRef.current.clientWidth;
          canvas.height = containerRef.current.clientHeight;
        }
      }

      ctx.imageSmoothingEnabled = false;

      // 1. Smoothly interpolate player visual position (removes portal/teleport snapping)
      const targetX = player.x;
      const targetY = player.y;
      const cur = visualPosRef.current;
      const dist = Math.hypot(targetX - cur.x, targetY - cur.y);

      if (dist > 4) {
        // Immediate jump on large teleport/respawn
        cur.x = targetX;
        cur.y = targetY;
      } else {
        // Smooth glide transition (~150ms interpolation)
        cur.x += (targetX - cur.x) * 0.28;
        cur.y += (targetY - cur.y) * 0.28;
      }

      // Camera auto-pan tracking the smoothly interpolated player position
      if (followPlayer && !isEditorMode && containerRef.current) {
        const targetPanX = containerRef.current.clientWidth / 2 - (cur.x + 0.5) * TILE_SIZE * scale;
        const targetPanY = containerRef.current.clientHeight / 2 - (cur.y + 0.5) * TILE_SIZE * scale;
        const dx = targetPanX - pan.x;
        const dy = targetPanY - pan.y;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          setPan((prev) => ({
            x: prev.x + dx * 0.22,
            y: prev.y + dy * 0.22,
          }));
        }
      }

      // Clear background (Deep Space)
      ctx.fillStyle = '#06080e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(scale, scale);

      // Visible bounds calculation
      const startX = Math.max(0, Math.floor(-pan.x / (TILE_SIZE * scale)));
      const endX = Math.min(mapWidth - 1, Math.ceil((canvas.width - pan.x) / (TILE_SIZE * scale)));
      const startY = Math.max(0, Math.floor(-pan.y / (TILE_SIZE * scale)));
      const endY = Math.min(mapHeight - 1, Math.ceil((canvas.height - pan.y) / (TILE_SIZE * scale)));

      // 1. Draw Starfield background for Space
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      for (let sy = startY; sy <= endY; sy++) {
        for (let sx = startX; sx <= endX; sx++) {
          if (map[sy][sx].turf === 'Space') {
            const seed = (sx * 73856093) ^ (sy * 19349663);
            if ((seed & 7) === 0) {
              const starX = sx * TILE_SIZE + ((seed >> 3) % 28) + 2;
              const starY = sy * TILE_SIZE + ((seed >> 6) % 28) + 2;
              ctx.fillRect(starX, starY, 1.5, 1.5);
            }
          }
        }
      }

      // 2. Draw Turfs with TGStation DMI textures
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const tile = map[y][x];
          const tx = x * TILE_SIZE;
          const ty = y * TILE_SIZE;

          // Try Goob Station RSI wall / window / grille first
          let drawn = drawTurfRsiSprite(ctx, tile.turf, tx, ty);
          if (!drawn) {
            const turfDmi = getTurfDmiInfo(tile.turf, map, x, y);
            drawn = drawDmiSprite(ctx, turfDmi.dmi, turfDmi.state, tx, ty);
          }

          if (!drawn) {
            // Color fallback if texture is still loading
            const turfMeta = TURFS_REGISTRY[tile.turf];
            ctx.fillStyle = turfMeta ? turfMeta.color : '#2d3340';
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // 3. Draw Objects on Tiles (Structures & Items)
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const tile = map[y][x];
          const tx = x * TILE_SIZE;
          const ty = y * TILE_SIZE;

          for (const obj of tile.objects) {
            if (obj.isItem) {
              // Item on the floor
              const itemDmi = getItemDmiInfo(obj.type as ItemType);
              const drawn = drawDmiSprite(ctx, itemDmi.dmi, itemDmi.state, tx, ty);
              if (!drawn) {
                // Fallback item circle
                ctx.fillStyle = obj.color || '#facc15';
                ctx.beginPath();
                ctx.arc(tx + 16, ty + 16, 5, 0, Math.PI * 2);
                ctx.fill();
              }
            } else {
              // Station Structure or Door via Goob Station RSI
              let drawn = drawStructureRsiSprite(ctx, obj, tx, ty);
              if (!drawn) {
                const structDmi = getStructureDmiInfo(
                  obj.type as StructureType,
                  obj.isOpen,
                  obj.welded,
                  obj.isLocked,
                  obj.doorAnimFrame
                );
                drawn = drawDmiSprite(ctx, structDmi.dmi, structDmi.state, tx, ty, {
                  frame: structDmi.frame,
                });
              }

              if (!drawn) {
                // Fallback if structure sprite not loaded
                if (obj.type.includes('Door')) {
                  ctx.fillStyle = obj.isOpen ? '#22c55e' : obj.color || '#64748b';
                  ctx.fillRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                } else {
                  ctx.fillStyle = obj.color || '#475569';
                  ctx.fillRect(tx + 4, ty + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                }
              }
            }
          }
        }
      }

      // 4. Atmospheric Overlays (Gas & Fire)
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const tile = map[y][x];
          const tx = x * TILE_SIZE;
          const ty = y * TILE_SIZE;

          // Fire flame
          if (tile.atmos.fire) {
            const fireDrawn = drawDmiSprite(ctx, 'fire.dmi', '1', tx, ty, {
              frame: Math.floor(Date.now() / 150) % 4,
            });
            if (!fireDrawn) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            }
            continue;
          }

          // Atmospheric visualization
          if (showAtmosOverlay) {
            const temp = tile.atmos.temperature;
            if (temp > 350) {
              const alpha = Math.min(0.6, (temp - 350) / 400);
              ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            } else if (temp < 270) {
              const alpha = Math.min(0.5, (270 - temp) / 200);
              ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
              ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            }
          }

          // Plasma toxic haze
          if (tile.atmos.plasma > 1) {
            const alpha = Math.min(0.7, (tile.atmos.plasma / 100) * 0.8 + 0.2);
            ctx.fillStyle = `rgba(236, 72, 153, ${alpha})`;
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            continue;
          }

          // Depressurization (Low pressure chill)
          if (tile.atmos.pressure < 50) {
            ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          } else if (tile.atmos.pressure > 150) {
            ctx.fillStyle = 'rgba(234, 88, 12, 0.35)';
            ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // 5. Projectiles
      for (const proj of projectiles) {
        const px = proj.x * TILE_SIZE;
        const py = proj.y * TILE_SIZE;
        const isLaser = proj.type === 'laser';
        const projDrawn = drawDmiSprite(ctx, 'projectiles.dmi', isLaser ? 'laser' : 'u_laser', px - 4, py - 4);
        if (!projDrawn) {
          ctx.fillStyle = isLaser ? '#ef4444' : '#facc15';
          ctx.fillRect(px - 2, py - 2, 6, 6);
        }
      }

      // 5.5. SS14 Dynamic Station Lighting & Atmospheric Glow Pass
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
          const tile = map[y][x];
          const tx = x * TILE_SIZE + 16;
          const ty = y * TILE_SIZE + 16;

          for (const obj of tile.objects) {
            if (obj.type === 'WallLight') {
              const grad = ctx.createRadialGradient(tx, ty, 4, tx, ty, 80);
              grad.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
              grad.addColorStop(0.4, 'rgba(253, 224, 71, 0.16)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(tx, ty, 80, 0, Math.PI * 2);
              ctx.fill();
            } else if (obj.type === 'Computer') {
              const grad = ctx.createRadialGradient(tx, ty, 4, tx, ty, 56);
              grad.addColorStop(0, 'rgba(56, 189, 248, 0.38)');
              grad.addColorStop(0.6, 'rgba(6, 182, 212, 0.12)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(tx, ty, 56, 0, Math.PI * 2);
              ctx.fill();
            } else if (obj.type === 'MedicalSign') {
              const grad = ctx.createRadialGradient(tx, ty, 4, tx, ty, 48);
              grad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(tx, ty, 48, 0, Math.PI * 2);
              ctx.fill();
            } else if (obj.type === 'FireAlarm' || (obj.type.includes('Door') && obj.isLocked)) {
              const grad = ctx.createRadialGradient(tx, ty, 2, tx, ty, 40);
              grad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
              grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(tx, ty, 40, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Player personal suit illumination / helmet light
      const pLightGrad = ctx.createRadialGradient(cur.x * TILE_SIZE + 16, cur.y * TILE_SIZE + 16, 8, cur.x * TILE_SIZE + 16, cur.y * TILE_SIZE + 16, 96);
      pLightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
      pLightGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.12)');
      pLightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pLightGrad;
      ctx.beginPath();
      ctx.arc(cur.x * TILE_SIZE + 16, cur.y * TILE_SIZE + 16, 96, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 6. Draw Player Mob with TGStation DMI layered rendering
      const px = cur.x * TILE_SIZE;
      const py = cur.y * TILE_SIZE;

      if (player.isGhost) {
        // Ghost mob
        const ghostDrawn = drawDmiSprite(ctx, 'human.dmi', 'ghost', px, py, {
          dir: player.dir,
          alpha: 0.8,
        });
        if (!ghostDrawn) {
          ctx.fillStyle = 'rgba(147, 197, 253, 0.7)';
          ctx.beginPath();
          ctx.arc(px + 16, py + 14, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Unified Goob Station RSI Species & Clothing + TGStation equipment
        drawMobSprite(ctx, player, px, py);
      }

      // Overhead name tag
      const nameText = player.name;
      ctx.font = 'bold 9px monospace';
      const textW = ctx.measureText(nameText).width;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(px + 16 - textW / 2 - 3, py - 12, textW + 6, 11);
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(nameText, px + 16, py - 3);

      // 7. Active Projectiles Rendering (Goob Station Gunplay FX)
      for (const p of projectiles) {
        const projX = p.x * TILE_SIZE + 16;
        const projY = p.y * TILE_SIZE + 16;
        const angle = Math.atan2(p.vy, p.vx);

        ctx.save();
        ctx.translate(projX, projY);
        ctx.rotate(angle);

        if (p.type === 'laser') {
          // Intense Red Neon Laser
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(8, 0);
          ctx.stroke();

          // White hot core
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-8, 0);
          ctx.lineTo(7, 0);
          ctx.stroke();
        } else if (p.type === 'taser') {
          // Cyan Electric Pulse
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#0891b2';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.type === 'disabler') {
          // Blue Disruption Orb
          ctx.fillStyle = '#3b82f6';
          ctx.shadowColor = '#2563eb';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Kinetic Bullet / Buckshot Pellet
          ctx.fillStyle = '#fbbf24';
          ctx.shadowColor = '#d97706';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // 8. Firearm Aiming Reticle & Laser Sight
      const activeHand = player.inventory.activeHand;
      const heldWeapon = player.inventory[activeHand];
      const isFirearm =
        heldWeapon &&
        (heldWeapon.type === 'LaserGun' ||
          heldWeapon.type === 'Gun' ||
          heldWeapon.type === 'Revolver' ||
          heldWeapon.type === 'Shotgun' ||
          heldWeapon.type === 'Taser' ||
          heldWeapon.type === 'Disabler');

      if (isFirearm && hoveredTile) {
        const targetCenterX = hoveredTile.x * TILE_SIZE + 16;
        const targetCenterY = hoveredTile.y * TILE_SIZE + 16;

        // Laser line from player to target
        ctx.save();
        ctx.strokeStyle = heldWeapon.type === 'LaserGun' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px + 16, py + 16);
        ctx.lineTo(targetCenterX, targetCenterY);
        ctx.stroke();

        // Crosshairs reticle at target
        ctx.strokeStyle = heldWeapon.type === 'LaserGun' ? '#ef4444' : '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(targetCenterX, targetCenterY, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(targetCenterX - 12, targetCenterY);
        ctx.lineTo(targetCenterX + 12, targetCenterY);
        ctx.moveTo(targetCenterX, targetCenterY - 12);
        ctx.lineTo(targetCenterX, targetCenterY + 12);
        ctx.stroke();
        ctx.restore();
      }

      // 9. Hovered Tile Cursor Highlight
      if (hoveredTile) {
        const hx = hoveredTile.x * TILE_SIZE;
        const hy = hoveredTile.y * TILE_SIZE;
        ctx.strokeStyle = isEditorMode ? '#38bdf8' : isFirearm ? '#ef4444' : '#eab308';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 0.5, hy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        // Tooltip coords & details
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(hx, hy - 18, 56, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${hoveredTile.x},${hoveredTile.y}`, hx + 28, hy - 6);
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    const unsubscribe = addDmiRedrawListener(() => {});

    return () => {
      cancelAnimationFrame(animId);
      unsubscribe();
    };
  }, [
    map,
    player,
    projectiles,
    pan,
    scale,
    showAtmosOverlay,
    isEditorMode,
    hoveredTile,
    followPlayer,
    mapWidth,
    mapHeight,
  ]);

  // Compute top entity / interaction prompt for SS14 Top-Center banner (matches SS14 & Goob Station UI)
  const hoveredTileData = hoveredTile && map[hoveredTile.y]?.[hoveredTile.x] ? map[hoveredTile.y][hoveredTile.x] : null;
  let hoverTitle = '';
  let hoverActions = '';

  if (hoveredTileData) {
    const topObj = hoveredTileData.objects[hoveredTileData.objects.length - 1];
    if (topObj) {
      const lowerType = topObj.type.toLowerCase();
      if (lowerType === 'extinguishercabinet') {
        hoverTitle = 'extinguisher cabinet';
        hoverActions = '[LMB] Take extinguisher | [RMB] Open';
      } else if (lowerType.includes('door') || lowerType.includes('airlock')) {
        hoverTitle = topObj.name ? topObj.name.toLowerCase() : 'airlock';
        hoverActions = topObj.isOpen ? '[LMB] Close | [RMB] Bolt' : '[LMB] Open | [RMB] Bolt / Access';
      } else if (lowerType === 'vent') {
        hoverTitle = 'air vent';
        hoverActions = '[LMB] Inspect airflow | [RMB] Examine';
      } else if (lowerType === 'gasscrubber') {
        hoverTitle = 'gas scrubber';
        hoverActions = '[LMB] Toggle pump | [RMB] Filter settings';
      } else if (lowerType === 'walllight') {
        hoverTitle = 'wall light';
        hoverActions = '[LMB] Toggle switch | [RMB] Replace tube';
      } else if (lowerType === 'firealarm') {
        hoverTitle = 'fire alarm';
        hoverActions = '[LMB] Pull alarm | [RMB] Reset';
      } else if (lowerType === 'airalarm') {
        hoverTitle = 'air alarm';
        hoverActions = '[LMB] Atmosphere interface | [RMB] Lock';
      } else if (lowerType === 'apc') {
        hoverTitle = 'area power controller (APC)';
        hoverActions = '[LMB] Main breaker | [RMB] Maintenance';
      } else if (lowerType === 'medicalsign') {
        hoverTitle = 'medical station sign';
        hoverActions = '[LMB] Examine | [RMB] Read';
      } else if (lowerType === 'plant') {
        hoverTitle = topObj.name ? topObj.name.toLowerCase() : 'potted flora';
        hoverActions = '[LMB] Touch leaves | [RMB] Inspect soil';
      } else if (lowerType === 'bench') {
        hoverTitle = 'waiting bench';
        hoverActions = '[LMB] Sit down | [RMB] Buckle';
      } else if (lowerType === 'vendingsoda') {
        hoverTitle = 'drink-o-matic vendor';
        hoverActions = '[LMB] Select beverage | [RMB] Service panel';
      } else if (lowerType === 'vendingsnack') {
        hoverTitle = 'get-more-chocolate vendor';
        hoverActions = '[LMB] Purchase snack | [RMB] Shake machine';
      } else if (lowerType === 'watercooler') {
        hoverTitle = 'water cooler';
        hoverActions = '[LMB] Fill cup | [RMB] Drink';
      } else if (lowerType === 'wallsign') {
        hoverTitle = `station sign (${topObj.name || 'information'})`;
        hoverActions = '[LMB] Read sign | [RMB] Inspect';
      } else if (topObj.isItem) {
        hoverTitle = topObj.name.toLowerCase();
        hoverActions = '[LMB] Pick up | [RMB] Examine';
      } else {
        hoverTitle = (topObj.name || topObj.type).toLowerCase();
        hoverActions = '[LMB] Interact | [RMB] Examine';
      }
    } else {
      const turf = hoveredTileData.turf;
      const turfName =
        turf === 'Floor'
          ? 'steel floor'
          : turf === 'FloorTile'
          ? 'tiled floor'
          : turf === 'FloorWhite'
          ? 'sterile medbay tile'
          : turf === 'FloorCatwalk'
          ? 'catwalk mesh'
          : turf === 'FloorPlanter'
          ? 'hydroponics soil'
          : turf === 'Plating'
          ? 'hull plating'
          : turf === 'MetalWall'
          ? 'reinforced bulkhead'
          : turf === 'Space'
          ? 'deep space vacuum'
          : turf.toLowerCase();
      hoverTitle = turfName;
      hoverActions = '[LMB] Move to tile | [RMB] Examine turf';
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-neutral-950 select-none cursor-crosshair"
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Top Center SS14 Entity Hover Prompt Banner (Exact match to Space Station 14 & Goob Station HUD) */}
      {hoverTitle && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center animate-in fade-in duration-100">
          <div className="bg-neutral-950/85 border border-neutral-700/80 px-4 py-1.5 rounded shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
            <span className="text-white font-bold text-xs tracking-wider uppercase drop-shadow-sm font-sans">
              {hoverTitle}
            </span>
            <span className="text-[11px] text-neutral-300 font-mono mt-0.5 tracking-tight">
              {hoverActions}
            </span>
          </div>
        </div>
      )}

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-lg border border-neutral-700/60 shadow-lg text-neutral-300 z-10">
        <button
          id="zoom-in-btn"
          onClick={() => setScale((s) => Math.min(3.5, s * 1.25))}
          title="Zoom In"
          className="p-1.5 hover:bg-neutral-800 hover:text-white rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="zoom-out-btn"
          onClick={() => setScale((s) => Math.max(0.6, s / 1.25))}
          title="Zoom Out"
          className="p-1.5 hover:bg-neutral-800 hover:text-white rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-neutral-700 mx-0.5" />
        <button
          id="recenter-btn"
          onClick={() => {
            setFollowPlayer(true);
            centerOnPlayer();
          }}
          title="Center on Player"
          className={`p-1.5 rounded transition-colors ${followPlayer ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-neutral-800'}`}
        >
          <Locate className="w-4 h-4" />
        </button>
      </div>

      {/* Hovered Tile Info Pill */}
      {hoveredTile && map[hoveredTile.y]?.[hoveredTile.x] && (
        <div className="absolute bottom-4 left-4 bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-neutral-700/60 shadow-md text-xs font-mono text-neutral-300 flex items-center gap-3 z-10">
          <span className="text-amber-400 font-semibold">
            {map[hoveredTile.y][hoveredTile.x].turf}
          </span>
          <span className="text-neutral-500">|</span>
          <span>
            {map[hoveredTile.y][hoveredTile.x].objects.length > 0
              ? map[hoveredTile.y][hoveredTile.x].objects.map((o) => o.name).join(', ')
              : 'Empty'}
          </span>
          <span className="text-neutral-500">|</span>
          <span
            className={
              map[hoveredTile.y][hoveredTile.x].atmos.pressure < 50
                ? 'text-blue-400 font-bold'
                : 'text-neutral-400'
            }
          >
            {map[hoveredTile.y][hoveredTile.x].atmos.pressure.toFixed(1)} kPa
          </span>
          {map[hoveredTile.y][hoveredTile.x].atmos.plasma > 0 && (
            <span className="text-pink-400 font-bold">
              ☣ {map[hoveredTile.y][hoveredTile.x].atmos.plasma.toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};
