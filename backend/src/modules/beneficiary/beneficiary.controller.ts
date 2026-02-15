import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BeneficiaryService } from './beneficiary.service';
import { CreateBeneficiaryDto, UpdateBeneficiaryDto } from './dto/beneficiary.dto';
import type { RequestWithUser } from '../../shared/types/requests';

@UseGuards(AuthGuard('jwt'))
@Controller('beneficiaries')
export class BeneficiaryController {
    constructor(private readonly beneficiaryService: BeneficiaryService) { }

    @Post()
    create(@Body() dto: CreateBeneficiaryDto, @Request() req: RequestWithUser) {
        return this.beneficiaryService.create(req.user.id, dto);
    }

    @Get()
    findAll(@Request() req: RequestWithUser, @Query('orgId') orgId?: string) {
        return this.beneficiaryService.findAll(req.user.id, orgId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
        return this.beneficiaryService.findOne(id, req.user.id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateBeneficiaryDto,
        @Request() req: RequestWithUser,
    ) {
        return this.beneficiaryService.update(id, req.user.id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: RequestWithUser) {
        return this.beneficiaryService.remove(id, req.user.id);
    }

    @Post(':id/verify')
    verify(@Param('id') id: string, @Request() req: RequestWithUser) {
        return this.beneficiaryService.verify(id, req.user.id);
    }
}
