import { Get, Route, Tags } from 'tsoa';

@Route('')
@Tags('index')
export class IndexController {
  /**
   * Root endpoint to verify API server is running
   * @summary API root endpoint
   */
  @Get('/')
  public async getIndex(): Promise<{ message: string }> {
    return {
      message: 'Welcome to the UnitTCMS API!',
    };
  }
}
