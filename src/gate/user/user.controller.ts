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
import { UserDTO } from '@domains';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(':id')
    async findById(@Param('id') id: string): Promise<UserDTO | null> {
        return this.userService.findById(id);
    }

    @Get()
    async getList(
        @Query('page', ParseIntPipe) page = 1,
        @Query('limit', ParseIntPipe) limit = 10
    ): Promise<{ items: UserDTO[]; total: number; page: number; limit: number }> {
        return this.userService.getListUsers(page, limit);
    }

    @Post()
    async create(@Body() dto: UserDTO.Create): Promise<UserDTO> {
        return this.userService.create(dto);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UserDTO.Update
    ): Promise<UserDTO> {
        return this.userService.update(id, dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string): Promise<UserDTO> {
        return this.userService.delete(id);
    }
}
