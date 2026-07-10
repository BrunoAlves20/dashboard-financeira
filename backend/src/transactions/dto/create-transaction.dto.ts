export class CreateTransactionDto {
  title!: string;
  amount!: number;
  type!: string;   
  category!: string;
  date!: string;
  userId!: string;
}