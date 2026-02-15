import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(2)
    name: string;

    @IsString()
    @MinLength(8)
    password: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class InviteUserDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(2)
    name: string;
}

export class AcceptInviteDto {
    @IsString()
    token: string;

    @IsString()
    @MinLength(8)
    password: string;
}

export class UpdateOnboardingDto {
    @IsString()
    status: string;
}

export class ChangePasswordDto {
    @IsString()
    currentPassword: string;

    @IsString()
    @MinLength(8)
    newPassword: string;
}
