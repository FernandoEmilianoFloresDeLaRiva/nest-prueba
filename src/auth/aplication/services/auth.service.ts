import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLoginDTO } from 'src/auth/domain/dto/create-login.dto';
import { AuthServiceRepository } from 'src/auth/domain/repositories/authServiceRepository';
import { CustomError } from 'src/shared/utils/Custom_error';
import { User } from 'src/users/infraestructure/ports/mysql/user.entity';
import { Repository } from 'typeorm';
import { TokenService } from './token.service';
import { CreateUserDto } from 'src/users/domain/dto';
import { HashedPasswordService } from './hashedPassword.service';

@Injectable()
export class AuthService implements AuthServiceRepository {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @Inject(TokenService) private readonly tokenService: TokenService,
    @Inject(HashedPasswordService)
    private readonly hashedPasswordService: HashedPasswordService,
  ) {}
  async loginService(user: CreateLoginDTO): Promise<any> {
    try {
      const loginUser = await this.userRepository.findOne({
        where: {
          email: user?.email,
        },
      });
      if (loginUser) {
        const { username, id, passwordUser: passwordOriginal } = loginUser;
        const { passwordUser: passwordReq } = user;
        const isValid = await this.hashedPasswordService.comparePassword(
          passwordOriginal,
          passwordReq,
        );
        if (!isValid) {
          throw new CustomError('UNAUTHORIZED', 'Credenciales invalidas');
        }
        const token = this.tokenService.signToken({ id, username });
        return token;
      } else {
        throw new CustomError('NOT_FOUND', 'Credenciales Invalidas');
      }
    } catch (err) {
      throw CustomError.createCustomError(err.message);
    }
  }
  async registerService(user: CreateUserDto): Promise<any> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: {
          email: user?.email,
          username: user?.username,
        },
      });
      if (!existingUser) {
        const { passwordUser } = user;
        //encriptar contraseña
        const passwordHashed =
          await this.hashedPasswordService.encodePassword(passwordUser);
        const newUser = {
          ...user,
          passwordUser: passwordHashed,
        };
        const userCreated = await this.userRepository.save(newUser);
        const { id, username } = userCreated;
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
