import { Request } from 'express';

export interface UserPayload {
  id: number | string;
  email: string;
  isGuest?: boolean;
  sub?: number | string;
}

export interface AuthenticatedRequest extends Request {
  user: UserPayload;
}
