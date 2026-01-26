import { Controller, Post, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  @Post('stripe')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // TODO: Implement Stripe webhook handling
    return { received: true };
  }

  @Post('mux')
  @ApiOperation({ summary: 'Mux webhook handler' })
  async handleMuxWebhook(@Req() req: Request) {
    // TODO: Implement Mux webhook handling
    return { received: true };
  }
}
