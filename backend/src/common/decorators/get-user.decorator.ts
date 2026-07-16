import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Esse decorator extrai o usuário decodificado pelo JWT da requisição
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (data) {
      return request.user?.[data];
    }
    return request.user;
  },
);