import { Request } from 'express';

export interface UserPayload {
  id: number;
  email: string;
  isGuest?: boolean;
  sub?: number;
}

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}
