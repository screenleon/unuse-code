import * as Thread from 'worker_threads';
import * as mqtt from "mqtt";
const path = require("path");

const maxThreads = require("os").cpus().length;
const storeData = new Int8Array(new SharedArrayBuffer(6 * Int8Array.BYTES_PER_ELEMENT))

interface IConfig {
    broker: string;
    clientOpts: mqtt.IClientOptions;
}

/**
 * Tester
 */
class Tester {
    private client: mqtt.MqttClient = null;
    private client_id: string;
    private testing = false;
    
    private promiseResolve: Function;
    private promiseReject: Function;

    /**
     * Set config and initial Mqtt client
     * @param {IConfig} config
     */
    constructor(config: IConfig) {
        this.client_id = config.clientOpts.clientId;
        this.initial(config.broker, config.clientOpts);
    }

    /**
     * Initial mqtt client and its event
     * @returns
     */
    private initial(broker: string, options: mqtt.IClientOptions) {
        const client = mqtt.connect(broker, options);
        client.on("connect", (packet) => {
            // console.log(`Mqtt ${this.#client_id} connectted`);
            client.subscribe(`PUBLISH_TOPIC`);
        })

        client.on("error", (err) => {
            this.promiseReject(err);
        })

        client.on("message", (topic, buffer, packet) => {
            console.log("You can do something when get the message.");
            console.log(buffer)
            this.promiseResolve();
        })

        this.client = client;
    }

    /**
     * Start to test the mqtt client
     * @returns
     */
    public async start(): Promise<void> {
        this.testing = true;
        const requestTopic = "PUBLISH_TOPIC";

        while(this.testing) {
            await this.publish(requestTopic, this.getRandomInt(1, 100));
        }
    }

    /**
     * Stop to test the mqtt client and return results
     * @returns
     */
    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.testing = false;
            this.client.removeAllListeners();
            this.client.end();
            resolve();
        });
    }

    /**
     * MQTT client public data buffer
     * @returns
     */
    private publish(topic: string, data: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.publish(topic, data);
            this.promiseResolve = resolve;
            this.promiseReject = reject;
        });
    }

    /**
     * Generate random number between min and max
     * @param {number} min 
     * @param {number} max
     * @returns {number}
     */
    private getRandomInt(min: number, max: number): number {
        return Math.ceil(Math.random() * (max - min + 1)) + min;
    }
}

if (Thread.isMainThread) {
    let testSeconds = 5;
    let concurrentQuantity = 20;

    const clientList: string[] = [];
    for (let index = 0; index < concurrentQuantity; index++) {
        clientList.push(`test_${index}`);
    }

    const workersList: Thread.Worker[] = [];
    const usedThreads = maxThreads > concurrentQuantity ? concurrentQuantity : maxThreads;
    let closeThreads = 0;
    const leastConnectionsInThread = Math.floor(concurrentQuantity / usedThreads);
    const leastConnectionsMod = concurrentQuantity % usedThreads;
    for (let threadIndex = 0; threadIndex < usedThreads; threadIndex++) {
        let lastClientIndex = (threadIndex + 1) * leastConnectionsInThread;
        if (threadIndex == usedThreads - 1 && leastConnectionsMod > 0) {
            lastClientIndex += leastConnectionsMod;
        }
        const worker = new Thread.Worker(path.join(__filename), {
            workerData: {
                broker: process.env["MQTT_BROKER"],
                clientList: clientList.slice(threadIndex * leastConnectionsInThread, lastClientIndex),
            }
        });

        worker.on("message", (value) => {
            Atomics.add(storeData, 0, value);
        })

        worker.once("exit", (exitCode) => {
            closeThreads += 1;
            if (closeThreads == usedThreads) {
                console.log("Finish all worker");
                process.exit(0);
            }
        })
        workersList.push(worker);
    }

    const timeout = Date.now() + testSeconds * 1000;
    for (const worker of workersList) {
        worker.postMessage({ "action": "start" });
    }

    setTimeout(() => {
        for (const worker of workersList) {
            worker.postMessage({ "action": "stop" });
        }

        setTimeout(() => {
            console.log("Force exit Main Process");
            process.exit(0);
        }, 30 * 1000);
    }, timeout - Date.now());
} else {
    const TAG = "Woker";

    if (!Thread.isMainThread) {
        const testerList: Tester[] = [];
        Thread.parentPort.on("message", (message) => {
            if (message.action === "start") {
                for (const tester of testerList) {
                    tester.start();
                }
            } else if (message.action === "stop") {
                const endPromises: Promise<void>[] = [];
                for (const tester of testerList) {
                    endPromises.push(tester.stop());
                }

                /**
                 * Adds up tester results
                 */
                Promise.all(endPromises)
                    .then(results => {

                        Thread.parentPort.postMessage(1);
                        process.exit(0)
                    })
            } else {
                console.log("Unknown action");
            }
        });

        console.log(TAG, "Thread #" + Thread.threadId + " Started.");
        const maxConnections = Thread.workerData.clientList.length as number;
        for (let index = 0; index < maxConnections; index++) {
            const data: IConfig = {
                broker: Thread.workerData.broker,
                clientOpts: {
                    clientId: Thread.workerData.clientList[index],
                }
            }
            testerList.push(new Tester(data));
        }
    }
}
