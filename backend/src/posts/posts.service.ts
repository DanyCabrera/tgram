import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { User } from '../entities/user.entity';
import { Media } from '../entities/media.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../websocket/websocket.gateway';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private notificationsService: NotificationsService,
    private webSocketGateway: RealtimeGateway,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto): Promise<Post> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const post = this.postRepository.create({
      ...createPostDto,
      authorId: userId,
    });

    return this.postRepository.save(post);
  }

  async getFeed(userId: string, page: number = 1, limit: number = 10) {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Mostrar TODOS los posts de TODOS los usuarios (feed global)
    const [posts, total] = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('post.likes', 'likes')
      .leftJoinAndSelect('likes.user', 'likeUser')
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('comments.createdAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPostById(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'comments', 'comments.author', 'likes', 'likes.user'],
    });

    if (!post) {
      throw new NotFoundException('Post no encontrado');
    }

    return post;
  }

  async updatePost(userId: string, postId: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post no encontrado');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('No tienes permisos para editar este post');
    }

    Object.assign(post, updatePostDto);
    post.isEdited = true;

    return this.postRepository.save(post);
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post no encontrado');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este post');
    }

    await this.postRepository.remove(post);
  }

  async likePost(userId: string, postId: string): Promise<void> {
    const post = await this.postRepository.findOne({ 
      where: { id: postId },
      relations: ['author']
    });
    if (!post) {
      throw new NotFoundException('Post no encontrado');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { userId, postId },
    });

    if (existingLike) {
      throw new ForbiddenException('Ya has dado like a este post');
    }

    const like = this.likeRepository.create({
      userId,
      postId,
    });

    await this.likeRepository.save(like);

    // Actualizar contador de likes
    post.likesCount += 1;
    await this.postRepository.save(post);

    // Crear notificación para el autor del post (si no es el mismo usuario)
    if (post.authorId !== userId) {
      await this.notificationsService.createLikeNotification(
        post.authorId,
        userId,
        postId
      );

      // Enviar notificación en tiempo real
      const liker = await this.userRepository.findOne({ where: { id: userId } });
      if (liker) {
        this.webSocketGateway.sendLikeNotification(post.authorId, {
          postId,
          likerName: liker.name,
          likerId: userId
        });
      }
    }

    // Emitir actualización de contadores en tiempo real
    this.webSocketGateway.updatePostCounters(postId, {
      likesCount: post.likesCount,
      commentsCount: post.commentsCount
    });
  }

  async unlikePost(userId: string, postId: string): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { userId, postId },
    });

    if (!like) {
      throw new NotFoundException('No has dado like a este post');
    }

    await this.likeRepository.remove(like);

    // Actualizar contador de likes
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (post) {
      post.likesCount -= 1;
      await this.postRepository.save(post);

      // Emitir actualización de contadores en tiempo real
      this.webSocketGateway.updatePostCounters(postId, {
        likesCount: post.likesCount,
        commentsCount: post.commentsCount
      });
    }
  }

  async createComment(userId: string, postId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const post = await this.postRepository.findOne({ 
      where: { id: postId },
      relations: ['author']
    });
    if (!post) {
      throw new NotFoundException('Post no encontrado');
    }

    const comment = this.commentRepository.create({
      ...createCommentDto,
      authorId: userId,
      postId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Actualizar contador de comentarios
    post.commentsCount += 1;
    await this.postRepository.save(post);

    // Crear notificación para el autor del post (si no es el mismo usuario)
    if (post.authorId !== userId) {
      await this.notificationsService.createCommentNotification(
        post.authorId,
        userId,
        postId,
        savedComment.id
      );

      // Enviar notificación en tiempo real
      const commenter = await this.userRepository.findOne({ where: { id: userId } });
      if (commenter) {
        this.webSocketGateway.sendCommentNotification(post.authorId, {
          postId,
          commenterName: commenter.name,
          commenterId: userId,
          commentId: savedComment.id
        });
      }
    }

    // Emitir actualización de contadores en tiempo real
    this.webSocketGateway.updatePostCounters(postId, {
      likesCount: post.likesCount,
      commentsCount: post.commentsCount
    });

    return savedComment;
  }

  async getComments(postId: string, page: number = 1, limit: number = 10) {
    const [comments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.likes', 'likes')
      .where('comment.postId = :postId', { postId })
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async likeComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { userId, commentId },
    });

    if (existingLike) {
      throw new ForbiddenException('Ya has dado like a este comentario');
    }

    const like = this.likeRepository.create({
      userId,
      commentId,
    });

    await this.likeRepository.save(like);

    // Actualizar contador de likes
    comment.likesCount += 1;
    await this.commentRepository.save(comment);
  }

  async unlikeComment(userId: string, commentId: string): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { userId, commentId },
    });

    if (!like) {
      throw new NotFoundException('No has dado like a este comentario');
    }

    await this.likeRepository.remove(like);

    // Actualizar contador de likes
    const comment = await this.commentRepository.findOne({ where: { id: commentId } });
    if (comment) {
      comment.likesCount -= 1;
      await this.commentRepository.save(comment);
    }
  }

  async createPostWithMedia(userId: string, content: string, files: Express.Multer.File[]): Promise<Post> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Crear el post
    const post = this.postRepository.create({
      content,
      authorId: userId,
    });

    const savedPost = await this.postRepository.save(post);

    // Crear registros de media para cada archivo
    if (files && files.length > 0) {
      const mediaPromises = files.map(file => {
        const media = this.mediaRepository.create({
          type: file.mimetype.startsWith('video/') ? 'video' : 'image',
          url: `http://localhost:3001/uploads/posts/${file.filename}`,
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          postId: savedPost.id,
        });
        return this.mediaRepository.save(media);
      });

      await Promise.all(mediaPromises);
    }

    // Retornar el post con todas las relaciones
    const postWithRelations = await this.postRepository.findOne({
      where: { id: savedPost.id },
      relations: ['author', 'media', 'comments', 'likes'],
    });

    if (!postWithRelations) {
      throw new NotFoundException('Post no encontrado después de la creación');
    }

    return postWithRelations;
  }

}
