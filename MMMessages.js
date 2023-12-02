Module.register("MMMessages", {
  defaults: {
    events: []
  },

  getTemplateData() {
    return {
      message: this.message,
      messages: this.messages
    };
  },

  start() {
    this.sendSocketNotification("GetLastMessage");
    this.sendSocketNotification("UpdateConfig", this.config);
  },

  getTemplate() {
    return "MMMessages.njk";
  },

  getStyles() {
    return ["MMMessages.css"];
  },

  socketNotificationReceived: function (id, payload) {
    if (id === "SetMessage") {
      this.message = payload;
      this.updateDom(300);
    }
    if (id === "SetMessages") {
      this.messages = payload;
      this.updateDom(300);
    }
  }
});
