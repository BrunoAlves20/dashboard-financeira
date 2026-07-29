import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
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
    // CORREÇÃO AQUI: userId primeiro, depois createTransactionDto
    return this.transactionsService.create(userId, createTransactionDto);
  }

  @Get()
  findAll(@GetUser('id') userId: string, @Query('month') month?: string, @Query('year') year?: string) {
    return this.transactionsService.findAllByUser(
      userId, 
      month ? Number(month) : undefined, 
      year ? Number(year) : undefined
    );
  }

  @Get('summary')
  getSummary(@GetUser('id') userId: string, @Query('month') month?: string, @Query('year') year?: string) {
    return this.transactionsService.getSummary(
      userId, 
      month ? Number(month) : undefined, 
      year ? Number(year) : undefined
    );
  }
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('id') userId: string) {
    return this.transactionsService.remove(id, userId);
  }
}