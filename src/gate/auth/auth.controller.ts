import {Controller, Delete, Param, Post} from '@nestjs/common';
import {AuthService} from "./auth.service";
import {UserDTO} from "@domains";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {
    }

    @Post('/login/tg/:tgId')
    async loginTg(
        @Param('tgId') tgId: string,
    ): Promise<UserDTO> {
        return await this.authService.loginTg(tgId)
    }

    @Delete('/logout/tg/:tgId')
    async logoutTg(
        @Param('tgId') tgId: string,
    ): Promise<UserDTO> {
        return await this.authService.logoutTg(tgId)
    }
}
