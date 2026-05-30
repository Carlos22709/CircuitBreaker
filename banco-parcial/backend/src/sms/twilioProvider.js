async function sendWithTwilio({ phone, message }) {
  await new Promise((resolve) => setTimeout(resolve, 150));

  return {
    providerMessageId: `twilio-${Date.now()}`,
    phone,
    message
  };
}

module.exports = {
  sendWithTwilio
};
