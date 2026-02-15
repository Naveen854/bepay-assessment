import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../../../database/entities';

export interface JwtPayload {
    sub: string;
    email: string;
}

// Extract JWT from HttpOnly cookie
const cookieExtractor = (req: Request): string | null => {
    if (req && req.cookies) {
        return req.cookies['bepay_session'] || null;
    }
    return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        configService: ConfigService,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
    ) {
        super({
            jwtFromRequest: cookieExtractor,
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('jwt.secret')!,
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.userRepo.findOne({
            where: { id: payload.sub },
            relations: ['organizations'],
        });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }
        return user;
    }
}
