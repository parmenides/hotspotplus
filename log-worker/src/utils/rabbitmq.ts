import amqp, { Options } from 'amqplib';

if (!process.env.RABBITMQ_USERNAME || !process.env.RABBITMQ_PASSWORD) {
  throw new Error('invalid rabbit credentials');
}
let connection: amqp.Connection;
export const getRabbitMqConnection = async () => {
  /*tslint:disable*/
  if (connection !== undefined) {
    return connection;
  }
  connection = await amqp.connect(
    `amqp://${process.env.RABBITMQ_USERNAME}:${
      process.env.RABBITMQ_PASSWORD
    }@rabbitmq`,
  );
  return connection;
};

export const getRabbitMqChannel = async () => {
  const amqpConnection = await getRabbitMqConnection();
  return amqpConnection.createConfirmChannel();
};
