import { Controller, Post, Body, Delete, UseGuards, Request, Patch, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateProfile(@Request() req: any, @Body() updateData: { name: string }) {
    return this.usersService.update(req.user.id, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  deleteAccount(@Request() req: any) {
    return this.usersService.remove(req.user.id);
  }
}