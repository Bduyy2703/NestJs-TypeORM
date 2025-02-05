import {
    Controller,
    Post,
    Get,
    UploadedFile,
    Param,
    Res,
    UseInterceptors,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { BadRequestException } from '../exceptions/bad-request.exceptions'
import { MinioService } from './minio.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { Public } from '../decorators/public.decorator';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
@Controller('minio')
export class MinioController {
    constructor(private readonly minioService: MinioService) { }

    @Post('upload/:bucketName')
    @Public()
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads', // Thư mục lưu file tạm
            filename: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${file.originalname}`;
                cb(null, uniqueName);
            },
        }),
    }))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    async uploadFile(
        @Param('bucketName') bucketName: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('File not found');
        }
        const filePath = file.path;
        const objectName = file.filename;
        await this.minioService.uploadFile(bucketName, objectName, filePath);
        return { message: `File uploaded to bucket "${bucketName}" successfully.` };
    }

    @Get('download/:bucketName/:objectName')
    @Public()
    async downloadFile(
        @Param('bucketName') bucketName: string,
        @Param('objectName') objectName: string,
        @Res() res: Response,
    ) {
        try {
            const stream = await this.minioService.downloadFile(bucketName, objectName);
            res.set({
                'Content-Disposition': `attachment; filename=${objectName}`,
                'Content-Type': 'application/octet-stream',
            });
            stream.pipe(res);
        } catch (err) {
            console.log('error' , err)
            throw new HttpException(
                'Error downloading file',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
