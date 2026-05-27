export interface ClassConfig {
    name: string;
    baseHp: number;
    baseAtk: number;
    baseDef: number;
    baseCritChance: number;
    baseCritMult: number;
    baseAtkSpeed: number;
    baseMoveSpeed: number;
    baseHealPower: number;
    color: string;
    activeSkill: {
        name: string;
        cooldown: number;
        description: string;
    };
}
export declare const CLASSES: Record<string, ClassConfig>;
export interface TalentConfig {
    id: string;
    name: string;
    description: string;
    tier: number;
    effects: Record<string, number>;
}
export declare const TALENTS: Record<string, Record<string, TalentConfig>>;
export interface SkillNode {
    id: string;
    name: string;
    description: string;
    x: number;
    y: number;
    stats: Record<string, number>;
    connections: string[];
    type: 'life' | 'atk' | 'crit' | 'speed' | 'def' | 'start';
}
export declare const PASSIVE_SKILL_TREE: Record<string, SkillNode>;
export declare const validatePassiveAllocation: (allocatedNodes: string[]) => boolean;
export interface ArenaConfig {
    name: string;
    level: number;
    theme: 'FOREST' | 'POISON_CAVES' | 'RUINS' | 'CRYPT' | 'VOLCANO';
    enemySprite: 'GOBLIN' | 'SNAKE' | 'ORC' | 'LICH' | 'DRAGON';
    enemyNames: string[];
    desc: string;
    bgColor: string;
    detailColor: string;
}
export declare const ARENA_CONFIGS: Record<number, ArenaConfig>;
