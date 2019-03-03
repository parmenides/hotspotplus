import moment, {Moment} from "moment";
import {getRabbitMqChannel} from "../utils/rabbitmq";
import {QUEUES} from "../typings";
import {EnrichTask} from "./enrich";
import logger from "../utils/logger";
import {CronJob} from 'cron';
import {start} from "repl";

const log = logger.createLogger();

export const addEnrichmentTasks = async (from:number,to:number,reportType:string) => {
    const fromDate: Moment = moment(from);
    const toDate: Moment = moment(to);
    const channel = await getRabbitMqChannel();

    const duration = moment.duration(toDate.diff(fromDate));
    const hours = duration.asHours();
    const taskLen:Array<any> = new Array(hours);

    for (const t of taskLen) {
        const start = fromDate.valueOf();
        fromDate.add({
            hours: 1
        });
        const end = fromDate.valueOf();
        const enrichTask:EnrichTask = {
            from:start,
            to:end,
            reportType
        };
        log.debug(`add new enrichment task `,enrichTask);
        await channel.sendToQueue(QUEUES.LOG_ENRICHMENT_WORKER_QUEUE, Buffer.from(JSON.stringify(enrichTask)));
    }

};

new CronJob("",()=>{

});
