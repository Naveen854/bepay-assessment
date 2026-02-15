import { Module, Global } from '@nestjs/common';
import { MestaService } from './mesta.service';

@Global()
@Module({
    providers: [MestaService],
    exports: [MestaService],
})
export class MestaModule { }
