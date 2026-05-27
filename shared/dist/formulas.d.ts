export interface ItemData {
    id?: string;
    name: string;
    slot: 'WEAPON' | 'ARMOR' | 'ACCESSORY';
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
    itemLevel: number;
    baseAttack: number;
    baseDefense: number;
    affixes: Array<{
        type: string;
        value: number;
    }>;
    isEquipped: boolean;
}
export interface CharacterStats {
    maxHp: number;
    attackPower: number;
    defense: number;
    critChance: number;
    critMult: number;
    atkSpeed: number;
    moveSpeed: number;
    healPower: number;
    lifesteal: number;
    reflect: number;
    cdr: number;
    fireRes: number;
    coldRes: number;
    poisonRes: number;
    physRes: number;
}
export declare const xpToNextLevel: (level: number) => number;
export declare const calculateCharacterStats: (charClass: string, level: number, talentsList: string[], passivesList: string[], equippedItems: ItemData[]) => CharacterStats;
export declare const generateRandomItem: (itemLevel: number, rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY", slot: "WEAPON" | "ARMOR" | "ACCESSORY", charClass?: string) => ItemData;
export declare const getLegendaryDescription: (affixType: string) => string;
