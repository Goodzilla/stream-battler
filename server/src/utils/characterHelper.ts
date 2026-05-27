import { CLASSES, generateRandomItem } from 'shared';

export const resolveActiveClass = (user: any): string | null => {
  if (!user || !user.characters || user.characters.length === 0) return null;
  
  if (user.activeClass) {
    const hasChar = user.characters.some((c: any) => c.class === user.activeClass);
    if (hasChar) {
      return user.activeClass;
    }
  }

  let maxLevel = -1;
  let candidates: any[] = [];
  for (const c of user.characters) {
    if (c.level > maxLevel) {
      maxLevel = c.level;
      candidates = [c];
    } else if (c.level === maxLevel) {
      candidates.push(c);
    }
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].class;

  const randomIdx = Math.floor(Math.random() * candidates.length);
  return candidates[randomIdx].class;
};

export const getActiveCharacter = (user: any) => {
  if (!user) return null;
  const activeClass = resolveActiveClass(user);
  if (!activeClass) return null;

  const activeChar = user.characters.find((c: any) => c.class === activeClass);
  if (!activeChar) return null;

  return {
    ...activeChar,
    user: {
      id: user.id,
      twitchId: user.twitchId,
      username: user.username,
      displayName: user.displayName,
      isAdmin: user.isAdmin,
      gold: user.gold,
      activeClass: activeClass,
      shopStock: user.shopStock,
      createdAt: user.createdAt,
      characters: user.characters
    },
    items: user.items ? user.items.filter((item: any) => {
      return !item.isEquipped || item.equippedCharacterId === activeChar.id;
    }) : []
  };
};

export const generateShopStock = (charLevel: number, charClass: string): string => {
  const slots = ['WEAPON', 'ARMOR', 'ACCESSORY'] as const;
  const items = [];
  for (let i = 0; i < 3; i++) {
    const slot = slots[i];
    const rRoll = Math.random();
    let rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' = 'COMMON';
    if (rRoll < 0.03) rarity = 'EPIC';
    else if (rRoll < 0.20) rarity = 'RARE';
    else if (rRoll < 0.60) rarity = 'UNCOMMON';

    items.push({
      id: `shop_temp_${Math.random().toString(36).substring(2, 11)}`,
      ...generateRandomItem(charLevel, rarity, slot, charClass)
    });
  }
  return JSON.stringify(items);
};
