const moment = require('moment');

function formatMessage(username, text) {
  return {
    username,
    text,
  };
}

module.exports = formatMessage;