import { Logger } from '@nestjs/common';
import axios, { AxiosHeaders } from 'axios';

export class HttpClient {
  private readonly logger = new Logger(HttpClient.name);

  async get(url: string, headers: AxiosHeaders) {
    try {
      return await axios.get(url, {
        headers,
        responseType: 'stream',
      });
    } catch (error) {
      this.logger.error(`Failed to get data from ${url}: ${error.message}`);
      throw error;
    }
  }

  async getJson<T = unknown>(url: string, headers: AxiosHeaders): Promise<T> {
    try {
      const response = await axios.get(url, {
        headers,
        responseType: 'json',
      });
      return response.data as T;
    } catch (error) {
      this.logger.error(`Failed to get data from ${url}: ${error.message}`);
      throw error;
    }
  }
}
