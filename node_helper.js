/* eslint-disable */
const NodeHelper = require("node_helper");
const axios = require("axios");
const logger = require("logger");

let oldMessage = undefined;

module.exports = NodeHelper.create({
	async socketNotificationReceived(id) {
		if (id === "GetLastMessage") {
			const lastMessage = (await axios.get("http://localhost:8081/lastMessage")).data;
			this.sendSocketNotification("SetMessage", lastMessage || "");
		}
	},

	init() {
		const fastify = require("fastify")({
			logger: false,
		});

		fastify.get("/setMessage", (req, reply) => {
			const lowerCaseKeys = Object.keys(req.query).map((v) => v.toLowerCase());
			const messageValue = req.query[lowerCaseKeys.find((v) => v === "message")] || undefined;

			if (messageValue && messageValue.trim().length >= 1) {
				this.sendSocketNotification("SetMessage", messageValue || "");
				oldMessage = messageValue;
				reply.send("Sent");
			} else {
				reply.send("Incorrect format");
			}
		});

		fastify.get("/lastMessage", (_req, reply) => {
			reply.send(oldMessage);
		});

		fastify.post("/cancelMessage", (_req, reply) => {
			this.sendSocketNotification("SetMessage", "");
			oldMessage = "";
			reply.send("Message cancelled");
		});
		logger.log(global.config.port);
		fastify.listen({ port: global.config.port + 1 });
	},
});
