import { Request } from 'express';
import { User } from './shared';

export interface RequestWithUser extends Request {
    user: User;
}
