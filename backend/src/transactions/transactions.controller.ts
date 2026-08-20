import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Patch } from '@nestjs/common';
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

  // ROTA DO EXTRATOR: GET /transactions/statement?startDate=2026-06-05&endDate=2026-07-04
  @Get('statement')
  getStatement(
    @GetUser('id') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.transactionsService.findByCustomPeriod(userId, startDate, endDate);
  }

  @Patch(':id')
  update(
    @Param('id') id: string, 
    @Body() updateTransactionDto: any 
  ) {
    return this.transactionsService.update(id, updateTransactionDto);
  }
}