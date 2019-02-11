const amqp = require('amqplib/callback_api')

if (!process.env.RABBITMQ_USERNAME || !process.env.RABBITMQ_PASSWORD) {
  throw new Error('invalid rabbit credentials')
}

module.exports.getRabbitMqChannel = function (cb) {
  amqp.connect(
    `amqp://${process.env.RABBITMQ_USERNAME}:${
      process.env.RABBITMQ_PASSWORD
      }@rabbitmq`,
    (error, amqpConnection) => {
      if (error) cb && cb(error)
      amqpConnection.createConfirmChannel((error, channel) => {
        if (error) {
          return cb && cb(error)
        }
        return cb(null, channel)
      })
    }
  )
}

