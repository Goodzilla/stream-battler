// 16x16 Programmatic Pixel-Art Sprites Grid Dictionary

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
  GOBLIN: [
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
  ORC: [
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
  SNAKE: [
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
  DRAGON: [
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
  LICH: [
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
  ]
};

export const drawPixelSprite = (
  ctx: CanvasRenderingContext2D,
  cx: number, // Center X
  cy: number, // Center Y
  spriteName: string,
  pixelSize: number = 2.5,
  isFacingLeft: boolean = false,
  classColor: string = '#00d8ff'
) => {
  const grid = SPRITES[spriteName.toUpperCase()] || SPRITES.GOBLIN;
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

      ctx.fillStyle = color;
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
