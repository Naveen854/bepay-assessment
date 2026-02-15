import { Controller, Post, Get, Param, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import * as fs from 'fs';

@Controller('uploads')
export class UploadController {
    @Post()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
            }
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }))
    uploadFile(@UploadedFile() file: any) {
        if (!file) throw new BadRequestException('File is required');
        // Return relative URL that points to our GET endpoint
        return { url: `/api/uploads/${file.filename}` };
    }

    @Get(':filename')
    serveFile(@Param('filename') filename: string, @Res() res: Response) {
        const root = './uploads';
        if (!fs.existsSync(`${root}/${filename}`)) {
            throw new BadRequestException('File not found');
        }
        res.sendFile(filename, { root });
    }
}
