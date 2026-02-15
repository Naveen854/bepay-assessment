import {
    Controller,
    Get,
    Post,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionService } from './transaction.service';

@UseGuards(AuthGuard('jwt'))
@Controller('transactions')
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) { }

    @Get()
    findAll(
        @Request() req: any,
        @Query('orgId') orgId?: string,
        @Query('type') type?: string,
        @Query('status') status?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.transactionService.findAll(req.user.id, {
            orgId,
            type,
            status,
            startDate,
            endDate,
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    @Get('summary')
    getSummary(@Request() req: any) {
        return this.transactionService.getSummary(req.user.id);
    }

    @Get('export')
    @Get('export')
    async exportTransactions(
        @Request() req: any,
        @Query('orgId') orgId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const csv = await this.transactionService.exportTransactionsCsv(req.user.id, {
            orgId,
            startDate,
            endDate,
        });

        // We return the string directly, NestJS handles text/plain or we can set headers
        // Since we want download, we should set headers in a proper response
        // But for simplicity, let's return it as text and let frontend handle blob or 
        // use @Res() to set attachment.

        // Better: Use StreamableFile 
        // import { StreamableFile } from '@nestjs/common';
        // return new StreamableFile(Buffer.from(csv));
        // But we need to update imports.

        // Let's just return the CSV string for now, user can download it.
        return csv;
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req: any) {
        return this.transactionService.findOne(id, req.user.id);
    }

    @Post('sync')
    syncMestaTransactions(
        @Request() req: any,
        @Query('orgId') orgId: string,
    ) {
        return this.transactionService.syncMestaTransactions(req.user.id, orgId);
    }
}
