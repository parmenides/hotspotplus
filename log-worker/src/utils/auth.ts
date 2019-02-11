/**
 * Created by hamidehnouri on 9/21/2016 AD.
 */

import logger from './logger';
import { createHttpClient } from './httpClient';

if (
  !process.env.SERVICE_MAN_USERNAME ||
  !process.env.SERVICE_MAN_PASSWORD ||
  !process.env.API_ADDRESS
) {
  throw new Error('invalid auth env variables');
}
const API_ADDRESS = process.env.API_ADDRESS;

const log = logger.createLogger();

export const login = async (username: string, password: string) => {
  const httpClient = createHttpClient(API_ADDRESS);
  const response = await httpClient.post('/api/Users/login', {
    username,
    password,
  });
  return response.data.id;
};
