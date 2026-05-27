import { seek, getDistance, getDirection } from './physics';

export interface CombatUnit {
  id: string;
  name: string;
  isPlayer: boolean;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attackPower: number;
  defense?: number;
  attackRange: number;
  atkSpeed: number;
  atkTimer: number;
  skillTimer: number;
  activeSkillCd: number;
  stunTimer: number;
  flashTimer?: number;
  flashColor?: string;
  speed: number;
  color: string;
  classType?: string;
  isHealer?: boolean;
  critChance: number;
  critMult: number;
  lifesteal?: number;
  reflect?: number;
  // stats for recap
  damageDealt?: number;
  healingDone?: number;
  damageTaken?: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  isCrit?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export interface Projectile {
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  color: string;
  life: number;
}

// 1. UPDATE UNIT PHYSICS AND SEPARATION STEERING
export const updateUnitPhysics = (
  unit: CombatUnit,
  target: { x: number; y: number },
  allies: CombatUnit[],
  dt: number,
  canvasWidth = 1200,
  canvasHeight = 600
) => {
  let steerX = 0;
  let steerY = 0;

  // Collision separation from other allies
  allies.forEach(other => {
    if (other.id !== unit.id && other.hp > 0) {
      const oDist = getDistance(unit, other);
      const separationRadius = unit.isPlayer ? 22 : 25;
      if (oDist < separationRadius && oDist > 0) {
        const dir = getDirection(other, unit);
        steerX += dir.x * (unit.isPlayer ? 20 : 30) * dt;
        steerY += dir.y * (unit.isPlayer ? 20 : 30) * dt;
      }
    }
  });

  // Move unit towards target
  const nextPos = seek(unit, target, unit.speed, dt);
  
  // Clamp boundaries to fit resolution
  unit.x = Math.max(25, Math.min(canvasWidth - 25, nextPos.x + steerX));
  unit.y = Math.max(25, Math.min(canvasHeight - 25, nextPos.y + steerY));
};

// 2. HELPER TO CREATE PARTICLES
export const createExplosion = (
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count = 12
) => {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      size: 1.5 + Math.random() * 2,
      alpha: 1.0,
      life: 20 + Math.floor(Math.random() * 20)
    });
  }
};

// 3. EXECUTE BASIC ATTACKS (AND CALCULATE HEALING / DAMAGE / LIFESTEAL / REFLECT)
export const performBasicAttack = (
  attacker: CombatUnit,
  target: CombatUnit,
  _dt: number,
  recapStats: {
    shakeTimer: number;
    shakeIntensity: number;
    playerDamageDealt?: number;
    playerDamageTaken?: number;
    playerHealingDone?: number;
  },
  projectiles: Projectile[],
  floatingTexts: FloatingText[],
  particles: Particle[],
  defScale = 0.1
) => {
  attacker.atkTimer = 1.0 / attacker.atkSpeed;

  if (attacker.isHealer && target.isPlayer) {
    // Healing action (Cleric target healing allies)
    const isCrit = Math.random() < attacker.critChance;
    const finalHeal = Math.round(attacker.attackPower * (isCrit ? attacker.critMult : 1.0) * 0.8);
    
    target.hp = Math.min(target.maxHp, target.hp + finalHeal);
    attacker.healingDone = (attacker.healingDone || 0) + finalHeal;
    recapStats.playerHealingDone = (recapStats.playerHealingDone || 0) + finalHeal;
    
    target.flashTimer = 0.1;
    target.flashColor = '#ffcc00';

    projectiles.push({ fx: attacker.x, fy: attacker.y, tx: target.x, ty: target.y, color: '#ffcc00', life: 8 });
    floatingTexts.push({ x: target.x, y: target.y - 12, text: `+${finalHeal}`, color: '#ffcc00', life: 40 });
    createExplosion(particles, target.x, target.y, '#ffcc00', 8);
  } else {
    // Damage action
    const isCrit = Math.random() < attacker.critChance;
    const rawDmg = attacker.attackPower * (isCrit ? attacker.critMult : 1.0);
    const finalDmg = Math.max(1, Math.round(rawDmg - target.defense * defScale));

    target.hp = Math.max(0, target.hp - finalDmg);
    target.flashTimer = 0.1;
    target.flashColor = target.isPlayer ? '#ffffff' : '#ff3b30';

    if (isCrit) {
      recapStats.shakeTimer = 0.15;
      recapStats.shakeIntensity = 6;
    }

    if (attacker.isPlayer) {
      attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
      recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + finalDmg;
    } else {
      attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
      target.damageTaken = (target.damageTaken || 0) + finalDmg;
      recapStats.playerDamageTaken = (recapStats.playerDamageTaken || 0) + finalDmg;
    }

    // Push laser visual effect
    projectiles.push({ fx: attacker.x, fy: attacker.y, tx: target.x, ty: target.y, color: attacker.color, life: 6 });
    floatingTexts.push({
      x: target.x + (Math.random() * 40 - 20),
      y: target.y - 20 - (Math.random() * 20),
      text: `${finalDmg}`,
      color: isCrit ? '#ff9500' : '#ffffff',
      life: 45,
      isCrit
    });
    createExplosion(particles, target.x, target.y, attacker.color, 12);

    // Apply lifesteal
    if (attacker.lifesteal && attacker.lifesteal > 0) {
      const heal = Math.round(finalDmg * attacker.lifesteal);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      attacker.flashTimer = 0.1;
      attacker.flashColor = '#34c759';
      attacker.healingDone = (attacker.healingDone || 0) + heal;
      recapStats.playerHealingDone = (recapStats.playerHealingDone || 0) + heal;
    }

    // Apply reflect damage
    if (target.reflect && target.reflect > 0) {
      const refl = Math.round(finalDmg * target.reflect);
      attacker.hp = Math.max(0, attacker.hp - refl);
      attacker.flashTimer = 0.1;
      attacker.flashColor = '#af52de';
      
      if (target.isPlayer) {
        target.damageDealt = (target.damageDealt || 0) + refl;
        recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + refl;
      } else {
        target.damageDealt = (target.damageDealt || 0) + refl;
        attacker.damageTaken = (attacker.damageTaken || 0) + refl;
        recapStats.playerDamageTaken = (recapStats.playerDamageTaken || 0) + refl;
      }
      
      floatingTexts.push({ x: attacker.x, y: attacker.y - 12, text: `${refl} (Reflect)`, color: '#af52de', life: 40 });
      createExplosion(particles, attacker.x, attacker.y, '#af52de', 8);
    }
  }
};

// 4. CAST ACTIVE CAPABILITY / SKILLS
export const castActiveSkill = (
  attacker: CombatUnit,
  target: CombatUnit,
  allies: CombatUnit[],
  enemies: CombatUnit[],
  recapStats: {
    shakeTimer: number;
    shakeIntensity: number;
    playerDamageDealt?: number;
    playerHealingDone?: number;
  },
  _projectiles: Projectile[],
  floatingTexts: FloatingText[],
  particles: Particle[],
  _defScale = 0.1
) => {
  attacker.skillTimer = attacker.activeSkillCd;
  createExplosion(particles, attacker.x, attacker.y, '#ffffff', 20);

  const classType = attacker.classType || 'WARRIOR';

  if (classType === 'WARRIOR') {
    // Shield bash: stun target
    target.stunTimer = 1.5;
    const dmg = Math.round(attacker.attackPower * 2.0);
    target.hp = Math.max(0, target.hp - dmg);
    target.flashTimer = 0.1;
    target.flashColor = '#ffffff';

    recapStats.shakeTimer = 0.25;
    recapStats.shakeIntensity = 8;
    
    if (attacker.isPlayer) {
      attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
      recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + dmg;
    } else {
      attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
      target.damageTaken = (target.damageTaken || 0) + dmg;
    }

    floatingTexts.push({
      x: target.x,
      y: target.y - 20,
      text: `${dmg} (Shield Bash Stun!)`,
      color: '#ff3b30',
      life: 50,
      isCrit: true
    });
    createExplosion(particles, target.x, target.y, '#ffffff', 20);

  } else if (classType === 'MAGE') {
    // Fireball AoE
    const dmg = Math.round(attacker.attackPower * 2.5);
    target.hp = Math.max(0, target.hp - dmg);
    target.flashTimer = 0.1;
    target.flashColor = '#ff9500';

    recapStats.shakeTimer = 0.35;
    recapStats.shakeIntensity = 10;

    if (attacker.isPlayer) {
      attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
      recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + dmg;
    } else {
      attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
      target.damageTaken = (target.damageTaken || 0) + dmg;
    }

    floatingTexts.push({
      x: target.x,
      y: target.y - 25,
      text: `${dmg} (Fireball AoE)`,
      color: '#00d8ff',
      life: 50,
      isCrit: true
    });
    createExplosion(particles, target.x, target.y, '#ff9500', 30);

    // Blast nearby targets
    enemies.forEach(e => {
      if (e.id !== target.id && e.hp > 0 && getDistance(target, e) < 100) {
        const spl = Math.round(dmg * 0.6);
        e.hp = Math.max(0, e.hp - spl);
        e.flashTimer = 0.1;
        e.flashColor = '#ff9500';

        if (attacker.isPlayer) {
          attacker.damageDealt = (attacker.damageDealt || 0) + spl;
          recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + spl;
        } else {
          attacker.damageDealt = (attacker.damageDealt || 0) + spl;
          e.damageTaken = (e.damageTaken || 0) + spl;
        }

        floatingTexts.push({ x: e.x, y: e.y - 15, text: `${spl}`, color: '#00d8ff', life: 40 });
        createExplosion(particles, e.x, e.y, '#ff9500', 10);
      }
    });

  } else if (classType === 'CLERIC') {
    // Holy Nova: heal all living allies, damage adjacent enemies
    const heal = Math.round(attacker.attackPower * 3.0); // clergy stats
    allies.forEach(pl => {
      if (pl.hp <= 0) return;
      pl.hp = Math.min(pl.maxHp, pl.hp + heal);
      pl.flashTimer = 0.15;
      pl.flashColor = '#ffcc00';

      attacker.healingDone = (attacker.healingDone || 0) + heal;
      recapStats.playerHealingDone = (recapStats.playerHealingDone || 0) + heal;
      floatingTexts.push({ x: pl.x, y: pl.y - 12, text: `+${heal}`, color: '#ffcc00', life: 40 });
      createExplosion(particles, pl.x, pl.y, '#ffcc00', 8);
    });

    const dmg = Math.round(attacker.attackPower * 1.5);
    recapStats.shakeTimer = 0.15;
    recapStats.shakeIntensity = 4;
    createExplosion(particles, attacker.x, attacker.y, '#ffcc00', 25);

    enemies.forEach(e => {
      if (e.hp > 0 && getDistance(attacker, e) < 140) {
        e.hp = Math.max(0, e.hp - dmg);
        e.flashTimer = 0.1;
        e.flashColor = '#ffcc00';

        if (attacker.isPlayer) {
          attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
          recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + dmg;
        } else {
          attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
          e.damageTaken = (e.damageTaken || 0) + dmg;
        }

        floatingTexts.push({ x: e.x, y: e.y - 15, text: `${dmg}`, color: '#ffcc00', life: 40 });
        createExplosion(particles, e.x, e.y, '#ffcc00', 12);
      }
    });

  } else if (classType === 'ROGUE') {
    // Blade Dance: multi hit
    const dmg = Math.round(attacker.attackPower * 0.7);
    for (let strike = 0; strike < 5; strike++) {
      setTimeout(() => {
        if (target && target.hp > 0) {
          target.hp = Math.max(0, target.hp - dmg);
          target.flashTimer = 0.08;
          target.flashColor = '#af52de';
          
          recapStats.shakeTimer = 0.12;
          recapStats.shakeIntensity = 4;

          if (attacker.isPlayer) {
            attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
            recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + dmg;
          } else {
            attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
            target.damageTaken = (target.damageTaken || 0) + dmg;
          }

          floatingTexts.push({
            x: target.x + (Math.random() * 40 - 20),
            y: target.y - 15,
            text: `${dmg}`,
            color: '#af52de',
            life: 35
          });
          createExplosion(particles, target.x, target.y, '#af52de', 10);
        }
      }, strike * 100);
    }

  } else if (classType === 'RANGER') {
    // Arrow Rain AoE
    const dmg = Math.round(attacker.attackPower * 1.8);
    recapStats.shakeTimer = 0.25;
    recapStats.shakeIntensity = 7;

    enemies.forEach(e => {
      if (e.hp > 0 && getDistance(target, e) < 80) {
        e.hp = Math.max(0, e.hp - dmg);
        e.flashTimer = 0.1;
        e.flashColor = '#34c759';

        if (attacker.isPlayer) {
          attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
          recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + dmg;
        } else {
          attacker.damageDealt = (attacker.damageDealt || 0) + dmg;
          e.damageTaken = (e.damageTaken || 0) + dmg;
        }

        floatingTexts.push({
          x: e.x,
          y: e.y - 15,
          text: `${dmg} (Arrow Rain)`,
          color: '#34c759',
          life: 45
        });
        createExplosion(particles, e.x, e.y, '#34c759', 20);
      }
    });
  }
};

// 5. UPDATE GRAPHICAL/VISUAL LISTS EACH FRAME
export const updateVisuals = (
  projectiles: Projectile[],
  damageTexts: FloatingText[],
  particles: Particle[],
  _dt: number
) => {
  // Update projectiles
  projectiles.forEach(p => {
    if (p.life > 0) p.life -= 1;
  });

  // Update floating texts
  damageTexts.forEach(ft => {
    if (ft.life > 0) {
      ft.y -= 0.6; // float upwards
      ft.life -= 1;
    }
  });

  // Update particles
  particles.forEach(p => {
    if (p.life > 0) {
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95; // apply drag
      p.vy *= 0.95;
      p.alpha -= 0.015; // fade out
      p.life -= 1;
    }
  });
};
