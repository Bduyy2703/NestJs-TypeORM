import {
    Controller,
    Post,
    Get,
    Param,
    Res,
    UseInterceptors,
    HttpException,
    HttpStatus,
    Delete,
    UploadedFiles,
} from '@nestjs/common';
import { BadRequestException } from '../../../cores/exceptions/bad-request.exceptions'
import { MinioService } from './minio.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import multer from 'multer';
import { Public } from '../../../cores/decorators/public.decorator';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { FileRepository } from 'src/modules/files/file.repository';

@Controller('minio')
export class MinioController {
    constructor(
        private readonly minioService: MinioService,
        private readonly fileRepository: FileRepository
    ) { }


    @Post('upload-multiple/:bucketName')
    @Public()
    @UseInterceptors(FilesInterceptor('files', 10, {
        storage: multer.memoryStorage(), // Chỉ lưu file trong bộ nhớ tạm
        limits: { fileSize: 100 * 1024 * 1024 }, // Giới hạn file 100MB
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
            const uuid = uuidv4();
            const objectName = `${Date.now()}-${uuid}-${file.originalname}`;

            // Upload trực tiếp từ buffer thay vì file path
            await this.minioService.uploadFileFromBuffer(
                bucketName,
                objectName,
                file.buffer,
                file.mimetype,
             );
            const fileUrlList = await this.minioService.getUrlByName(bucketName, [objectName]);
            // Lưu thông tin file vào DB
            const fileData = await this.fileRepository.createFile({
                fileId: uuid,
                bucketName,
                fileName: objectName,
                fileUrl: fileUrlList[0]
            });
            uploadResults.push(fileData);
        }
        return {
            message: 'Files uploaded successfully',
            files: uploadResults,
        };
    }


    @Get('download/:uuid')
    @Public()
    async downloadFile(
        @Param('uuid') uuid: string,
        @Res() res: Response,
    ) {
        try {
            const fileData = await this.fileRepository.findByFileId(uuid);
            if (!fileData) {
                throw new HttpException('File not found', HttpStatus.NOT_FOUND);
            }
            const stream = await this.minioService.downloadFile(fileData.bucketName, fileData.fileName);
            res.set({
                'Content-Disposition': `attachment; filename=${fileData.fileName}`,
                'Content-Type': 'application/octet-stream',
            });
            stream.pipe(res);
        } catch (err) {
            console.log('error', err);
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
        const files = await this.fileRepository.findFilesByBucketName(bucketName);
        if (!files || files.length === 0) {
            throw new HttpException('No files found in the database', HttpStatus.NOT_FOUND);
          }
        
          const fileLinks = files.map(file => ({
            id: file.fileId,
            name: file.fileName,
            url: file.fileUrl, // Lấy URL đã lưu trong DB
          }));
        
          return {
            message: 'Files retrieved successfully',
            files: fileLinks,
          };    
    }


    @Delete('delete/:uuid')
    @Public()
    async deleteFile(
        @Param('uuid') uuid: string,
    ) {
        try {

            const fileData = await this.fileRepository.findByFileId(uuid);
            if (!fileData) {
                throw new HttpException('File not found', HttpStatus.NOT_FOUND);
            }

            await this.minioService.deleteFile(fileData.bucketName, fileData.fileName);

            await this.fileRepository.Delete(fileData.fileId);

            return { message: `File "${fileData.fileName}" deleted from bucket "${fileData.bucketName}" successfully.` };
        } catch (err) {
            throw new HttpException('Error deleting file', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }


    @Get('url/:uuid')
    @Public()
    async getUrlByName(
        @Param('uuid') uuids: string,
    ) {
        try {
            const uuidList = uuids.split(',');
            const fileUrls = [];
            for (const uuid of uuidList) {
                const fileData = await this.fileRepository.findByFileId(uuid);
                const fileUrlList = await this.minioService.getUrlByName(fileData.bucketName, [fileData.fileName]);

                if (fileUrlList.length > 0) {
                    const fileUrl = fileUrlList[0];

                    // Cập nhật URL mới vào database
                    await this.fileRepository.updateFileUrl(uuid, fileUrl);

                    fileUrls.push({ uuid, url: fileUrl });
                }
            }
            return {
                message: 'Danh sách URL:',
                urls: fileUrls
            };
        } catch (err) {
            console.log("error", err)
            throw new HttpException('Error fetching file URLs', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
