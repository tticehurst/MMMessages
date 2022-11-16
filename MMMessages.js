Module.register("MMMessages", {
  getTemplateData() {
    return {
      message: this.message,
    };
  },

  start() {
    this.sendSocketNotification("GetLastMessage");
  },

  getTemplate() {
    return "Messages.njk";
  },

  getStyles() {
    return ["MMMessages.css"];
  },

  socketNotificationReceived: function (id, payload) {
    if (id === "SetMessage") {
      this.message = payload;
      this.updateDom(300);
    }
  },
});
