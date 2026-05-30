import { seek, getDistance, getDirection } from './physics';
import { soundManager } from './soundManager';

export const accumulateStagger = (target: CombatUnit, amount: number, floatingTexts: FloatingText[]) => {
  if (target.id === 'boss' && !(target as any).staggered) {
    (target as any).stagger = Math.min((target as any).maxStagger || 150, ((target as any).stagger || 0) + amount);
    if ((target as any).stagger >= ((target as any).maxStagger || 150)) {
      (target as any).staggered = true;
      (target as any).staggerTimer = 4.0;
      target.stunTimer = 4.0;
      floatingTexts.push({
        x: target.x,
        y: target.y - 45,
        text: '⚡ BOSS STAGGERED! 2x DMG! ⚡',
        color: '#facc15',
        life: 70,
        isCrit: true
      });
    }
  }
};

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
  selectedTalents?: string[];
  fireRes?: number;
  coldRes?: number;
  poisonRes?: number;
  physRes?: number;
  spriteType?: string;
  healPower?: number;
  lagHp?: number;
  level?: number;
  stagger?: number;
  maxStagger?: number;
  staggered?: boolean;
  staggerTimer?: number;
  wasStaggeredPrev?: boolean;
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

export const getUnitDamageTheme = (spriteName: string): 'PHYSICAL' | 'SNAKE' | 'LICH' | 'DRAGON' => {
  const name = spriteName.toUpperCase();
  if (name.includes('ADDER') || name.includes('VIPER') || name.includes('COBRA') || name.includes('MAMBA') || name.includes('SNAKE')) {
    return 'SNAKE'; // 50% Poison, 50% Phys
  }
  if (name.includes('LICH') || name.includes('SKELETAL') || name.includes('WIGHT') || name.includes('MUMMY') || name.includes('FROST')) {
    return 'LICH'; // 100% Cold
  }
  if (name.includes('DRAGON') || name.includes('DRAKE') || name.includes('WYVERN') || name.includes('HATCHLING') || name.includes('SOVEREIGN')) {
    return 'DRAGON'; // 30% Phys, 70% Fire
  }
  return 'PHYSICAL'; // 100% Physical
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
    const finalHeal = Math.round(attacker.attackPower * (isCrit ? attacker.critMult : 1.0) * 0.4);
    
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
    if (isCrit) {
      soundManager.playCrit();
    } else {
      soundManager.playHit();
    }
    const rawDmg = attacker.attackPower * (isCrit ? attacker.critMult : 1.0);
    let finalDmg = Math.max(1, Math.round(rawDmg - (target.defense || 0) * defScale));

    if (target.isPlayer && !attacker.isPlayer) {
      const theme = attacker.spriteType || attacker.classType || 'GOBLIN_SCOUT';
      const dmgTheme = getUnitDamageTheme(theme);
      let physPortion = 1.0;
      let firePortion = 0.0;
      let coldPortion = 0.0;
      let poisonPortion = 0.0;

      if (dmgTheme === 'SNAKE') {
        physPortion = 0.5;
        poisonPortion = 0.5;
      } else if (dmgTheme === 'LICH') {
        physPortion = 0.0;
        coldPortion = 1.0;
      } else if (dmgTheme === 'DRAGON') {
        physPortion = 0.3;
        firePortion = 0.7;
      }

      const physRes = target.physRes || 0;
      const fireRes = target.fireRes || 0;
      const coldRes = target.coldRes || 0;
      const poisonRes = target.poisonRes || 0;

      const reducedPhys = finalDmg * physPortion * (1 - physRes);
      const reducedFire = finalDmg * firePortion * (1 - fireRes);
      const reducedCold = finalDmg * coldPortion * (1 - coldRes);
      const reducedPoison = finalDmg * poisonPortion * (1 - poisonRes);

      finalDmg = Math.max(1, Math.round(reducedPhys + reducedFire + reducedCold + reducedPoison));
    }

    if ((target as any).staggered) {
      finalDmg *= 2;
    }

    target.hp = Math.max(0, target.hp - finalDmg);
    if (target.id === 'boss') {
      accumulateStagger(target, isCrit ? 15 : 4, floatingTexts);
    }
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
      const refl = Math.round(rawDmg * target.reflect);
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
  soundManager.playSkill();
  createExplosion(particles, attacker.x, attacker.y, '#ffffff', 20);

  const classType = attacker.classType || 'WARRIOR';
  const talentsList = attacker.selectedTalents || [];

  if (classType === 'WARRIOR') {
    // Shield bash: stun target
    let stunDuration = 1.5;
    if (talentsList.includes('t1_2')) stunDuration += 0.5;
    if (talentsList.includes('t5_2')) stunDuration += 1.0;
    if (talentsList.includes('t10_1')) stunDuration += 0.5;

    let dmgFactor = 2.3;
    if (talentsList.includes('t2_1')) dmgFactor += 0.3; // +30% damage
    if (talentsList.includes('t5_1') && attacker.hp / attacker.maxHp < 0.5) dmgFactor += 0.5; // +50% damage low health
    if (talentsList.includes('t8_1')) dmgFactor += 0.6; // +60% damage
    if (talentsList.includes('t10_2')) dmgFactor += 1.5; // +150% damage

    let dmg = Math.round(attacker.attackPower * dmgFactor);
    
    // Sundering Slam
    if (talentsList.includes('t2_2')) {
      target.defense = Math.max(0, (target.defense || 0) - 10);
    }
    
    // Staggering Blow
    if (talentsList.includes('t9_2')) {
      dmg = Math.round(dmg * 1.2);
    }

    target.stunTimer = stunDuration;
    if ((target as any).staggered) {
      dmg *= 2;
    }
    target.hp = Math.max(0, target.hp - dmg);
    if (target.id === 'boss') {
      accumulateStagger(target, 25, floatingTexts);
    }
    target.flashTimer = 0.1;
    target.flashColor = '#ffffff';

    let shake = talentsList.includes('t10_2') ? 12 : 8;
    recapStats.shakeTimer = talentsList.includes('t10_2') ? 0.4 : 0.25;
    recapStats.shakeIntensity = shake;

    // Shield Barrier (acts as heal for 15% Max HP)
    if (talentsList.includes('t3_1')) {
      const shieldHeal = Math.round(attacker.maxHp * 0.15);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + shieldHeal);
      floatingTexts.push({ x: attacker.x, y: attacker.y - 12, text: `+${shieldHeal} (Barrier)`, color: '#eab308', life: 40 });
    }

    // Vampiric Bash (heals for 50% damage dealt)
    if (talentsList.includes('t6_1')) {
      const vHeal = Math.round(dmg * 0.5);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + vHeal);
      floatingTexts.push({ x: attacker.x, y: attacker.y - 20, text: `+${vHeal} (Lifesteal)`, color: '#10b981', life: 40 });
    }

    // Perfect Guard
    if (talentsList.includes('t7_2')) {
      attacker.defense = (attacker.defense || 0) + 8;
    }

    // Crystalline Bash (30% chance to reset cooldown)
    if (talentsList.includes('t9_1') && Math.random() < 0.3) {
      attacker.skillTimer = 0;
      floatingTexts.push({ x: attacker.x, y: attacker.y - 25, text: `RESET!`, color: '#38bdf8', life: 40 });
    }

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

    // Stun Blast & Sonic Shock (AoE blasts)
    const hasStunBlast = talentsList.includes('t3_2');
    const hasSonicShock = talentsList.includes('t7_1');
    if (hasStunBlast || hasSonicShock) {
      const radius = hasStunBlast ? 60 : 80;
      enemies.forEach(e => {
        if (e.id !== target.id && e.hp > 0 && getDistance(target, e) < radius) {
          const extraDmg = hasStunBlast ? Math.round(dmg * 0.4) : 0;
          if (extraDmg > 0) {
            e.hp = Math.max(0, e.hp - extraDmg);
            createExplosion(particles, e.x, e.y, '#ffffff', 8);
            floatingTexts.push({ x: e.x, y: e.y - 12, text: `${extraDmg}`, color: '#ff3b30', life: 40 });
          }
          if (hasSonicShock) {
            e.stunTimer = 0.8;
            floatingTexts.push({ x: e.x, y: e.y - 20, text: `Stunned!`, color: '#38bdf8', life: 40 });
          }
        }
      });
    }

    // Echoing Shock (second shockwave for 50% damage after 0.5s)
    if (talentsList.includes('t4_1')) {
      setTimeout(() => {
        if (target && target.hp > 0) {
          const echoDmg = Math.round(dmg * 0.5);
          target.hp = Math.max(0, target.hp - echoDmg);
          target.flashTimer = 0.08;
          target.flashColor = '#ffffff';
          createExplosion(particles, target.x, target.y, '#ffffff', 10);
          floatingTexts.push({ x: target.x, y: target.y - 20, text: `${echoDmg} (Echo)`, color: '#ff3b30', life: 35 });
        }
      }, 500);
    }

  } else if (classType === 'MAGE') {
    // Fireball AoE
    let dmgFactor = 2.1;
    if (talentsList.includes('t2_1')) dmgFactor += 0.15; // +15%
    if (talentsList.includes('t5_1')) dmgFactor += 0.20; // +20%
    if (talentsList.includes('t8_1')) dmgFactor += 0.15; // +15%
    if (talentsList.includes('t10_1')) dmgFactor += 0.80; // +80%

    let rangeRadius = 55;
    if (talentsList.includes('t1_2')) rangeRadius += 15;
    if (talentsList.includes('t3_2')) rangeRadius += 30;
    if (talentsList.includes('t8_1')) rangeRadius += 50;

    let dmg = Math.round(attacker.attackPower * dmgFactor);
    if ((target as any).staggered) {
      dmg *= 2;
    }
    
    // Ignore Defense (Meltdown)
    let ignoreDefFactor = 0.1; // default scale
    if (talentsList.includes('t4_2')) {
      ignoreDefFactor = 0.07; // ignore 30% of defense
    }

    target.hp = Math.max(0, target.hp - Math.round(dmg - (target.defense || 0) * ignoreDefFactor));
    if (target.id === 'boss') {
      accumulateStagger(target, 25, floatingTexts);
    }
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

    // Flame Shield
    if (talentsList.includes('t8_2')) {
      attacker.defense = (attacker.defense || 0) + 12;
    }

    // Cauterize (heals you for 25% of damage dealt to primary target)
    if (talentsList.includes('t5_2')) {
      const cHeal = Math.round(dmg * 0.25);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + cHeal);
      floatingTexts.push({ x: attacker.x, y: attacker.y - 15, text: `+${cHeal}`, color: '#10b981', life: 40 });
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

    // Ignite (burn patch DoT)
    if (talentsList.includes('t2_2')) {
      setTimeout(() => {
        if (target && target.hp > 0) {
          const burnDmg = Math.round(attacker.attackPower * 0.45);
          target.hp = Math.max(0, target.hp - burnDmg);
          floatingTexts.push({ x: target.x, y: target.y - 12, text: `${burnDmg} (Ignite)`, color: '#ef4444', life: 35 });
        }
      }, 1000);
    }

    // Blast wave stun
    if (talentsList.includes('t3_1')) {
      target.stunTimer = 0.8;
    }

    // Blast nearby targets
    const splashFactor = talentsList.includes('t6_2') ? 0.65 : 0.3;
    enemies.forEach(e => {
      if (e.id !== target.id && e.hp > 0 && getDistance(target, e) < rangeRadius) {
        const spl = Math.round(dmg * splashFactor);
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

        // Living Bomb (explode for 40% after 1.5s)
        if (talentsList.includes('t7_1')) {
          setTimeout(() => {
            if (e.hp > 0) {
              const bombDmg = Math.round(dmg * 0.4);
              e.hp = Math.max(0, e.hp - bombDmg);
              floatingTexts.push({ x: e.x, y: e.y - 20, text: `${bombDmg} (Living Bomb)`, color: '#ef4444', life: 35 });
              createExplosion(particles, e.x, e.y, '#ff9500', 12);
            }
          }, 1500);
        }
      }
    });

    // Double Cast
    if (talentsList.includes('t4_1') && Math.random() < 0.25) {
      setTimeout(() => {
        if (target && target.hp > 0) {
          const secondDmg = Math.round(dmg * 0.8);
          target.hp = Math.max(0, target.hp - secondDmg);
          floatingTexts.push({ x: target.x, y: target.y - 12, text: `${secondDmg} (Double)`, color: '#00d8ff', life: 35 });
        }
      }, 300);
    }
    
    // Meteor Shower (split fireballs targets adjacent enemies)
    if (talentsList.includes('t9_2')) {
      const extraTargets = enemies.filter(e => e.id !== target.id && e.hp > 0).slice(0, 2);
      extraTargets.forEach(e => {
        const extraDmg = Math.round(dmg * 0.5);
        e.hp = Math.max(0, e.hp - extraDmg);
        floatingTexts.push({ x: e.x, y: e.y - 12, text: `${extraDmg} (Split)`, color: '#ff9500', life: 35 });
        createExplosion(particles, e.x, e.y, '#ff9500', 8);
      });
    }

  } else if (classType === 'CLERIC') {
    // Holy Nova: heal all living allies, damage adjacent enemies
    let healFactor = 1.5;
    if (talentsList.includes('t2_1')) healFactor += 0.375; // +25%
    if (talentsList.includes('t4_2')) healFactor -= 0.30; // -20%
    if (talentsList.includes('t5_2')) healFactor += 0.60; // +40%
    if (talentsList.includes('t10_1')) healFactor += 0.75; // +50%

    let dmgFactor = 1.5;
    if (talentsList.includes('t2_2')) dmgFactor += 0.60; // +40%
    if (talentsList.includes('t4_2')) dmgFactor += 0.75; // +50%
    if (talentsList.includes('t5_2')) dmgFactor -= 0.30; // -20%
    if (talentsList.includes('t10_1')) dmgFactor += 0.75; // +50%

    let areaRadius = 140;
    if (talentsList.includes('t1_2')) areaRadius += 30;

    const heal = Math.round(attacker.attackPower * healFactor);
    
    allies.forEach(pl => {
      if (pl.hp <= 0) return;
      pl.hp = Math.min(pl.maxHp, pl.hp + heal);
      pl.flashTimer = 0.15;
      pl.flashColor = '#ffcc00';

      attacker.healingDone = (attacker.healingDone || 0) + heal;
      recapStats.playerHealingDone = (recapStats.playerHealingDone || 0) + heal;
      floatingTexts.push({ x: pl.x, y: pl.y - 12, text: `+${heal}`, color: '#ffcc00', life: 40 });
      createExplosion(particles, pl.x, pl.y, '#ffcc00', 8);

      // Grace Shield
      if (talentsList.includes('t3_1')) {
        const shieldVal = Math.round(pl.maxHp * 0.15);
        pl.hp = Math.min(pl.maxHp, pl.hp + shieldVal);
        floatingTexts.push({ x: pl.x, y: pl.y - 20, text: `+${shieldVal} (Shield)`, color: '#facc15', life: 40 });
      }
    });

    const dmg = Math.round(attacker.attackPower * dmgFactor);
    recapStats.shakeTimer = 0.15;
    recapStats.shakeIntensity = 4;
    createExplosion(particles, attacker.x, attacker.y, '#ffcc00', 25);

    // Devotion Aura
    if (talentsList.includes('t7_2')) {
      allies.forEach(pl => {
        if (pl.hp > 0) pl.defense = (pl.defense || 0) + 6;
      });
    }

    enemies.forEach(e => {
      if (e.hp > 0 && getDistance(attacker, e) < areaRadius) {
        let finalDmg = dmg;
        if ((e as any).staggered) {
          finalDmg *= 2;
        }
        e.hp = Math.max(0, e.hp - finalDmg);
        if (e.id === 'boss') {
          accumulateStagger(e, 25, floatingTexts);
        }
        e.flashTimer = 0.1;
        e.flashColor = '#ffcc00';

        if (attacker.isPlayer) {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
          recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + finalDmg;
        } else {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
          e.damageTaken = (e.damageTaken || 0) + finalDmg;
        }

        floatingTexts.push({ x: e.x, y: e.y - 15, text: `${finalDmg}`, color: '#ffcc00', life: 40 });
        createExplosion(particles, e.x, e.y, '#ffcc00', 12);

        // Blinding Nova stun
        if (talentsList.includes('t3_2')) {
          e.stunTimer = 0.8;
        }

        // Purifying Fire DoT
        if (talentsList.includes('t7_1')) {
          setTimeout(() => {
            if (e.hp > 0) {
              const burnVal = Math.round(heal * 0.3); // 10% x 3s
              e.hp = Math.max(0, e.hp - burnVal);
              floatingTexts.push({ x: e.x, y: e.y - 12, text: `${burnVal} (Nova Burn)`, color: '#f59e0b', life: 35 });
            }
          }, 1000);
        }
      }
    });

    // Resplendent Nova double cast
    if (talentsList.includes('t6_1') && Math.random() < 0.2) {
      setTimeout(() => {
        allies.forEach(pl => {
          if (pl.hp > 0) {
            const secondHeal = Math.round(heal * 0.4);
            pl.hp = Math.min(pl.maxHp, pl.hp + secondHeal);
            floatingTexts.push({ x: pl.x, y: pl.y - 12, text: `+${secondHeal}`, color: '#ffcc00', life: 30 });
          }
        });
      }, 350);
    }

  } else if (classType === 'ROGUE') {
    // Blade Dance: multi hit
    let strikes = 5;
    if (talentsList.includes('t1_1')) strikes += 1;
    if (talentsList.includes('t5_1')) strikes += 2; // Thousand Blades (7 strikes)
    if (talentsList.includes('t10_1')) strikes += 3; // Death Blossom (8 strikes)

    let dmgFactor = 0.7;
    if (talentsList.includes('t2_1')) dmgFactor += 0.07; // +10%
    if (talentsList.includes('t5_1')) dmgFactor -= 0.10; // -15% strength
    if (talentsList.includes('t7_1')) dmgFactor += 0.15; // +20%
    if (talentsList.includes('t10_2')) dmgFactor += 0.14; // +20%

    let baseDmg = Math.round(attacker.attackPower * dmgFactor);
    
    // Blade Mastery critical strike multiplier (+40% crit mult)
    let isCrit = Math.random() < attacker.critChance;
    if (talentsList.includes('t4_1')) {
      isCrit = Math.random() < (attacker.critChance + 0.15);
    }
    const mult = isCrit ? (attacker.critMult + (talentsList.includes('t9_1') ? 0.4 : 0)) : 1.0;
    let finalStrikeDmg = Math.round(baseDmg * mult);

    for (let strike = 0; strike < strikes; strike++) {
      setTimeout(() => {
        if (target && target.hp > 0) {
          let strikeDmg = finalStrikeDmg;

          // Assassinate (+40% damage to targets below 50% HP)
          if (talentsList.includes('t5_2') && target.hp / target.maxHp < 0.5) {
            strikeDmg = Math.round(strikeDmg * 1.4);
          }

          if ((target as any).staggered) {
            strikeDmg *= 2;
          }

          target.hp = Math.max(0, target.hp - strikeDmg);
          if (target.id === 'boss') {
            accumulateStagger(target, 5, floatingTexts);
          }
          target.flashTimer = 0.08;
          target.flashColor = '#af52de';
          
          recapStats.shakeTimer = 0.12;
          recapStats.shakeIntensity = 4;

          if (attacker.isPlayer) {
            attacker.damageDealt = (attacker.damageDealt || 0) + strikeDmg;
            recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + strikeDmg;
          } else {
            attacker.damageDealt = (attacker.damageDealt || 0) + strikeDmg;
            target.damageTaken = (target.damageTaken || 0) + strikeDmg;
          }

          floatingTexts.push({
            x: target.x + (Math.random() * 40 - 20),
            y: target.y - 15,
            text: `${strikeDmg}`,
            color: '#af52de',
            life: 35
          });
          createExplosion(particles, target.x, target.y, '#af52de', 10);

          // Lifesteal Cuts (+15% lifesteal)
          if (talentsList.includes('t3_1')) {
            const ls = Math.round(strikeDmg * 0.15);
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + ls);
          }

          // Staggering Cut (stun 0.2s)
          if (talentsList.includes('t4_2')) {
            target.stunTimer = 0.2;
          }

          // Poison Blades
          if (talentsList.includes('t1_2') && strike === strikes - 1) {
            setTimeout(() => {
              if (target && target.hp > 0) {
                target.hp = Math.max(0, target.hp - 20);
                floatingTexts.push({ x: target.x, y: target.y - 20, text: `20 (Poison)`, color: '#a855f7', life: 35 });
              }
            }, 1000);
          }

          // Serrated Edge bleed
          if (talentsList.includes('t8_2') && strike === strikes - 1) {
            setTimeout(() => {
              if (target && target.hp > 0) {
                const bleed = Math.round(strikeDmg * 0.25);
                target.hp = Math.max(0, target.hp - bleed);
                floatingTexts.push({ x: target.x, y: target.y - 25, text: `${bleed} (Bleed)`, color: '#b91c1c', life: 35 });
              }
            }, 800);
          }
        }
      }, strike * 100);
    }

  } else if (classType === 'RANGER') {
    // Arrow Rain AoE
    let dmgFactor = 1.8;
    if (talentsList.includes('t2_1')) dmgFactor += 0.15; // +15%
    if (talentsList.includes('t5_2')) dmgFactor += 0.20; // +20%
    if (talentsList.includes('t6_1')) dmgFactor += 0.15; // +15%
    if (talentsList.includes('t8_2')) dmgFactor += 0.25; // +25%
    if (talentsList.includes('t10_1')) dmgFactor += 0.80; // +80%

    let rangeRadius = 80;
    if (talentsList.includes('t2_2')) rangeRadius += 30;

    const dmg = Math.round(attacker.attackPower * dmgFactor);
    recapStats.shakeTimer = 0.25;
    recapStats.shakeIntensity = 7;

    const hasPinning = talentsList.includes('t3_1');
    const hasThunder = talentsList.includes('t8_1');
    const hasGodBow = talentsList.includes('t10_1');

    enemies.forEach(e => {
      if (e.hp > 0 && getDistance(target, e) < rangeRadius) {
        let eDmg = dmg;
        
        // Piercing Volley (ignores 25% defense)
        let ignoreFactor = 0.1;
        if (talentsList.includes('t4_2')) {
          ignoreFactor = 0.075;
        }

        let finalDmg = Math.max(1, Math.round(eDmg - (e.defense || 0) * ignoreFactor));
        if ((e as any).staggered) {
          finalDmg *= 2;
        }
        e.hp = Math.max(0, e.hp - finalDmg);
        if (e.id === 'boss') {
          accumulateStagger(e, 25, floatingTexts);
        }
        e.flashTimer = 0.1;
        e.flashColor = '#34c759';

        if (attacker.isPlayer) {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
          recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + finalDmg;
        } else {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
          e.damageTaken = (e.damageTaken || 0) + finalDmg;
        }

        floatingTexts.push({
          x: e.x,
          y: e.y - 15,
          text: `${finalDmg} (Arrow Rain)`,
          color: '#34c759',
          life: 45
        });
        createExplosion(particles, e.x, e.y, '#34c759', 20);

        // Stun effects
        if (hasThunder) {
          e.stunTimer = 0.8;
        } else if (hasPinning && Math.random() < 0.2) {
          e.stunTimer = 1.0;
          floatingTexts.push({ x: e.x, y: e.y - 20, text: `Pinned!`, color: '#38bdf8', life: 35 });
        } else if (hasGodBow) {
          e.stunTimer = 0.5;
        }

        // Poison Tips DoT
        if (talentsList.includes('t4_1')) {
          setTimeout(() => {
            if (e.hp > 0) {
              e.hp = Math.max(0, e.hp - 24);
              floatingTexts.push({ x: e.x, y: e.y - 20, text: `24 (Poison)`, color: '#a855f7', life: 35 });
            }
          }, 1000);
        }

        // Caltrop Rain
        if (talentsList.includes('t9_2')) {
          setTimeout(() => {
            if (e.hp > 0) {
              e.hp = Math.max(0, e.hp - 20);
              floatingTexts.push({ x: e.x, y: e.y - 12, text: `20 (Caltrops)`, color: '#94a3b8', life: 30 });
            }
          }, 500);
        }
      }
    });
  } else if (classType === 'VALKYRIE') {
    // Spear of Light: deals 200% holy line damage and heals caster for 200% heal power
    let dmgFactor = 1.3;
    if (talentsList.includes('t2_1')) dmgFactor += 0.1;
    if (talentsList.includes('t5_2')) dmgFactor += 0.15;
    if (talentsList.includes('t10_1')) dmgFactor += 0.5;

    let healFactor = 2.0;
    if (talentsList.includes('t2_2')) healFactor += 0.5;
    if (talentsList.includes('t6_1')) healFactor += 0.6;
    if (talentsList.includes('t10_1')) healFactor += 1.0;

    const dmg = Math.round(attacker.attackPower * dmgFactor);
    const heal = Math.round((attacker.healPower || 15) * healFactor);

    // Deal line damage
    enemies.forEach(e => {
      if (e.hp > 0 && getDistance(target, e) < 55) {
        let finalDmg = dmg;
        if (talentsList.includes('t7_1')) {
          finalDmg = Math.round(finalDmg * 1.15);
        }
        if ((e as any).staggered) {
          finalDmg *= 2;
        }
        e.hp = Math.max(0, e.hp - finalDmg);
        if (e.id === 'boss') {
          accumulateStagger(e, 25, floatingTexts);
        }
        e.flashTimer = 0.1;
        e.flashColor = '#ff0055';
        floatingTexts.push({ x: e.x, y: e.y - 15, text: `${finalDmg}`, color: '#ff0055', life: 40 });
        createExplosion(particles, e.x, e.y, '#ff0055', 10);

        if (talentsList.includes('t8_2')) {
          e.stunTimer = 1.2;
        } else if (talentsList.includes('t3_2') && Math.random() < 0.3) {
          e.stunTimer = 1.0;
        }

        if (attacker.isPlayer) {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
          recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + finalDmg;
        } else {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
        }
      }
    });

    // Caster heal
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
    attacker.flashTimer = 0.1;
    attacker.flashColor = '#34c759';
    attacker.healingDone = (attacker.healingDone || 0) + heal;
    recapStats.playerHealingDone = (recapStats.playerHealingDone || 0) + heal;
    floatingTexts.push({ x: attacker.x, y: attacker.y - 12, text: `+${heal}`, color: '#34c759', life: 40 });

    if (talentsList.includes('t7_2')) {
      allies.forEach(a => {
        if (a.id !== attacker.id && a.hp > 0 && getDistance(attacker, a) < 120) {
          const allyHeal = Math.round(heal * 0.5);
          a.hp = Math.min(a.maxHp, a.hp + allyHeal);
          floatingTexts.push({ x: a.x, y: a.y - 12, text: `+${allyHeal}`, color: '#34c759', life: 35 });
        }
      });
    }

  } else if (classType === 'NECROMANCER') {
    // Raise Dead: dark magic shell dealing 220% AoE magic damage and raises a skeleton companion (barrier buffer)
    let dmgFactor = 2.2;
    if (talentsList.includes('t2_1')) dmgFactor += 0.2;
    if (talentsList.includes('t5_1')) dmgFactor += 0.3;
    if (talentsList.includes('t10_1')) dmgFactor += 0.6;

    const dmg = Math.round(attacker.attackPower * dmgFactor);
    let finalDmg = dmg;
    if ((target as any).staggered) {
      finalDmg *= 2;
    }
    target.hp = Math.max(0, target.hp - finalDmg);
    if (target.id === 'boss') {
      accumulateStagger(target, 25, floatingTexts);
    }
    target.flashTimer = 0.1;
    target.flashColor = '#39ff14';
    floatingTexts.push({ x: target.x, y: target.y - 20, text: `${finalDmg} (Raise Dead)`, color: '#39ff14', life: 45 });
    createExplosion(particles, target.x, target.y, '#39ff14', 15);

    if (talentsList.includes('t7_2')) {
      target.stunTimer = 0.8;
    }

    if (attacker.isPlayer) {
      attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
      recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + finalDmg;
    } else {
      attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
    }

    enemies.forEach(e => {
      if (e.id !== target.id && e.hp > 0 && getDistance(target, e) < 80) {
        let spl = Math.round(dmg * 0.6);
        if ((e as any).staggered) {
          spl *= 2;
        }
        e.hp = Math.max(0, e.hp - spl);
        if (e.id === 'boss') {
          accumulateStagger(e, 10, floatingTexts);
        }
        floatingTexts.push({ x: e.x, y: e.y - 15, text: `${spl}`, color: '#39ff14', life: 35 });
      }
    });

    const skeletonBarrier = Math.round(attacker.maxHp * (talentsList.includes('t10_1') ? 0.30 : 0.15));
    attacker.hp = Math.min(attacker.maxHp, attacker.hp + skeletonBarrier);
    floatingTexts.push({ x: attacker.x, y: attacker.y - 12, text: `+${skeletonBarrier} (Skeleton)`, color: '#39ff14', life: 40 });

    if (talentsList.includes('t9_1') && Math.random() < 0.25) {
      attacker.skillTimer = 0;
    }

  } else if (classType === 'MONK') {
    // Seven-Sided Strike flurry
    let strikes = talentsList.includes('t8_2') ? 8 : 7;
    let dmgFactor = 0.4;
    if (talentsList.includes('t2_1')) dmgFactor += 0.08;
    if (talentsList.includes('t5_1')) dmgFactor += 0.12;
    if (talentsList.includes('t10_1')) dmgFactor += 0.24;

    const baseDmg = Math.round(attacker.attackPower * dmgFactor);
    recapStats.shakeTimer = 0.2;
    recapStats.shakeIntensity = 5;

    for (let sIdx = 0; sIdx < strikes; sIdx++) {
      setTimeout(() => {
        if (target && target.hp > 0) {
          let finalStrikeDmg = baseDmg;
          if ((target as any).staggered) {
            finalStrikeDmg *= 2;
          }
          target.hp = Math.max(0, target.hp - finalStrikeDmg);
          if (target.id === 'boss') {
            accumulateStagger(target, 4, floatingTexts);
          }
          target.flashTimer = 0.08;
          target.flashColor = '#ff6b00';
          floatingTexts.push({ x: target.x + (Math.random() * 30 - 15), y: target.y - 15, text: `${finalStrikeDmg}`, color: '#ff6b00', life: 30 });
          createExplosion(particles, target.x, target.y, '#ff6b00', 6);

          if (talentsList.includes('t2_2') && Math.random() < 0.4) {
            target.stunTimer = Math.max(target.stunTimer || 0, 0.5);
          }

          if (attacker.isPlayer) {
            attacker.damageDealt = (attacker.damageDealt || 0) + finalStrikeDmg;
            recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + finalStrikeDmg;
          } else {
            attacker.damageDealt = (attacker.damageDealt || 0) + finalStrikeDmg;
          }
        }
      }, sIdx * 90);
    }

    if (talentsList.includes('t3_1')) {
      const shield = Math.round(attacker.maxHp * 0.10);
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + shield);
    }

  } else if (classType === 'ALCHEMIST') {
    // Acid Bomb
    let dmgFactor = 1.8;
    if (talentsList.includes('t2_1')) dmgFactor += 0.25;
    if (talentsList.includes('t8_2')) dmgFactor += 0.40;
    if (talentsList.includes('t10_1')) dmgFactor += 1.26;

    const dmg = Math.round(attacker.attackPower * dmgFactor);
    const rangeRadius = talentsList.includes('t1_2') ? 100 : 80;

    enemies.forEach(e => {
      if (e.hp > 0 && getDistance(target, e) < rangeRadius) {
        let defDebuff = talentsList.includes('t7_1') ? 25 : (talentsList.includes('t2_2') ? 25 : 15);
        e.defense = Math.max(0, (e.defense || 0) - defDebuff);

        let finalDmg = dmg;
        if ((e as any).staggered) {
          finalDmg *= 2;
        }
        e.hp = Math.max(0, e.hp - finalDmg);
        if (e.id === 'boss') {
          accumulateStagger(e, 25, floatingTexts);
        }
        e.flashTimer = 0.1;
        e.flashColor = '#adff2f';
        floatingTexts.push({ x: e.x, y: e.y - 15, text: `${finalDmg} (Acid Bomb)`, color: '#adff2f', life: 45 });
        createExplosion(particles, e.x, e.y, '#adff2f', 15);

        if (talentsList.includes('t7_2')) {
          e.stunTimer = 0.8;
        }

        if (attacker.isPlayer) {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
          recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + finalDmg;
        } else {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
        }

        setTimeout(() => {
          if (e.hp > 0) {
            const poisonDmg = Math.round(attacker.attackPower * 0.5);
            e.hp = Math.max(0, e.hp - poisonDmg);
            floatingTexts.push({ x: e.x, y: e.y - 12, text: `${poisonDmg} (Acid Poison)`, color: '#22c55e', life: 30 });
          }
        }, 1000);
      }
    });

  } else if (classType === 'BARD') {
    // Dissonant Melody
    let dmgFactor = 1.5;
    if (talentsList.includes('t2_2')) dmgFactor += 0.3;
    if (talentsList.includes('t8_2')) dmgFactor += 0.75;
    if (talentsList.includes('t10_1')) dmgFactor += 1.05;

    const dmg = Math.round(attacker.attackPower * dmgFactor);
    const rangeRadius = talentsList.includes('t1_2') ? 120 : 100;

    enemies.forEach(e => {
      if (e.hp > 0 && getDistance(attacker, e) < rangeRadius) {
        let finalDmg = dmg;
        if ((e as any).staggered) {
          finalDmg *= 2;
        }
        e.hp = Math.max(0, e.hp - finalDmg);
        if (e.id === 'boss') {
          accumulateStagger(e, 25, floatingTexts);
        }
        e.flashTimer = 0.1;
        e.flashColor = '#ff007f';
        floatingTexts.push({ x: e.x, y: e.y - 15, text: `${finalDmg}`, color: '#ff007f', life: 40 });
        createExplosion(particles, e.x, e.y, '#ff007f', 12);

        if (talentsList.includes('t3_2')) {
          e.stunTimer = 0.8;
        }

        if (attacker.isPlayer) {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
          recapStats.playerDamageDealt = (recapStats.playerDamageDealt || 0) + finalDmg;
        } else {
          attacker.damageDealt = (attacker.damageDealt || 0) + finalDmg;
        }
      }
    });

    allies.forEach(a => {
      if (a.hp > 0 && getDistance(attacker, a) < 150) {
        const bonusAtkSpeed = talentsList.includes('t10_1') ? 0.40 : (talentsList.includes('t2_1') ? 0.35 : 0.25);
        const originalAtkSpeed = a.atkSpeed;
        a.atkSpeed = a.atkSpeed * (1 + bonusAtkSpeed);
        floatingTexts.push({ x: a.x, y: a.y - 20, text: `Speed Boost!`, color: '#ff007f', life: 40 });

        setTimeout(() => {
          a.atkSpeed = originalAtkSpeed;
        }, talentsList.includes('t4_1') ? 6000 : 4000);
      }
    });

    if (talentsList.includes('t3_1') || talentsList.includes('t7_2')) {
      const heal = Math.round((attacker.healPower || 15) * (talentsList.includes('t7_2') ? 2.0 : 1.5));
      allies.forEach(a => {
        if (a.hp > 0 && getDistance(attacker, a) < 150) {
          a.hp = Math.min(a.maxHp, a.hp + heal);
          floatingTexts.push({ x: a.x, y: a.y - 12, text: `+${heal}`, color: '#ffcc00', life: 35 });
        }
      });
    }
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
