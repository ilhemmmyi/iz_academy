import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateAccessToken = (payload: JwtPayload): string =>

  jwt.sign(payload, config.jwtAccessSecret, { expiresIn: config.jwtAccessExpires as any });

export const generateRefreshToken = (payload: JwtPayload): string =>
  jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpires as any });

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtAccessSecret, { algorithms: ['HS256'] }) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, config.jwtRefreshSecret, { algorithms: ['HS256'] }) as JwtPayload;
