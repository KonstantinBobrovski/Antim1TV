import { Controller, Body, Param, Put, ParseIntPipe } from '@nestjs/common';
import { AllowedVideoDto } from '../videos/dto/allowedVideo.dto';
import { GetVideoDto } from './dto/get-video.dto';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
    constructor(private readonly playersService: PlayersService) {}

    @Put('/:queueId')
    async GetVideo(
        @Param('queueId', ParseIntPipe) queueId: number,
        @Body() getVideoDto: GetVideoDto,
    ): Promise<AllowedVideoDto> {
        return await this.playersService.getVideo(queueId, getVideoDto);
    }
}
