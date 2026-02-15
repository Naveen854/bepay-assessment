import {
    Controller,
    Post,
    Get,
    Body,
    UseGuards,
    Request,
    Response,
    HttpCode,
    Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import {
    RegisterDto,
    LoginDto,
    InviteUserDto,
    AcceptInviteDto,
    UpdateOnboardingDto,
    ChangePasswordDto,
} from './dto/auth.dto';
import { AuthService } from './auth.service';

const COOKIE_NAME = 'bepay_session';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) { }

    private setCookieAndRespond(
        res: ExpressResponse,
        result: { user: any; accessToken: string },
    ) {
        const isProduction = process.env.NODE_ENV === 'production';

        res.cookie(COOKIE_NAME, result.accessToken, {
            httpOnly: true,       // Not accessible via JavaScript — prevents XSS token theft
            secure: isProduction, // HTTPS only in production
            sameSite: 'strict',   // Prevents CSRF — cookie not sent on cross-origin requests
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });

        return res.json({ user: result.user });
    }

    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Response() res: ExpressResponse,
    ) {
        const result = await this.authService.register(dto);
        return this.setCookieAndRespond(res, result);
    }

    @Post('login')
    @HttpCode(200)
    async login(
        @Body() dto: LoginDto,
        @Response() res: ExpressResponse,
    ) {
        const result = await this.authService.login(dto);
        return this.setCookieAndRespond(res, result);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('invite')
    inviteUser(@Body() dto: InviteUserDto) {
        // TODO: check if req.user is admin? For now allow any auth user to invite.
        return this.authService.inviteUser(dto);
    }

    @Post('invite/accept')
    async acceptInvite(
        @Body() dto: AcceptInviteDto,
        @Response() res: ExpressResponse,
    ) {
        const result = await this.authService.acceptInvite(dto);
        return this.setCookieAndRespond(res, result);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Patch('onboarding')
    updateOnboarding(@Body() dto: UpdateOnboardingDto, @Request() req: any) {
        return this.authService.updateOnboardingStatus(req.user.id, dto.status);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('change-password')
    changePassword(@Body() dto: ChangePasswordDto, @Request() req: any) {
        return this.authService.changePassword(req.user.id, dto);
    }

    @Post('logout')
    @HttpCode(200)
    logout(@Response() res: ExpressResponse) {
        res.clearCookie(COOKIE_NAME, { path: '/' });
        return res.json({ message: 'Logged out' });
    }
}
