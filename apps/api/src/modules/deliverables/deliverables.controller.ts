import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeliverablesService } from './deliverables.service';

@ApiTags('deliverables')
@Controller('deliverables')
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}
}
