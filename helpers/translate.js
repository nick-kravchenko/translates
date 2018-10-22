// Imports the Google Cloud client library
const {Translate} = require('@google-cloud/translate');
require('dotenv').config();

// Your Google Cloud Platform project ID
const projectId = process.env.GOOGLE_TRANSLATE_PROJECT_ID;

// Instantiates a client
const translate = new Translate({
  projectId: projectId,
});

// Translates some text
const t = (text, lang) => {
  return new Promise((resolve, reject) => {
    translate
    .translate(text, lang)
    .then(results => {
      const translation = results[0];
      resolve(translation);
    })
    .catch(err => {
      reject(err);
    });
  });
};

module.exports = t;
