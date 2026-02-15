import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PayoutService } from './payout.service';
import { CreateQuoteDto, CreateOrderDto } from './dto/payout.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('payouts')
export class PayoutController {
    constructor(private readonly payoutService: PayoutService) { }

    @Post('quote')
    createQuote(@Body() dto: CreateQuoteDto, @Request() req: any) {
        return this.payoutService.createQuote(req.user.id, dto);
    }

    @Post('order')
    createOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
        return this.payoutService.createOrder(req.user.id, dto);
    }

    @Get()
    list(@Request() req: any, @Query('orgId') orgId?: string) {
        return this.payoutService.listPayouts(req.user.id, orgId);
    }

    @Get(':id')
    getOrder(@Param('id') id: string, @Request() req: any) {
        return this.payoutService.getOrder(req.user.id, id);
    }

    @Post(':id/cancel')
    cancel(@Param('id') id: string, @Request() req: any) {
        return this.payoutService.cancelOrder(req.user.id, id);
    }
}
