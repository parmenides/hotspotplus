import { Request, RequestHandler } from 'express';
import logger from '../utils/logger';

const controller: { [key: string]: RequestHandler } = {
  health: (request, response) => {
    response.send({ ok: true });
  },
};

export default controller;
