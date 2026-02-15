import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationService } from './organization.service';
import {
    CreateOrganizationDto,
    UpdateOrganizationDto,
} from './dto/organization.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('organizations')
export class OrganizationController {
    constructor(private readonly orgService: OrganizationService) { }

    @Post()
    create(@Request() req: any, @Body() dto: CreateOrganizationDto) {
        return this.orgService.create(req.user.id, dto);
    }

    @Get()
    findAll(@Request() req: any) {
        return this.orgService.findByUser(req.user.id);
    }

    @Get(':id')
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.orgService.findOne(id, req.user.id);
    }

    @Patch(':id')
    update(
        @Request() req: any,
        @Param('id') id: string,
        @Body() dto: UpdateOrganizationDto,
    ) {
        return this.orgService.update(id, req.user.id, dto);
    }
}
