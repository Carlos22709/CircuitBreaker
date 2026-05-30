let aldeamoShouldFail = false;

async function sendWithAldeamo({ phone, message }) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  if (aldeamoShouldFail) {
    throw new Error('Aldeamo simulado no disponible');
  }

  return {
    providerMessageId: `aldeamo-${Date.now()}`,
    phone,
    message
  };
}

function forceAldeamoFailure() {
  aldeamoShouldFail = true;
}

function recoverAldeamo() {
  aldeamoShouldFail = false;
}

function isAldeamoFailing() {
  return aldeamoShouldFail;
}

module.exports = {
  sendWithAldeamo,
  forceAldeamoFailure,
  recoverAldeamo,
  isAldeamoFailing
};
