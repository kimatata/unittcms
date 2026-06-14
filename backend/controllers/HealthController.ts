import { Controller, Get, Route, Tags, Response } from 'tsoa';

interface HealthResponse {
  status: 'ok';
}

/**
 * Health check endpoint for monitoring service availability
 */
@Route('health')
@Tags('health')
export class HealthController extends Controller {
  /**
   * Check if the API server is healthy and responding
   * @summary Health check
   */
  @Get('/')
  @Response<HealthResponse>(200, 'Service is healthy')
  public async getHealth(): Promise<HealthResponse> {
    return {
      status: 'ok',
    };
  }
}
