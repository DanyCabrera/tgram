import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  
  @Post('avatar')
  @ApiOperation({ summary: 'Subir avatar de usuario' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Avatar subido exitosamente' })
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        cb(null, join(process.cwd(), 'uploads', 'avatars'));
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Solo se permiten archivos de imagen (JPG, JPEG, PNG, GIF, WEBP)'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    
    return {
      message: 'Avatar subido exitosamente',
      avatarUrl: avatarUrl,
    };
  }

  @Post('cover')
  @ApiOperation({ summary: 'Subir imagen de portada de usuario' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Imagen de portada subida exitosamente' })
  @UseInterceptors(FileInterceptor('cover', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        cb(null, join(process.cwd(), 'uploads', 'covers'));
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Solo se permiten archivos de imagen (JPG, JPEG, PNG, GIF, WEBP)'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async uploadCover(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    const coverUrl = `/uploads/covers/${file.filename}`;
    
    return {
      message: 'Imagen de portada subida exitosamente',
      coverUrl: coverUrl,
    };
  }
}
