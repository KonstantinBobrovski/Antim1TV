import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AllowedVideo } from '../videos/entities/allowedVideo.entity';
import { CreateQueueDto } from './dto/create-queue.dto';
import { GetVideoDto } from '../players/dto/get-video.dto';
import { Queue } from './entities/queue.entity';

@Injectable()
export class QueuesService {
  constructor(
    @InjectRepository(Queue) private queuesRepository: Repository<Queue>,
  ) {}
  async create(createQueueDto: CreateQueueDto) {
    const que = this.queuesRepository.create(createQueueDto);
    await this.queuesRepository.save(que);
    return que;
  }

  async findAll() {
    return await this.queuesRepository.find();
  }
}
