// 16x16 Programmatic Pixel-Art Sprites Grid Dictionary
// '.' = transparent
// 'c' = classColor (neon red/blue/gold/purple/green)
// 'w' = steel/bone/steel/gray (#e2e8f0)
// 's' = peach/pink skin (#ffcbd2)
// 'k' = dark slate/black (#0f172a)
// 'g' = green (#22c55e)
// 'r' = red (#ef4444)
// 'b' = blue (#3b82f6)
// 'p' = purple (#a855f7)
// 'y' = yellow (#eab308)
// 'o' = orange (#f97316)

export const SPRITES: Record<string, string[]> = {
  WARRIOR: [
    "....cccccccc....",
    "...cccccccccc...",
    "..cckkkkkkkkcc..",
    "..ckkkkkkkkkkc..",
    "..ckksssssskkc..",
    "..cssssssssss..",
    "..csssswwsssscc",
    "..cssswwwwssscc",
    "..ccwwwwwwwwcc..",
    "...wwwwwwwwww...",
    "....wwwwwwww....",
    "....wwwwwwww....",
    "....www..www....",
    "....www..www....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  MAGE: [
    "......kkkk......",
    ".....kcccck.....",
    "....kcccccck....",
    "....kccsscck....",
    "....kcssssck....",
    "....kssssssk....",
    "....kccwwcck....",
    "...kcccwwccck.yy",
    "..kccccwwcccckyy",
    "..kcccwwwwcccky.",
    "..kccccwwcccck..",
    "...kccwwwwcck...",
    "....kcc..cck....",
    "....kcc..cck....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  CLERIC: [
    ".....yyyyyy.....",
    "....yccccccy....",
    "...yccccccccy...",
    "...yccssssccy...",
    "...ycsssssscy...",
    "...yssssssssy...",
    "...yccwwccwwy...",
    "...ycccwwcccy...",
    "...ycccwwcccy.yy",
    "...yccwwwwccy.y.",
    "...ycccwwcccy.yy",
    "....ycc..ccy....",
    "....ycc..ccy....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  ROGUE: [
    "......kkkk......",
    ".....kkkkkk.....",
    "....kkkkkkkk....",
    "....kkksskkk....",
    "....kksssskk....",
    "....kkkkkkkk....",
    "....kwwwwwwk....",
    "...kwwwwwwwwk...",
    "..kwwwkkkkwwwk..",
    "..kwwkkkkkkwwk..",
    "..kwkk....kkwk..",
    "...kkk....kkk...",
    "....kk....kk....",
    "....kk....kk....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  RANGER: [
    "......cccc......",
    ".....cccccc.....",
    "....cccccccc....",
    "....cccssccc....",
    "....ccsssscc....",
    "....cssssssc.yy.",
    "....ccw..wcc.y.y",
    "...cccw..wcccy.y",
    "..ccccwwwwcccc.y",
    "..cccw....wccc..",
    "..cccw....wccc..",
    "...ccw....wcc...",
    "....cc....cc....",
    "....cc....cc....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  VALKYRIE: [
    "...cccccccccc...",
    "..cckkkkkkkkcc..",
    "w.ckkkkkkkkkkc.w",
    "wwckksssssskkcww",
    "wwcssssssssssww",
    "w.csssswwssssc.w",
    "..cssswwwwsssc..",
    "..ccwwwwwwwwcc..",
    "...wwwwwwwwww...",
    "....wwwwwwww....",
    "....wwwwwwww....",
    "....www..www....",
    "....www..www....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  NECROMANCER: [
    "......cccc......",
    ".....cccccc.....",
    "....cckkkkcc....",
    "....ckwwwwkc....",
    "....ckwkwkcw....",
    "....ckwwwwcw.pp.",
    "....ckwkwkcw..p.",
    "...cccwwwwccc.p.",
    "..ccccwwcccc.p..",
    "..cccwwwwccc.p..",
    "..ccccwwcccc....",
    "...ccwwwwcc.....",
    "....cc..cc......",
    "....cc..cc......",
    "....kk..kk......",
    "....kk..kk......"
  ],
  MONK: [
    "......cccc......",
    ".....ccsscc.....",
    "....ccsssscc....",
    "....cssssssc....",
    "....cssssssc....",
    "....cssssssc....",
    "....ccwyywcc....",
    "...cccwyywccc...",
    "..ccccwwwwcccc..",
    ".cccccwwwwccccc.",
    ".c.cccwwwwccc.c.",
    "...ccwwwwwwcc...",
    "....cc....cc....",
    "....cc....cc....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  ALCHEMIST: [
    "......cccc......",
    ".....cccccc.....",
    "....ccyyyycc....",
    "....ccyssycc....",
    "....cssssssc....",
    "....cssssssc....",
    "....ccwwwwcc....",
    "...cccwwwwccc.gg",
    "..ccccwwwwccccgg",
    "..cccwwwwwwccc..",
    "..ccccwwwwcccc..",
    "...ccwwwwwwcc...",
    "....cc....cc....",
    "....cc....cc....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  BARD: [
    "....cccccccc....",
    "....c.cccc.c....",
    "....cccccccc....",
    "....cccssccc....",
    "....ccsssscc....",
    "....cssssssc.oo.",
    "....ccw..wcc.o.o",
    "...cccw..wccco.o",
    "..ccccwwwwcccc.o",
    "..cccw....wccc..",
    "..cccw....wccc..",
    "...ccw....wcc...",
    "....cc....cc....",
    "....cc....cc....",
    "....kk....kk....",
    "....kk....kk...."
  ],
  GOBLIN_SCOUT: [
    "................",
    "......gggg......",
    "....gggggggg....",
    "...gggggggggg...",
    "..ggyygggyyggg..",
    "..ggykkkkykkgg..",
    "...ggkkkkkkgg...",
    "....gggggggg....",
    ".....gggggg.....",
    "....gggggggg....",
    "...ggrrggggrrg..",
    "...grrggggggrg..",
    "....gggggggg....",
    ".....gg..gg.....",
    ".....kk..kk.....",
    "................"
  ],
  GOBLIN_RAIDER: [
    "......wwww......",
    ".....wggggw.....",
    "....wggggggw....",
    "...wggggggggw...",
    "..wgyygggyyggw..",
    "..wgykkkkykkgw..",
    "...ggkkkkkkgg...",
    "....gggggggg....",
    ".....gggggg.....",
    "....gggggggg....",
    "...ggrrggggrrg..",
    "...grrggggggrg..",
    "....gggggggg....",
    ".....gg..gg.....",
    ".....kk..kk.....",
    "................"
  ],
  GOBLIN_ARCHER: [
    "......wwww......",
    ".....wggggw.....",
    "....wggggggw....",
    "...wggggggggw...",
    "..wgyygggyyggw..",
    "..wgykkkkykkgw..",
    "...ggkkkkkkgg.yy",
    "....gggggggg.y.y",
    ".....gggggg..y.y",
    "....gggggggg..y.",
    "...ggrrggggrrg..",
    "...grrggggggrg..",
    "....gggggggg....",
    ".....gg..gg.....",
    ".....kk..kk.....",
    "................"
  ],
  YOUNG_ADDER: [
    "................",
    "......pppp......",
    "....pppppppp....",
    "...pppyyppyypp..",
    "..pppyyypyyyppp.",
    "..pppwwpppwwppp.",
    "...ppwwwwwppp...",
    "....pppppppp....",
    ".....pppppp.....",
    ".....pppppp.....",
    "....pppppppp....",
    "...pppppppppp...",
    "..pppppppppppp..",
    "..pppp.ppppppp..",
    "...pp...ppppp...",
    "................"
  ],
  NEON_VIPER: [
    "................",
    "......bbbb......",
    "....bbbbbbbb....",
    "...bbbyyppyybb..",
    "..bbbyyypyyybbb.",
    "..bbbwwbbbwwbbb.",
    "...bbwwwwwbbb...",
    "....bbbbbbbb....",
    ".....bbbbbb.....",
    ".....bbbbbb.....",
    "....bbbbbbbb....",
    "...bbbbbbbbbb...",
    "..bbbbbbbbbbbb..",
    "..bbbb.bbbbbbb..",
    "...bb...bbbbb...",
    "................"
  ],
  FERAL_GOBLIN: [
    "......rrrr......",
    "......gggg......",
    "....gggggggg....",
    "...grrrrrrrrg...",
    "..ggyygggyyggg..",
    "..ggykkkkykkgg..",
    "...ggkkkkkkgg...",
    "....gggggggg....",
    ".....gggggg.....",
    "....gggggggg....",
    "...ggrrggggrrg..",
    "...grrggggggrg..",
    "....gggggggg....",
    ".....gg..gg.....",
    ".....kk..kk.....",
    "................"
  ],
  ORC_VANGUARD: [
    ".....kkkkkk.....",
    "....kggggggk....",
    "...kggggggggk...",
    "..kggggggggggk..",
    "..kgyygggyyggk..",
    "..kgyrkkryrggk..",
    "..kggggwwggggk..",
    "..kggggwwggggk..",
    "..kkkwwwwwwkkk..",
    "...kwwwwwwwwk...",
    "...kww..ww..wk..",
    "..kkww..ww..wkk.",
    "..kwwwwwwwwwwk..",
    "..kww..ww..wwk..",
    "..kww..ww..wwk..",
    "...kk..kk..kk..."
  ],
  SKELETAL_GRUNT: [
    ".....wwwww......",
    "....wwwwwww.....",
    "...wwkkwwkkww...",
    "...wwkkkkkkww...",
    "...wwkkwwkkww...",
    "....wwwwwww.....",
    ".....wwwww......",
    "....wwwwwww.....",
    "...wwwwwwwww....",
    "...ww..ww..w....",
    "..www..ww..ww...",
    "..wwwwwwwwww....",
    "..ww..ww..ww....",
    "..ww..ww..ww....",
    "...k..kk..k.....",
    "................"
  ],
  ORC_RAIDER: [
    ".....kkkkkk.....",
    "....kggggggk....",
    "...kggggggggk...",
    "..kggggggggggk..",
    "..kgyygggyyggk..",
    "..kgyrkkryrggk..",
    "..kggggwwggggk.r",
    "..kggggwwggggkr.",
    "..kkkwwwwwwkkk.r",
    "...kwwwwwwwwk...",
    "...kww..ww..wk..",
    "..kkww..ww..wkk.",
    "..kwwwwwwwwwwk..",
    "..kww..ww..wwk..",
    "..kww..ww..wwk..",
    "...kk..kk..kk..."
  ],
  TOXIC_COBRA: [
    "................",
    "......pppp......",
    "....pppppppp....",
    "...pppyyppyypp..",
    "..pppyyypyyyppp.",
    "..pppwwpppwwppp.",
    "...ppwwwwwppp...",
    "....pppppppp....",
    ".....gggggg.....",
    ".....gggggg.....",
    "....gggggggg....",
    "...gggggggggg...",
    "..gggggggggggg..",
    "..gggg.ggggggg..",
    "...gg...ggggg...",
    "................"
  ],
  ORC_BERSERKER: [
    ".....rrrrrr.....",
    "....kggggggk....",
    "...kggggggggk...",
    "..kggggggggggk..",
    "..kgyygggyyggk..",
    "..kgyrkkryrggk..",
    "..kggggwwggggk..",
    "..kggggwwggggk..",
    "..kkkwwwwwwkkk..",
    "...kwwwwwwwwk...",
    "...kww..ww..wk..",
    "..kkww..ww..wkk.",
    "..kwwwwwwwwwwk..",
    "..kww..ww..wwk..",
    "..kww..ww..wwk..",
    "...kk..kk..kk..."
  ],
  SKELETAL_ACOLYTE: [
    "......pppp......",
    "....pppppppp....",
    "...ppwwwwwwpp...",
    "..ppwwrwwrwwpp..",
    "..ppwwkkkwwkpp..",
    "..ppwwwwwwwwpp..",
    "...ppwwkwwkpp...",
    "....ppwwwwpp....",
    ".....pppppp.....",
    "....pppppppp....",
    "...pppppppppp...",
    "..pppppppppppp..",
    "..pppp.pp.pppp..",
    "..ppp..pp..ppp..",
    "...pp..pp..pp...",
    "....k..kk..k...."
  ],
  LICH_ACOLYTE: [
    "......bbbb......",
    "....bbbbbbbb....",
    "...bbwwwwwwbb...",
    "..bbwwrwwrwwbb..",
    "..bbwwkkkwwkbb..",
    "..bbwwwwwwwwbb..",
    "...bbwwkwwkbb...",
    "....bbwwwwbb....",
    ".....bbbbbb.....",
    "....bbbbbbbb....",
    "...bbbbbbbbbb...",
    "..bbbbbbbbbbbb..",
    "..bbbb.bb.bbbb..",
    "..bbb..bb..bbb..",
    "...bb..bb..bb...",
    "....k..kk..k...."
  ],
  ORC_COMMANDER: [
    ".....yyyyyy.....",
    "....kggggggk....",
    "...kggggggggk...",
    "..kggggggggggk..",
    "..kgyygggyyggk..",
    "..kgyrkkryrggk..",
    "..kggggwwggggk..",
    "..kggggwwggggk..",
    "..kkkwwwwwwkkk..",
    "...kwwwwwwwwk...",
    "...kww..ww..wk..",
    "..kkww..ww..wkk.",
    "..kwwwwwwwwwwk..",
    "..kww..ww..wwk..",
    "..kww..ww..wwk..",
    "...kk..kk..kk..."
  ],
  SKELETAL_LICH: [
    "......yyyy......",
    "....pppppppp....",
    "...ppwwwwwwpp...",
    "..ppwwrwwrwwpp..",
    "..ppwwkkkwwkpp..",
    "..ppwwwwwwwwpp..",
    "...ppwwkwwkpp...",
    "....ppwwwwpp....",
    ".....pppppp.....",
    "....pppppppp....",
    "...pppppppppp...",
    "..pppppppppppp..",
    "..pppp.pp.pppp..",
    "..ppp..pp..ppp..",
    "...pp..pp..pp...",
    "....k..kk..k...."
  ],
  VOLCANO_HATCHLING: [
    "......rrrr......",
    "....rrrrrrrr....",
    "....rryrryrr....",
    "...rryyryyyrr...",
    "...rrwwrrwwrr...",
    "..rryyyyyyyyrr..",
    "..rrrrrrrrrrrr..",
    "..rrrrrrrrrrrr..",
    ".rrrrrrrrrrrrrr.",
    "rrrrrrrrrrrrrrrr",
    "rrrrr.rrrr.rrrrr",
    "rrrr..rrrr..rrrr",
    "rrr....rr....rrr",
    "rr.....rr.....rr",
    "kk.....kk.....kk",
    "................"
  ],
  VOLCANO_DRAGON: [
    ".....rrrrrr.....",
    "....rrrrrrrr....",
    "....rryrryrr....",
    "...rryyryyyrr...",
    "...rrwwrrwwrr...",
    "..rryyyyyyyyrr..",
    "..rrrrrrrrrrrr..",
    "..rrrrrrrrrrrr..",
    ".rrrrrrrrrrrrrr.",
    "rrrrrrrrrrrrrrrr",
    "rrrrr.rrrr.rrrrr",
    "rrrr..rrrr..rrrr",
    "rrr....rr....rrr",
    "rr.....rr.....rr",
    "kk.....kk.....kk",
    "................"
  ],
  FROST_WIGHT: [
    "......bbbb......",
    "....bbbbbbbb....",
    "...bbwwwwwwbb...",
    "..bbwwrwwrwwbb..",
    "..bbwwkkkwwkbb..",
    "..bbwwwwwwwwbb..",
    "...bbwwkwwkbb...",
    "....bbwwwwbb....",
    ".....bbbbbb.....",
    "....bbbbbbbb....",
    "...bbbbbbbbbb...",
    "..bbbbbbbbbbbb..",
    "..bbbb.bb.bbbb..",
    "..bbb..bb..bbb..",
    "...bb..bb..bb...",
    "....k..kk..k...."
  ],
  MAGMA_DRAGON: [
    ".....oooooo.....",
    "....oooooooo....",
    "....ooyooyoo....",
    "...ooyooyyyoo...",
    "...oowwoowwoo...",
    "..ooyyyyyyyyoo..",
    "..oooooooooooo..",
    "..oooooooooooo..",
    ".oooooooooooooo.",
    "oooooooooooooooo",
    "ooooo.oooo.ooooo",
    "oooo..oooo..oooo",
    "ooo....oo....ooo",
    "oo.....oo.....oo",
    "kk.....kk.....kk",
    "................"
  ],
  VOID_DRAGON: [
    ".....pppppp.....",
    "....pppppppp....",
    "....ppyrrypp....",
    "...ppyyryyypp...",
    "...ppwwppwwpp...",
    "..ppyyyyyyyypp..",
    "..pppppppppppp..",
    "..pppppppppppp..",
    ".pppppppppppppp.",
    "pppppppppppppppp",
    "ppppp.pppp.ppppp",
    "pppp..pppp..pppp",
    "ppp....pp....ppp",
    "pp.....pp.....pp",
    "kk.....kk.....kk",
    "................"
  ],
  ANCIENT_SOVEREIGN: [
    ".....yyyyyy.....",
    "....rrrrrrrr....",
    "....rryrryrr....",
    "...rryyryyyrr...",
    "...rrwwrrwwrr...",
    "..rryyyyyyyyrr..",
    "..rrrrrrrrrrrr..",
    "..rrrrrrrrrrrr..",
    ".rrrrrrrrrrrrrr.",
    "rrrrrrrrrrrrrrrr",
    "rrrrr.rrrr.rrrrr",
    "rrrr..rrrr..rrrr",
    "rrr....rr....rrr",
    "rr.....rr.....rr",
    "kk.....kk.....kk",
    "................"
  ]
};

export const drawPixelSprite = (
  ctx: CanvasRenderingContext2D,
  cx: number, // Center X
  cy: number, // Center Y
  spriteName: string,
  pixelSize: number = 2.5,
  isFacingLeft: boolean = false,
  classColor: string = '#00d8ff',
  flashColor?: string
) => {
  const grid = SPRITES[spriteName.toUpperCase()] || SPRITES.GOBLIN_SCOUT;
  const rows = grid.length;
  const cols = grid[0].length;
  const startX = cx - (cols * pixelSize) / 2;
  const startY = cy - (rows * pixelSize) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const char = grid[r][c];
      if (char === '.') continue;

      let color = '#ffffff';
      switch (char) {
        case 'c': color = classColor; break;
        case 'w': color = '#e2e8f0'; break; // steel/bone
        case 's': color = '#ffcbd2'; break; // pinkish skin
        case 'k': color = '#0f172a'; break; // dark slate black
        case 'g': color = '#22c55e'; break; // goblin/orc green
        case 'r': color = '#ef4444'; break; // neon red
        case 'b': color = '#3b82f6'; break; // neon blue
        case 'p': color = '#a855f7'; break; // purple
        case 'y': color = '#eab308'; break; // gold/yellow
        case 'o': color = '#f97316'; break; // orange
      }

      ctx.fillStyle = flashColor || color;
      const drawCol = isFacingLeft ? (cols - 1 - c) : c;
      ctx.fillRect(
        Math.floor(startX + drawCol * pixelSize),
        Math.floor(startY + r * pixelSize),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize)
      );
    }
  }
};

export interface ArenaConfig {
  name: string;
  level: number;
  theme: 'FOREST' | 'POISON_CAVES' | 'RUINS' | 'CRYPT' | 'VOLCANO';
  enemySprite: string;
  enemyNames: string[];
  desc: string;
  bgColor: string;
  detailColor: string;
}

export const drawProceduralBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  arena: ArenaConfig
) => {
  // 1. Fill base background color
  ctx.fillStyle = arena.bgColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Draw details uniquely using level as seed/offset
  const lvl = arena.level;
  ctx.fillStyle = arena.detailColor;
  ctx.strokeStyle = arena.detailColor;

  if (arena.theme === 'FOREST') {
    // Grass blades and trees with unique coordinates/spacings based on level
    const count = 15 + (lvl % 5) * 5;
    for (let i = 0; i < count; i++) {
      const px = (i * 79 + lvl * 13) % width;
      const py = (i * 37 + lvl * 7) % height;
      ctx.fillRect(px, py, 6, 2);
      ctx.fillRect(px + 2, py - 3, 2, 5);
      
      // Draw some glowing moss dots
      ctx.fillStyle = arena.detailColor + '44';
      ctx.beginPath();
      ctx.arc(px - 10, py + 5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = arena.detailColor;
    }
  } else if (arena.theme === 'POISON_CAVES') {
    // Crystals and neon bubbles
    const count = 10 + (lvl % 5) * 4;
    for (let i = 0; i < count; i++) {
      const px = (i * 113 + lvl * 17) % width;
      const py = (i * 43 + lvl * 11) % height;
      
      // Crystal diamond
      ctx.beginPath();
      ctx.moveTo(px, py - 6);
      ctx.lineTo(px + 4, py);
      ctx.lineTo(px, py + 6);
      ctx.lineTo(px - 4, py);
      ctx.closePath();
      ctx.fill();
      
      // Poison bubbles
      ctx.fillStyle = arena.detailColor + '1f'; // low opacity glow
      ctx.beginPath();
      ctx.arc(px + 20, py - 10, 4 + (lvl % 3), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = arena.detailColor;
    }
  } else if (arena.theme === 'RUINS') {
    // Columns, stone patterns, and brick grid lines
    ctx.lineWidth = 1.0;
    const gridSpacing = 40 + (lvl % 5) * 10;
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Crumbled stones
    const stoneCount = 5 + (lvl % 3) * 3;
    for (let i = 0; i < stoneCount; i++) {
      const px = (i * 157 + lvl * 19) % width;
      const py = (i * 73 + lvl * 23) % height;
      ctx.fillRect(px, py, 14, 8);
      ctx.fillStyle = '#000000aa';
      ctx.strokeRect(px, py, 14, 8);
      ctx.fillStyle = arena.detailColor;
    }
  } else if (arena.theme === 'CRYPT') {
    // Archways and crypt runes
    const pillarCount = 3 + (lvl % 3);
    const spacing = width / (pillarCount + 1);
    ctx.lineWidth = 2.0;
    for (let i = 1; i <= pillarCount; i++) {
      const px = i * spacing + (lvl * 11) % 40 - 20;
      // Draw pillars
      ctx.beginPath();
      ctx.moveTo(px - 15, 0);
      ctx.lineTo(px - 15, height);
      ctx.moveTo(px + 15, 0);
      ctx.lineTo(px + 15, height);
      ctx.stroke();
      // Draw arch connectors
      ctx.beginPath();
      ctx.arc(px, 50, 15, Math.PI, 0);
      ctx.stroke();
    }
    // Glowing floor runes
    const runeCount = 8 + (lvl % 4);
    for (let i = 0; i < runeCount; i++) {
      const rx = (i * 131 + lvl * 29) % width;
      const ry = (i * 59 + lvl * 31) % height;
      ctx.font = '8px Orbitron, sans-serif';
      ctx.fillStyle = arena.detailColor + '88';
      ctx.fillText('⚔', rx, ry);
    }
  } else if (arena.theme === 'VOLCANO') {
    // Moving magma waves/lines and floating lava sparks
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    const waveY = height - 50 - (lvl % 10) * 4;
    ctx.moveTo(0, waveY);
    ctx.bezierCurveTo(width / 3, waveY - 30, (width * 2) / 3, waveY + 20, width, waveY - 10);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();

    // Floating embers
    const emberCount = 12 + (lvl % 6) * 3;
    for (let i = 0; i < emberCount; i++) {
      const ex = (i * 97 + lvl * 41) % width;
      const ey = (i * 31 + lvl * 43) % height;
      ctx.fillStyle = '#ff9500';
      ctx.beginPath();
      ctx.arc(ex, ey, 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }
};
