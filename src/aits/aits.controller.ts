import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AitsService } from './aits.service';
import { CreateAitDto } from './dto/create-ait.dto';
import { UpdateAitDto } from './dto/update-ait.dto';

@Controller('aits')
export class AitsController {
  constructor(private readonly aitsService: AitsService) {}

  @Post()
  create(@Body() createAitDto: CreateAitDto) {
    return this.aitsService.create(createAitDto);
  }

  @Get()
  findAll() {
    return this.aitsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aitsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAitDto: UpdateAitDto) {
    return this.aitsService.update(id, updateAitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aitsService.remove(id);
  }
}
