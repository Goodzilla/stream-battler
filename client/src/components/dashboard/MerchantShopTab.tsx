import React from 'react';
import { ShoppingBag, RefreshCw, Coins } from 'lucide-react';
import { ItemComparisonTooltip } from './ItemComparisonTooltip';

interface MerchantShopTabProps {
  character: any;
  shopStock: any[];
  shopLoading: boolean;
  gambledItem: any | null;
  onRefreshShop: () => void;
  onBuyShopItem: (shopItemId: string, price: number) => void;
  onGambleItem: (slot: string) => void;
  equipped: any[];
}

const formatAffix = (type: string, value: number): string => {
  let label = type.replace('Pct', '').replace('_', ' ').toUpperCase();
  if (type === 'maxHp') label = 'MAX HP';
  if (type === 'attackPower') label = 'ATTACK POWER';
  if (type === 'defense') label = 'DEFENSE';
  if (type === 'critChance') label = 'CRIT CHANCE';
  if (type === 'atkSpeedPct') label = 'ATTACK SPEED';
  if (type === 'moveSpeedPct') label = 'MOVE SPEED';
  if (type === 'lifesteal') label = 'LIFESTEAL';
  if (type === 'reflect') label = 'REFLECT';
  if (type === 'cdr') label = 'CDR';
  if (type === 'fireRes') label = 'FIRE RESISTANCE';
  if (type === 'coldRes') label = 'COLD RESISTANCE';
  if (type === 'poisonRes') label = 'POISON RESISTANCE';
  if (type === 'physRes') label = 'PHYSICAL RESISTANCE';
  
  const percentTypes = ['critChance', 'atkSpeedPct', 'moveSpeedPct', 'lifesteal', 'reflect', 'cdr', 'fireRes', 'coldRes', 'poisonRes', 'physRes'];
  if (percentTypes.includes(type)) {
    return `+${Math.round(value * 100)}% ${label}`;
  }
  return `+${value} ${label}`;
};

export const MerchantShopTab: React.FC<MerchantShopTabProps> = ({
  character,
  shopStock,
  shopLoading,
  gambledItem,
  onRefreshShop,
  onBuyShopItem,
  onGambleItem,
  equipped
}) => {
  return (
    <div className="flex flex-col gap-6">
      
      {/* Buy and refresh stock panel */}
      <div className="glass-panel p-6 border-white/5 bg-black/25 flex flex-col gap-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <div>
            <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider text-neon-cyan">
              Merchant Gear Purchase
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed m-0 mt-1 uppercase tracking-wider">
              Stock scales to your active level. stock refreshes automatically after battles.
            </p>
          </div>
          
          <button
            onClick={onRefreshShop}
            className="px-4 py-2 border border-yellow-500/30 text-yellow-500 text-xs font-display font-bold uppercase tracking-wider rounded hover:bg-yellow-500 hover:text-black transition duration-300 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Stock ({character.level * 10}g)
          </button>
        </div>

        {shopLoading ? (
          <div className="text-slate-500 italic text-xs py-8 text-center uppercase tracking-widest font-mono">
            FETCHING STOCK FROM MERCHANT BOARD...
          </div>
        ) : shopStock.length === 0 ? (
          <div className="text-slate-500 italic text-xs py-8 text-center">
            The merchant is out of stock! Try refreshing.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {shopStock.map((shopItem: any) => {
              // Calculate purchase price
              let price = shopItem.itemLevel * 20;
              switch (shopItem.rarity) {
                case 'UNCOMMON': price += 50; break;
                case 'RARE': price += 150; break;
                case 'EPIC': price += 450; break;
                case 'LEGENDARY': price += 1000; break;
              }

              const equippedItem = equipped.find((i: any) => i.slot === shopItem.slot);

              return (
                <div
                  key={shopItem.id}
                  className="p-4 bg-[#090e1a]/85 border border-white/5 rounded-xl flex flex-col justify-between gap-4 hover:border-white/15 transition relative group hover:z-50"
                >
                  <ItemComparisonTooltip item={shopItem} equippedItem={equippedItem} />
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="m-0 text-white font-display text-xs tracking-wider leading-snug">{shopItem.name}</h4>
                      <span className="text-[8px] font-mono uppercase font-bold shrink-0" style={{ color: `var(--rarity-${shopItem.rarity.toLowerCase()})` }}>
                        {shopItem.rarity}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Lvl {shopItem.itemLevel} {shopItem.slot}
                    </div>

                    {/* stats preview */}
                    <div className="flex flex-col gap-0.5 mt-3 text-[10px] font-mono text-slate-400">
                      {shopItem.baseAttack > 0 && <span className="text-emerald-400">+{shopItem.baseAttack} Attack</span>}
                      {shopItem.baseDefense > 0 && <span className="text-blue-400">+{shopItem.baseDefense} Defense</span>}
                      {shopItem.affixes && (typeof shopItem.affixes === 'string' ? JSON.parse(shopItem.affixes) : shopItem.affixes).map((aff: any, i: number) => (
                        <span key={i} className="text-cyan-400/80">{formatAffix(aff.type, aff.value)}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onBuyShopItem(shopItem.id, price)}
                    className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black border border-yellow-500/30 rounded text-xs font-display font-bold uppercase tracking-wider transition duration-300 flex items-center justify-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    Buy ({price}g)
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mystery gambling card */}
      <div className="glass-panel p-6 border-white/5 bg-black/25 flex flex-col gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/5 blur-[50px] -z-10" />
        
        <h3 className="m-0 text-white font-display text-xs uppercase tracking-wider text-neon-purple flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 shrink-0 text-neon-purple" />
          Gheed's Mystery Artifacts (Gambling)
        </h3>
        <p className="text-[10px] text-slate-400 leading-relaxed m-0 mb-2">
          Roll the dice for a random item. Mystery artifacts have an index cost scaling with your active character's level: <span className="text-yellow-500 font-bold">{character.level * 120} Gold</span>. High odds of Rare (51%), Epic (9%), and Legendary (1%) gear.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
          {['WEAPON', 'ARMOR', 'ACCESSORY'].map(slot => (
            <button
              key={slot}
              onClick={() => onGambleItem(slot)}
              className="p-4 bg-black/40 hover:bg-neon-purple/5 border border-white/5 hover:border-neon-purple/20 rounded-xl flex flex-col items-center justify-between gap-3 text-center transition duration-300"
            >
              <span className="text-[10px] font-pixel text-slate-500 tracking-widest">{slot}</span>
              <span className="text-[18px] font-display font-bold text-white uppercase tracking-wider mt-1">? MYSTERY ?</span>
              <div className="text-yellow-500 font-mono text-xs font-bold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 shrink-0" />
                {character.level * 120} Gold
              </div>
            </button>
          ))}
        </div>

        {gambledItem && (
          <div className="mt-4 p-4 bg-yellow-950/20 border border-yellow-500/20 rounded-xl flex items-center justify-between gap-4 animate-pulse">
            <div>
              <span className="text-[9px] font-pixel text-yellow-500 uppercase tracking-widest">[ GAMBLING RESULT ]</span>
              <h4 className="m-0 text-white font-display text-sm mt-1">{gambledItem.name}</h4>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Slot: {gambledItem.slot} | Rarity:{' '}
                <span className="font-bold font-mono" style={{ color: `var(--rarity-${gambledItem.rarity.toLowerCase()})` }}>
                  {gambledItem.rarity}
                </span>
              </div>
            </div>
            <span className="text-2xl">🎉</span>
          </div>
        )}
      </div>

    </div>
  );
};
