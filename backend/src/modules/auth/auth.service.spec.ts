import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../database/entities';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('uuid', () => ({
    v4: () => 'test-uuid',
}));

describe('AuthService', () => {
    let service: AuthService;
    let userRepo: any;
    let jwtService: any;

    const mockUserRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(() => 'mock-token'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepo,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepo = module.get(getRepositoryToken(User));
        jwtService = module.get(JwtService);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('register', () => {
        it('should successfully register a new user', async () => {
            mockUserRepo.findOne.mockResolvedValue(null);
            mockUserRepo.create.mockReturnValue({ id: '1', email: 'test@example.com' });
            mockUserRepo.save.mockResolvedValue({ id: '1', email: 'test@example.com' });

            const result = await service.register({
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
            });

            expect(result).toHaveProperty('accessToken');
            expect(mockUserRepo.create).toHaveBeenCalled();
            expect(mockUserRepo.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if email exists', async () => {
            mockUserRepo.findOne.mockResolvedValue({ id: '1' });

            await expect(
                service.register({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    describe('changePassword', () => {
        it('should change password successfully', async () => {
            const user = {
                id: '1',
                passwordHash: await bcrypt.hash('oldPassword', 10),
            };
            mockUserRepo.findOne.mockResolvedValue(user);
            mockUserRepo.save.mockResolvedValue({ ...user });

            const result = await service.changePassword('1', {
                currentPassword: 'oldPassword',
                newPassword: 'newPassword123',
            });

            expect(result.message).toBe('Password updated successfully');
            expect(mockUserRepo.save).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException for invalid current password', async () => {
            const user = {
                id: '1',
                passwordHash: await bcrypt.hash('oldPassword', 10),
            };
            mockUserRepo.findOne.mockResolvedValue(user);

            await expect(
                service.changePassword('1', {
                    currentPassword: 'wrongPassword',
                    newPassword: 'newPassword123',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});
