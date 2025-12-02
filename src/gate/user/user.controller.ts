import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
    ParseIntPipe
} from '@nestjs/common';
import { UserService } from './user.service';
import {UserDTO, UserRole} from '@domains';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    async getList(
        @Query('page', ParseIntPipe) page = 1,
        @Query('limit', ParseIntPipe) limit = 10,
        @Query('role') role?: string,
    ): Promise<{ items: UserDTO[]; total: number; page: number; limit: number }> {
        return await this.userService.getListUsers(page, limit, role as UserRole);
    }

    @Post()
    async create(@Body() dto: UserDTO.Create): Promise<UserDTO> {
        return await this.userService.create(dto);
    }

    @Post('/bulk')
    async createMany(@Body() dto: UserDTO.Create[]): Promise<UserDTO[]> {
        return await this.userService.createMany(dto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UserDTO.Update
    ): Promise<UserDTO> {
        return await this.userService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string): Promise<UserDTO> {
        return await this.userService.delete(id);
    }
}
