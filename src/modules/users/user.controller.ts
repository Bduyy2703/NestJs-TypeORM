import { Controller, Get, HttpCode, Param, Post, Query, Redirect } from "@nestjs/common";

@Controller('user')
export class UserController {
    @Post()

    CreateUser() {
        return "create new user "
    }

    @Get('docs')
    @Redirect('https://docs.nestjs.com', 302)
    getDocs(@Query('version') version) {
        if (version && version === '5') {
            return { url: 'https://docs.nestjs.com/v5/' };
        }
    }
    @Get('docs')
    findOne(@Param() params: any): string {
        console.log(params.id);
        return `This action returns a #${params.id} cat`;
    }
    GetUser() {
        return 'user 1';
    }
}