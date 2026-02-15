import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KycService } from './kyc.service';
import { CreateSenderDto, UploadDocumentDto } from './dto/kyc.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('kyc')
export class KycController {
    constructor(private readonly kycService: KycService) { }

    @Post(':orgId/sender')
    createSender(
        @Param('orgId') orgId: string,
        @Body() dto: CreateSenderDto,
        @Request() req: any,
    ) {
        return this.kycService.createSender(orgId, req.user.id, dto);
    }

    @Get(':orgId/status')
    getKycStatus(@Param('orgId') orgId: string, @Request() req: any) {
        return this.kycService.getKycStatus(orgId, req.user.id);
    }

    @Post(':orgId/documents')
    uploadDocument(
        @Param('orgId') orgId: string,
        @Body() dto: UploadDocumentDto,
        @Request() req: any,
    ) {
        return this.kycService.uploadDocument(orgId, req.user.id, dto);
    }

    @Post(':orgId/verify')
    submitForVerification(
        @Param('orgId') orgId: string,
        @Request() req: any,
    ) {
        return this.kycService.submitForVerification(orgId, req.user.id);
    }
}
