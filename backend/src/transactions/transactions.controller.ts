import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto, @GetUser('id') userId: string) {
    return this.transactionsService.create(createTransactionDto, userId);
  }

  @Get()
  findAll(@GetUser('id') userId: string) {
    return this.transactionsService.findAllByUser(userId);
  }

  @Get('summary')
  getSummary(@GetUser('id') userId: string) {
    return this.transactionsService.getSummary(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.transactionsService.remove(id, userId);
  }
}