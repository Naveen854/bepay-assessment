import {
    Injectable,
    ConflictException,
    UnauthorizedException,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../database/entities';
import {
    RegisterDto,
    LoginDto,
    InviteUserDto,
    AcceptInviteDto,
    ChangePasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const existing = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = this.userRepo.create({
            email: dto.email,
            name: dto.name,
            passwordHash,
            onboardingStatus: 'new',
        });

        const saved = await this.userRepo.save(user);
        return this.buildAuthResponse(saved);
    }

    async login(dto: LoginDto) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email },
        });
        if (!user || !user.passwordHash) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.buildAuthResponse(user);
    }

    async inviteUser(dto: InviteUserDto) {
        let user = await this.userRepo.findOne({
            where: { email: dto.email },
        });

        if (user) {
            throw new ConflictException('User already exists');
        }

        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        user = this.userRepo.create({
            email: dto.email,
            name: dto.name,
            inviteToken: token,
            inviteExpiresAt: expiresAt,
        });

        await this.userRepo.save(user);

        // In production, send email with link
        const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/invite?token=${token}`;
        this.logger.log(`Invite link for ${dto.email}: ${inviteLink}`);

        return { message: 'Invite sent', token }; // Return token for dev convenience
    }

    async acceptInvite(dto: AcceptInviteDto) {
        const user = await this.userRepo.findOne({
            where: {
                inviteToken: dto.token,
                inviteExpiresAt: MoreThan(new Date()),
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid or expired invite token');
        }

        const passwordHash = await bcrypt.hash(dto.password, 12);

        // Consume the token and set password
        user.inviteToken = null as any;
        user.inviteExpiresAt = null as any;
        user.passwordHash = passwordHash;

        const saved = await this.userRepo.save(user);

        return this.buildAuthResponse(saved);
    }

    async getProfile(userId: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['organizations'],
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.sanitizeUser(user);
    }

    private buildAuthResponse(user: User) {
        const payload = { sub: user.id, email: user.email };
        return {
            user: this.sanitizeUser(user),
            accessToken: this.jwtService.sign(payload),
        };
    }

    async updateOnboardingStatus(userId: string, status: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        user.onboardingStatus = status;
        const saved = await this.userRepo.save(user);
        return this.sanitizeUser(saved);
    }

    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user || !user.passwordHash) {
            throw new NotFoundException('User not found');
        }

        const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid current password');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        user.passwordHash = passwordHash;
        await this.userRepo.save(user);

        return { message: 'Password updated successfully' };
    }

    private sanitizeUser(user: User) {
        const { passwordHash, inviteToken, inviteExpiresAt, ...rest } =
            user;
        return rest;
    }
}
