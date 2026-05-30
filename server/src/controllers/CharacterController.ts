import { Request, Response, NextFunction } from 'express';
import { CharacterService } from '../services/CharacterService';
import { syncUserUpdate } from '../socket/lobby';

export class CharacterController {
  constructor(private characterService: CharacterService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.characterService.getActiveCharacterPayload(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  selectClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { charClass } = req.body;
      const result = await this.characterService.selectClass(req.user!.id, charClass);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  allocatePassives = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { passives } = req.body;
      const result = await this.characterService.allocatePassives(req.user!.id, passives);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  selectTalents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { talents } = req.body;
      const result = await this.characterService.selectTalents(req.user!.id, talents);
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  reportSoloBattle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { xpGained, goldGained, countOfKills, mapLevel, won } = req.body;
      const result = await this.characterService.reportSoloBattle(req.user!.id, {
        xpGained,
        goldGained,
        countOfKills,
        mapLevel,
        won
      });
      syncUserUpdate(req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const charClass = req.query.class as string | undefined;
      const result = await this.characterService.getLeaderboard(charClass);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

