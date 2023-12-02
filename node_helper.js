/* eslint-disable */
const NodeHelper = require("node_helper");
const axios = require("axios");
const logger = require("logger");

let oldMessage = undefined;
const port = global.config.port + 1;

let config = undefined;
let warnings = [];

function GetCurrentEvents() {
  const ongoingEvents = [];
  warnings = [];

  if (config && config.events) {
    const correctEvents = config.events.filter((event, index) => {
      if (event.message && event.date && event.timespan) {
        event.date = new Date(event.date);
        return true;
      } else {
        warnings.push(`Incorrect event format. Index: ${index}`);
        return false;
      }
    });

    correctEvents.forEach((event) => {
      const endDate = new Date(event.date.getTime());
      endDate.setDate(endDate.getDate() + event.timespan);
      //prettier-ignore
      if (Date.now() >= event.date.getTime() && Date.now() <= endDate.getTime()) {
        ongoingEvents.push(event);
      }
    });
  }

  return ongoingEvents;
}

module.exports = NodeHelper.create({
  async socketNotificationReceived(id, payload) {
    let ongoing = GetCurrentEvents();

    if (id === "GetLastMessage" && ongoing.length <= 0) {
      const lastMessage = (
        await axios.get(`http://127.0.0.1:${port}/lastMessage`)
      ).data;

      this.sendSocketNotification("SetMessage", lastMessage || "");
    }

    if (id === "UpdateConfig") {
      config = payload;
      let ongoing = GetCurrentEvents();
      let messages = [];

      ongoing.forEach((event) => {
        messages.push(event.message);
      });

      this.sendSocketNotification("SetMessages", messages);
    }
  },

  init() {
    const fastify = require("fastify")({
      logger: false
    });

    fastify.get("/setMessage", (req, reply) => {
      if (GetCurrentEvents().length <= 0) {
        const lowerCaseKeys = Object.keys(req.query).map((v) =>
          v.toLowerCase()
        );
        const messageValue =
          req.query[lowerCaseKeys.find((v) => v === "message")] || undefined;

        if (messageValue && messageValue.trim().length >= 1) {
          this.sendSocketNotification("SetMessage", messageValue || "");
          oldMessage = messageValue;
          reply.send("Sent");
        } else {
          reply.send("Incorrect format");
        }
      }

      reply.send("Event in progress");
    });

    fastify.get("/lastMessage", (_req, reply) => {
      reply.send(oldMessage);
    });

    fastify.get("/cancelMessage", (_req, reply) => {
      if (GetCurrentEvents().length <= 0) {
        this.sendSocketNotification("SetMessage", "");
        oldMessage = "";
        reply.send("Message cancelled");
      }

      reply.send("Event in progress");
    });

    fastify.get("/config", (_req, reply) => {
      reply.send(config);
    });

    fastify.get("/warnings", (_, reply) => {
      reply.send(warnings);
    });

    fastify.listen({ port: port, host: "0.0.0.0" });
  }
});
