import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLoginDTO } from 'src/auth/domain/dto/create-login.dto';
import { AuthServiceRepository } from 'src/auth/domain/repositories/authServiceRepository';
import { CustomError } from 'src/shared/utils/Custom_error';
import { User } from 'src/users/infraestructure/ports/mysql/user.entity';
import { Repository } from 'typeorm';
import { TokenService } from './token.service';
import { CreateUserDto } from 'src/users/domain/dto';

@Injectable()
export class AuthService implements AuthServiceRepository {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}
  async loginService(user: CreateLoginDTO): Promise<string> {
    try {
      const loginUser = await this.userRepository.findOne({
        where: {
          email: user?.email,
          passwordUser: user?.passwordUser,
        },
      });
      if (loginUser) {
        const { username, id } = loginUser;
        const token = this.tokenService.signToken({ id, username });
        return token;
      } else {
        throw new CustomError('NOT_FOUND', 'Credenciales Invalidas');
      }
    } catch (err) {
      throw CustomError.createCustomError(err.message);
    }
  }
  async registerService(user: CreateUserDto): Promise<string> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: {
          email: user?.email,
          username: user?.username,
        },
      });
      if (!existingUser) {
        //encriptar contraseña
        const newUser = await this.userRepository.save(user);
        const { id, username } = newUser;
        const token = await this.tokenService.signToken({ id, username });
        return token;
      }
      throw new CustomError(
        'CONFLICT',
        `usuario con email: ${user?.email} existente`,
      );
    } catch (error) {
      throw CustomError.createCustomError(error.message);
    }
  }
}
