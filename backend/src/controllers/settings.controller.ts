import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const rows = await prisma.siteSetting.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.json(settings);
  } catch {
    res.status(500).json({ message: 'Failed to fetch settings.' });
  }
};

export const updateSetting = async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    if (!key || typeof value !== 'string') {
      return res.status(400).json({ message: 'key and value are required.' });
    }
    const row = await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    res.json(row);
  } catch {
    res.status(500).json({ message: 'Failed to update setting.' });
  }
};
