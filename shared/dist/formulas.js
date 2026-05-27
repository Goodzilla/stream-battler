import { CLASSES, TALENTS, PASSIVE_SKILL_TREE } from './constants.js';
// Experience curve: Much easier to level up to 50-60, then slows down. Level 99-100 takes as long as 1 to 99 combined.
export const xpToNextLevel = (level) => {
    if (level >= 99) {
        let total1To99 = 0;
        for (let l = 1; l < 99; l++) {
            total1To99 += xpToNextLevel(l);
        }
        return total1To99;
    }
    if (level < 60) {
        return Math.floor(60 + Math.pow(level, 1.2));
    }
    // From level 60 to 98:
    return Math.floor(195 + Math.pow(level - 59, 2.5));
};
// Calculate final character stats from raw database inputs
export const calculateCharacterStats = (charClass, level, talentsList, passivesList, equippedItems) => {
    const classConfig = CLASSES[charClass] || CLASSES.WARRIOR;
    // 1. Base Stats + Level Scaling
    let maxHp = classConfig.baseHp + (level - 1) * 12;
    let attackPower = classConfig.baseAtk + (level - 1) * 1.5;
    let defense = classConfig.baseDef + (level - 1) * 1.0;
    let critChance = classConfig.baseCritChance;
    let critMult = classConfig.baseCritMult;
    let atkSpeedPct = 0; // percentage increase from passives/gear/talents
    let moveSpeedPct = 0;
    let healPower = classConfig.baseHealPower + (level - 1) * 1.2;
    let lifesteal = 0;
    let reflect = 0;
    let cdr = 0;
    let fireRes = 0;
    let coldRes = 0;
    let poisonRes = 0;
    let physRes = 0;
    // 2. Add Passive Skill Tree allocations
    for (const nodeKey of passivesList) {
        const node = PASSIVE_SKILL_TREE[nodeKey];
        if (!node)
            continue;
        if (node.stats.maxHp)
            maxHp += node.stats.maxHp;
        if (node.stats.attackPower)
            attackPower += node.stats.attackPower;
        if (node.stats.defense)
            defense += node.stats.defense;
        if (node.stats.critChance)
            critChance += node.stats.critChance;
        if (node.stats.atkSpeedPct)
            atkSpeedPct += node.stats.atkSpeedPct;
        if (node.stats.moveSpeedPct)
            moveSpeedPct += node.stats.moveSpeedPct;
        if (node.stats.lifesteal)
            lifesteal += node.stats.lifesteal;
        if (node.stats.reflect)
            reflect += node.stats.reflect;
        if (node.stats.cdr)
            cdr += node.stats.cdr;
        if (node.stats.fireRes)
            fireRes += node.stats.fireRes;
        if (node.stats.coldRes)
            coldRes += node.stats.coldRes;
        if (node.stats.poisonRes)
            poisonRes += node.stats.poisonRes;
        if (node.stats.physRes)
            physRes += node.stats.physRes;
        if (node.stats.critMult)
            critMult += node.stats.critMult;
    }
    // 3. Add Gear Stats
    for (const item of equippedItems) {
        // Add base stats
        attackPower += item.baseAttack;
        defense += item.baseDefense;
        // Add affixes
        const affixesList = typeof item.affixes === 'string' ? JSON.parse(item.affixes) : item.affixes;
        for (const affix of affixesList || []) {
            switch (affix.type) {
                case 'maxHp':
                    maxHp += affix.value;
                    break;
                case 'attackPower':
                    attackPower += affix.value;
                    break;
                case 'defense':
                    defense += affix.value;
                    break;
                case 'critChance':
                    critChance += affix.value;
                    break;
                case 'atkSpeedPct':
                    atkSpeedPct += affix.value;
                    break;
                case 'moveSpeedPct':
                    moveSpeedPct += affix.value;
                    break;
                case 'lifesteal':
                    lifesteal += affix.value;
                    break;
                case 'reflect':
                    reflect += affix.value;
                    break;
                case 'cdr':
                    cdr += affix.value;
                    break;
                case 'fireRes':
                    fireRes += affix.value;
                    break;
                case 'coldRes':
                    coldRes += affix.value;
                    break;
                case 'poisonRes':
                    poisonRes += affix.value;
                    break;
                case 'physRes':
                    physRes += affix.value;
                    break;
            }
        }
    }
    // 4. Add Talent modifiers (class-specific multipliers and additions)
    let hpMult = 1.0;
    let atkMult = 1.0;
    let defMult = 1.0;
    const classTalents = TALENTS[charClass] || {};
    for (const talentId of talentsList) {
        const talent = classTalents[talentId];
        if (!talent)
            continue;
        const e = talent.effects;
        if (e.maxHpPct)
            hpMult += e.maxHpPct;
        if (e.armorPct)
            defMult += e.armorPct;
        if (e.defensePct)
            defMult += e.defensePct;
        if (e.lifesteal)
            lifesteal += e.lifesteal;
        if (e.reflect)
            reflect += e.reflect;
        if (e.critChance)
            critChance += e.critChance;
        if (e.critMultPct)
            critMult += e.critMultPct;
        if (e.moveSpeedPct)
            moveSpeedPct += e.moveSpeedPct;
        if (e.atkSpeedPct)
            atkSpeedPct += e.atkSpeedPct;
        if (e.cdr)
            cdr += e.cdr;
        if (e.atkMultPct)
            atkMult += e.atkMultPct;
        if (e.damagePct)
            atkMult += e.damagePct;
    }
    // 5. Apply Keystones
    if (passivesList.includes('r10_0')) { // Glass Cannon
        attackPower *= 1.5;
        maxHp *= 0.7;
    }
    if (passivesList.includes('r10_5')) { // Resolute Technique
        attackPower *= 1.4;
    }
    if (passivesList.includes('r10_10')) { // Elemental Overload
        attackPower *= 1.35;
    }
    if (passivesList.includes('r10_16')) { // Iron Fortress
        reflect += 0.30;
        moveSpeedPct -= 0.15;
    }
    if (passivesList.includes('r10_21')) { // Unwavering Stance
        defMult += 0.50;
        moveSpeedPct -= 0.15;
    }
    if (passivesList.includes('r10_26')) { // Juggernaut Bulwark
        reflect += 0.35;
        hpMult += 0.25;
        defMult -= 0.40;
    }
    if (passivesList.includes('r10_32')) { // Vampiric Zeal
        lifesteal += 0.25;
        hpMult -= 0.30;
    }
    if (passivesList.includes('r10_37')) { // Ghost Reaver
        hpMult += 0.45;
        reflect += 0.20;
    }
    if (passivesList.includes('r10_42')) { // Blood Magic
        hpMult += 0.25;
    }
    if (passivesList.includes('r10_48')) { // Alchemist Aura
        cdr *= 2;
        attackPower *= 0.8;
    }
    if (passivesList.includes('r10_53')) { // Conduit
        cdr += 0.35;
        defMult -= 0.35;
    }
    if (passivesList.includes('r10_58')) { // Swift Reflexes
        atkSpeedPct += 0.30;
    }
    if (passivesList.includes('r10_64')) { // Eagle Eye
        critChance += 0.15;
        maxHp *= 0.8;
    }
    if (passivesList.includes('r10_69')) { // Assassin Pact
        critMult += 0.60;
        defMult -= 0.30;
    }
    if (passivesList.includes('r10_74')) { // Perfect Agility
        critChance += 0.25;
    }
    // Ring 14 Celestial Keystones
    // Might (s = 0)
    if (passivesList.includes('r14_0_key1')) { // Titan's Grip
        atkMult += 0.50;
    }
    if (passivesList.includes('r14_0_key2')) { // Bloodthirst
        critChance += 0.25;
        atkMult -= 0.30;
    }
    // Bulwark (s = 1)
    if (passivesList.includes('r14_1_key1')) { // Indomitable Bastion
        defMult += 0.40;
    }
    if (passivesList.includes('r14_1_key2')) { // Retribution Shield
        reflect += 0.30;
        defMult -= 0.30;
    }
    // Vigor (s = 2)
    if (passivesList.includes('r14_2_key1')) { // Soul Feast
        lifesteal += 0.20;
        hpMult -= 0.25;
    }
    if (passivesList.includes('r14_2_key2')) { // Colossus
        hpMult += 0.40;
    }
    // Celerity (s = 3)
    if (passivesList.includes('r14_3_key1')) { // Flicker Step
        cdr += 0.35;
        atkSpeedPct -= 0.20;
    }
    if (passivesList.includes('r14_3_key2')) { // Zephyr Wind
        atkSpeedPct += 0.30;
    }
    // Precision (s = 4)
    if (passivesList.includes('r14_4_key1')) { // Assassin's Mark
        critMult += 0.60;
    }
    if (passivesList.includes('r14_4_key2')) { // Eagle Eye Focus
        critChance += 0.25;
    }
    // Ring 18 Void Keystones
    // Might (s = 0)
    if (passivesList.includes('r18_0_key1')) { // Divine Fervor
        atkSpeedPct += 0.40;
    }
    if (passivesList.includes('r18_0_key2')) { // Desperate Strike
        critMult += 0.75;
        atkSpeedPct -= 0.30;
    }
    // Bulwark (s = 1)
    if (passivesList.includes('r18_1_key1')) { // Iron Aegis
        physRes += 0.30;
    }
    if (passivesList.includes('r18_1_key2')) { // Magma Ward
        fireRes += 0.20;
        coldRes += 0.20;
        poisonRes += 0.20;
    }
    // Vigor (s = 2)
    if (passivesList.includes('r18_2_key1')) { // Adrenaline Rush
        atkSpeedPct += 0.30;
    }
    if (passivesList.includes('r18_2_key2')) { // Undying Will
        cdr += 0.30;
        atkSpeedPct -= 0.25;
    }
    // Celerity (s = 3)
    if (passivesList.includes('r18_3_key1')) { // Hypercharge
        cdr += 0.50;
        atkMult -= 0.40;
    }
    if (passivesList.includes('r18_3_key2')) { // Overdrive
        atkSpeedPct += 0.40;
    }
    // Precision (s = 4)
    if (passivesList.includes('r18_4_key1')) { // Lethal Precision
        critChance = 1.0;
    }
    if (passivesList.includes('r18_4_key2')) { // Slayer's Focus
        critMult += 0.80;
    }
    // Enforce keystone-specific overrides / limits
    if (passivesList.includes('r10_5')) { // Resolute Technique: 0% Crit Chance
        critChance = 0;
    }
    if (passivesList.includes('r10_10')) { // Elemental Overload: 0% CDR
        cdr = 0;
    }
    if (passivesList.includes('r10_21')) { // Unwavering Stance: 0% Reflect
        reflect = 0;
    }
    if (passivesList.includes('r10_37')) { // Ghost Reaver: 0% Lifesteal
        lifesteal = 0;
    }
    if (passivesList.includes('r10_42')) { // Blood Magic: 0% CDR
        cdr = 0;
    }
    if (passivesList.includes('r10_58')) { // Swift Reflexes: 0% CDR
        cdr = 0;
    }
    if (passivesList.includes('r10_74')) { // Perfect Agility: Crit Multiplier locked to 1.2
        critMult = 1.2;
    }
    // Ring 14 Celestial Overrides
    if (passivesList.includes('r14_0_key1')) { // Titan's Grip: 0% Crit Chance
        critChance = 0;
    }
    if (passivesList.includes('r14_1_key1')) { // Indomitable Bastion: 0% Reflect
        reflect = 0;
    }
    if (passivesList.includes('r14_2_key2')) { // Colossus: 0% Lifesteal
        lifesteal = 0;
    }
    if (passivesList.includes('r14_3_key2')) { // Zephyr Wind: 0% CDR
        cdr = 0;
    }
    if (passivesList.includes('r14_4_key1')) { // Assassin's Mark: Crit Chance locked to 10%
        critChance = 0.10;
    }
    if (passivesList.includes('r14_4_key2')) { // Eagle Eye Focus: Crit Mult locked to 1.2
        critMult = 1.2;
    }
    // Ring 18 Void Overrides
    if (passivesList.includes('r18_0_key1')) { // Divine Fervor: 0% CDR
        cdr = 0;
    }
    if (passivesList.includes('r18_1_key1')) { // Iron Aegis: 0% Elemental Resistances
        fireRes = 0;
        coldRes = 0;
        poisonRes = 0;
    }
    if (passivesList.includes('r18_1_key2')) { // Magma Ward: 0% Physical Resistance
        physRes = 0;
    }
    if (passivesList.includes('r18_2_key1')) { // Adrenaline Rush: 0% CDR
        cdr = 0;
    }
    if (passivesList.includes('r18_3_key2')) { // Overdrive: 0% CDR
        cdr = 0;
    }
    if (passivesList.includes('r18_4_key1')) { // Lethal Precision: 100% Crit Chance, 1.1x Crit Mult
        critChance = 1.0;
        critMult = 1.1;
    }
    if (passivesList.includes('r18_4_key2')) { // Slayer's Focus: Crit Chance locked to 10%
        critChance = 0.10;
    }
    // Apply final multipliers
    maxHp = Math.round(maxHp * hpMult);
    attackPower = Math.round(attackPower * atkMult);
    defense = Math.round(defense * defMult);
    const finalAtkSpeed = Math.round(classConfig.baseAtkSpeed * (1 + atkSpeedPct) * 100) / 100;
    const finalMoveSpeed = Math.round(classConfig.baseMoveSpeed * (1 + moveSpeedPct));
    return {
        maxHp: Math.max(1, maxHp),
        attackPower: Math.max(1, attackPower),
        defense: Math.max(0, defense),
        critChance: Math.round(Math.min(1.0, critChance) * 100) / 100,
        critMult: Math.round(critMult * 100) / 100,
        atkSpeed: finalAtkSpeed,
        moveSpeed: finalMoveSpeed,
        healPower: Math.round(healPower),
        lifesteal: Math.round(lifesteal * 100) / 100,
        reflect: Math.round(reflect * 100) / 100,
        cdr: Math.round(Math.min(0.75, cdr) * 100) / 100, // Cap CDR at 75%
        fireRes: Math.round(Math.min(0.75, Math.max(0, fireRes)) * 100) / 100,
        coldRes: Math.round(Math.min(0.75, Math.max(0, coldRes)) * 100) / 100,
        poisonRes: Math.round(Math.min(0.75, Math.max(0, poisonRes)) * 100) / 100,
        physRes: Math.round(Math.min(0.75, Math.max(0, physRes)) * 100) / 100
    };
};
// Item naming database
const ITEM_NAMES = {
    WEAPON: {
        WARRIOR: ['Broadsword', 'Gladius', 'Battleaxe', 'Warhammer', 'Iron Mace'],
        MAGE: ['Spellstaff', 'Rune Wand', 'Crystalline Staff', 'Codex', 'Grimoire'],
        CLERIC: ['Mace of Light', 'Scepter', 'Holy Flail', 'Crook', 'Wand of Grace'],
        ROGUE: ['Dagger', 'Stiletto', 'Dirk', 'Katar', 'Scimitar'],
        RANGER: ['Longbow', 'Shortbow', 'Recurve Bow', 'Crossbow', 'Flatbow'],
        VALKYRIE: ['Sunpear', 'Glow Halberd', 'Holy Lance', 'Partisan', 'Pike of Light'],
        NECROMANCER: ['Soul Scythe', 'Grim Wand', 'Shadow Staff', 'Blight Grimoire', 'Reaper Scythe'],
        MONK: ['Fist Wraps', 'Brass Knuckles', 'Iron Claws', 'Tiger Claws', 'Dragon Cestus'],
        ALCHEMIST: ['Acid Flask', 'Poison Flask', 'Fire Flask', 'Frost Flask', 'Unstable Beaker'],
        BARD: ['Lyre of Discord', 'Tuned Harp', 'Vibrant Flute', 'Echoing Lute', 'War Horn']
    },
    ARMOR: ['Plate Mail', 'Leather Tunic', 'Cloth Robes', 'Chainmail', 'Brigandine'],
    ACCESSORY: ['Runic Ring', 'Jade Amulet', 'Charmed Necklace', 'Iron Band', 'Gemstone Band']
};
export const generateRandomItem = (itemLevel, rarity, slot, charClass) => {
    let name = '';
    if (slot === 'WEAPON') {
        const list = ITEM_NAMES.WEAPON[charClass] || ITEM_NAMES.WEAPON.WARRIOR;
        name = list[Math.floor(Math.random() * list.length)];
    }
    else if (slot === 'ARMOR') {
        name = ITEM_NAMES.ARMOR[Math.floor(Math.random() * ITEM_NAMES.ARMOR.length)];
    }
    else {
        name = ITEM_NAMES.ACCESSORY[Math.floor(Math.random() * ITEM_NAMES.ACCESSORY.length)];
    }
    // Base values scale with level
    let baseAttack = 0;
    let baseDefense = 0;
    if (slot === 'WEAPON') {
        baseAttack = Math.round(5 + itemLevel * 2.2);
    }
    else if (slot === 'ARMOR') {
        baseDefense = Math.round(3 + itemLevel * 1.5);
    }
    else {
        baseAttack = Math.round(itemLevel * 0.6);
        baseDefense = Math.round(itemLevel * 0.4);
    }
    // Affixes count based on rarity
    let affixCount = 0;
    switch (rarity) {
        case 'UNCOMMON':
            affixCount = 1;
            break;
        case 'RARE':
            affixCount = 2;
            break;
        case 'EPIC':
            affixCount = 3;
            break;
        case 'LEGENDARY':
            affixCount = 4;
            break;
    }
    // Generate unique affixes
    const affixPool = [
        { type: 'maxHp', weight: 1.0, min: 4, max: 12 },
        { type: 'attackPower', weight: 1.0, min: 0.8, max: 2.2 },
        { type: 'defense', weight: 1.0, min: 0.6, max: 1.8 },
        { type: 'critChance', weight: 0.8, min: 0.01, max: 0.035 },
        { type: 'atkSpeedPct', weight: 0.8, min: 0.02, max: 0.06 },
        { type: 'moveSpeedPct', weight: 0.6, min: 0.02, max: 0.05 },
        { type: 'lifesteal', weight: 0.5, min: 0.01, max: 0.03 },
        { type: 'reflect', weight: 0.5, min: 0.01, max: 0.03 },
        { type: 'cdr', weight: 0.5, min: 0.02, max: 0.05 },
        { type: 'fireRes', weight: 0.6, min: 0.02, max: 0.10 },
        { type: 'coldRes', weight: 0.6, min: 0.02, max: 0.10 },
        { type: 'poisonRes', weight: 0.6, min: 0.02, max: 0.10 },
        { type: 'physRes', weight: 0.6, min: 0.02, max: 0.10 }
    ];
    let filteredPool = affixPool;
    if (slot === 'WEAPON') {
        filteredPool = affixPool.filter(a => ['attackPower', 'critChance', 'atkSpeedPct', 'lifesteal'].includes(a.type));
    }
    else if (slot === 'ARMOR') {
        filteredPool = affixPool.filter(a => ['maxHp', 'defense', 'moveSpeedPct', 'reflect', 'fireRes', 'coldRes', 'poisonRes', 'physRes'].includes(a.type));
    }
    const affixes = [];
    const selectedTypes = new Set();
    while (affixes.length < affixCount && selectedTypes.size < filteredPool.length) {
        const affixOpt = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        if (selectedTypes.has(affixOpt.type))
            continue;
        selectedTypes.add(affixOpt.type);
        let minVal, maxVal;
        if (['fireRes', 'coldRes', 'poisonRes', 'physRes'].includes(affixOpt.type)) {
            minVal = 0.02 + (itemLevel / 100) * 0.18;
            maxVal = 0.10 + (itemLevel / 100) * 0.65;
        }
        else {
            minVal = affixOpt.min * (1 + itemLevel * 0.01);
            maxVal = affixOpt.max * (1 + itemLevel * 0.015);
        }
        let rolledVal = minVal + Math.random() * (maxVal - minVal);
        // Format decimals appropriately
        if (affixOpt.type === 'critChance' || affixOpt.type === 'atkSpeedPct' || affixOpt.type === 'moveSpeedPct' || affixOpt.type === 'lifesteal' || affixOpt.type === 'reflect' || affixOpt.type === 'cdr' || ['fireRes', 'coldRes', 'poisonRes', 'physRes'].includes(affixOpt.type)) {
            rolledVal = Math.round(rolledVal * 1000) / 1000;
        }
        else {
            rolledVal = Math.round(rolledVal);
        }
        affixes.push({ type: affixOpt.type, value: rolledVal });
    }
    // If Legendary, add unique legendary affix info to the names or descriptions
    if (rarity === 'LEGENDARY') {
        name = `Legendary ${name}`;
    }
    else {
        name = `${rarity.charAt(0) + rarity.slice(1).toLowerCase()} ${name}`;
    }
    return {
        name,
        slot,
        rarity,
        itemLevel,
        baseAttack,
        baseDefense,
        affixes,
        isEquipped: false
    };
};
export const getLegendaryDescription = (affixType) => {
    return '';
};
