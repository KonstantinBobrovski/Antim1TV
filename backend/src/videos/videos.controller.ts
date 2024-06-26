import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    ParseIntPipe,
    Put,
    Query,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { Rights } from '../auth/decorators/Rights.decorator';
import { RightsEnum } from '../users/entities/Enums/rights.enum';
import { User } from '../auth/decorators/user.decorator';
import { UserDto } from '../users/dto/user.dto';
import { RightsGuard } from '../auth/guards/rights.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { VideoDto } from './dto/video.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PositivePipe } from '../common/pipes/positive.pipe';
import { VoteDTO } from './dto/vote.dto';
import { RangePipe } from '../common/pipes/range.pipe';

@ApiTags('Videos')
@UseGuards(AuthGuard)
@Controller('videos')
export class VideosController {
    constructor(private readonly videosService: VideosService) {}

    @Post()
    @Rights([RightsEnum.Suggest])
    @UseGuards(RightsGuard)
    @ApiResponse({
        type: VideoDto,
    })
    create(@Body() createVideoDto: CreateVideoDto, @User() user: UserDto) {
        return this.videosService.suggest(createVideoDto, user);
    }

    @Get('/voting')
    @Rights([RightsEnum.Suggest])
    @UseGuards(RightsGuard)
    @ApiResponse({
        description: 'Videos which should be able to vote from frontend',
        type: [VideoDto],
    })
    getForVoting(@User() user: UserDto) {
        return this.videosService.getForvote(30, user);
    }

    @Get('/unmoderated')
    @Rights([RightsEnum.Suggest])
    @UseGuards(RightsGuard)
    @ApiResponse({
        description: 'Unmoderatted videos',
        type: [VideoDto],
    })
    getForModerating(
        @Query('take', ParseIntPipe, new RangePipe(1, 30)) take: number,
        @Query('skip', ParseIntPipe, PositivePipe) skip: number,
    ) {
        return this.videosService.getUnmoderated(take, skip);
    }

    @Put('/:id/allow')
    @Rights([RightsEnum.AllowVideo])
    @UseGuards(RightsGuard)
    @ApiResponse({
        type: VideoDto,
    })
    async allow(@Param('id', ParseIntPipe, PositivePipe) id: number, @User() user: UserDto) {
        return await this.videosService.Allow(id, user);
    }

    @Put('/:id/disallow')
    @Rights([RightsEnum.AllowVideo])
    @UseGuards(RightsGuard)
    @ApiResponse({
        type: VideoDto,
    })
    async disallow(@Param('id', ParseIntPipe, PositivePipe) id: number, @User() user: UserDto) {
        return await this.videosService.disallow(id, user);
    }

    @Put('/allowed/:id/vote')
    @ApiResponse({
        description: 'returns created vote if operation was sucsedd.',
        type: VoteDTO,
    })
    async vote(@Param('id', ParseIntPipe, PositivePipe) id: number, @User() user: UserDto) {
        return await this.videosService.vote(id, user).then((res) => res.toDTO());
    }

    @Get('/mine')
    @ApiResponse({
        type: [VideoDto],
    })
    async getMine(
        @Query('take', ParseIntPipe, new RangePipe(1, 30)) take: number,
        @Query('skip', ParseIntPipe, PositivePipe) skip: number,
        @User() user: UserDto,
    ) {
        return await this.videosService.getMine(user.id, take, skip);
    }
}
