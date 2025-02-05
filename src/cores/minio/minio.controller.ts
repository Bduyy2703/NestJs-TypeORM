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
    Delete,
    UploadedFiles,
} from '@nestjs/common';
import { BadRequestException } from '../exceptions/bad-request.exceptions'
import { MinioService } from './minio.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { Public } from '../decorators/public.decorator';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
@Controller('minio')
export class MinioController {
    constructor(private readonly minioService: MinioService) { }

    @Post('upload-multiple/:bucketName')
    @Public()
    @UseInterceptors(FilesInterceptor('files', 10, {
        storage: diskStorage({
            destination: './uploads',
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
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                },
            },
        },
    })
    async uploadMultipleFiles(
        @Param('bucketName') bucketName: string,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files found');
        }
        const uploadResults = [];
        for (const file of files) {
            const filePath = file.path;
            const objectName = file.filename;

            await this.minioService.uploadFile(bucketName, objectName, filePath);
            uploadResults.push({
                fileName: objectName,
                fileUrl: `http://localhost:9000/${bucketName}/${objectName}`,
            });
        }
        return {
            message: 'Files uploaded successfully',
            files: uploadResults,
        };
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
            console.log('error', err)
            throw new HttpException(
                'Error downloading file',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }


    @Get('list/:bucketName')
    @Public()
    async listFiles(
      @Param('bucketName') bucketName: string,
    ) {
      const files = await this.minioService.listFiles(bucketName);
      const fileLinks = files.map(fileName => ({
        name: fileName,
        url: `http://localhost:9000/${bucketName}/${fileName}`
      }));
    
      return {
        message: 'Files retrieved successfully',
        files: fileLinks,
      };
    }

    @Delete('delete/:bucketName/:objectName')
    @Public()
    async deleteFile(
        @Param('bucketName') bucketName: string,
        @Param('objectName') objectName: string,
    ) {
        try {
            await this.minioService.deleteFile(bucketName, objectName);
            return { message: `File "${objectName}" deleted from bucket "${bucketName}" successfully.` };
        } catch (err) {
            throw new HttpException('Error deleting file', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
