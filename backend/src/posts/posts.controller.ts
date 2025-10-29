import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  UseGuards, 
  Request,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear nuevo post' })
  @ApiResponse({ status: 201, description: 'Post creado exitosamente' })
  async createPost(@Request() req, @Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(req.user.id, createPostDto);
  }

  @Post('with-media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('media', 10, {
    storage: diskStorage({
      destination: './uploads/posts',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      }
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|mp4|webm)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen y video'), false);
      }
    },
  }))
  @ApiOperation({ summary: 'Crear nuevo post con media' })
  @ApiResponse({ status: 201, description: 'Post con media creado exitosamente' })
  async createPostWithMedia(
    @Request() req,
    @Body('content') content: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.postsService.createPostWithMedia(req.user.id, content, files);
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener feed de publicaciones' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiResponse({ status: 200, description: 'Feed de publicaciones' })
  async getFeed(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postsService.getFeed(req.user.id, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener post por ID' })
  @ApiResponse({ status: 200, description: 'Post encontrado' })
  @ApiResponse({ status: 404, description: 'Post no encontrado' })
  async getPostById(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar post' })
  @ApiResponse({ status: 200, description: 'Post actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Post no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para editar este post' })
  async updatePost(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(req.user.id, id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar post' })
  @ApiResponse({ status: 200, description: 'Post eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Post no encontrado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos para eliminar este post' })
  async deletePost(@Request() req, @Param('id') id: string) {
    await this.postsService.deletePost(req.user.id, id);
    return { message: 'Post eliminado exitosamente' };
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar like a un post' })
  @ApiResponse({ status: 200, description: 'Like agregado exitosamente' })
  @ApiResponse({ status: 404, description: 'Post no encontrado' })
  @ApiResponse({ status: 403, description: 'Ya has dado like a este post' })
  async likePost(@Request() req, @Param('id') postId: string) {
    await this.postsService.likePost(req.user.id, postId);
    return { message: 'Like agregado exitosamente' };
  }

  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar like de un post' })
  @ApiResponse({ status: 200, description: 'Like removido exitosamente' })
  @ApiResponse({ status: 404, description: 'No has dado like a este post' })
  async unlikePost(@Request() req, @Param('id') postId: string) {
    await this.postsService.unlikePost(req.user.id, postId);
    return { message: 'Like removido exitosamente' };
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comentar en un post' })
  @ApiResponse({ status: 201, description: 'Comentario creado exitosamente' })
  @ApiResponse({ status: 404, description: 'Post no encontrado' })
  async createComment(
    @Request() req,
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.postsService.createComment(req.user.id, postId, createCommentDto);
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener comentarios de un post' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  @ApiResponse({ status: 200, description: 'Lista de comentarios' })
  async getComments(
    @Param('id') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.postsService.getComments(postId, page, limit);
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dar like a un comentario' })
  @ApiResponse({ status: 200, description: 'Like agregado exitosamente' })
  @ApiResponse({ status: 404, description: 'Comentario no encontrado' })
  @ApiResponse({ status: 403, description: 'Ya has dado like a este comentario' })
  async likeComment(@Request() req, @Param('id') commentId: string) {
    await this.postsService.likeComment(req.user.id, commentId);
    return { message: 'Like agregado exitosamente' };
  }

  @Delete('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Quitar like de un comentario' })
  @ApiResponse({ status: 200, description: 'Like removido exitosamente' })
  @ApiResponse({ status: 404, description: 'No has dado like a este comentario' })
  async unlikeComment(@Request() req, @Param('id') commentId: string) {
    await this.postsService.unlikeComment(req.user.id, commentId);
    return { message: 'Like removido exitosamente' };
  }

}
