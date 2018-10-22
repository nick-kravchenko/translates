const fs = require('fs');
require('dotenv').config();
fs.unlink('GOOGLE_TRANSLATE_CREDENTIALS.json', (err) => {
fs.appendFile(
    'GOOGLE_TRANSLATE_CREDENTIALS.json',
`{
    "type": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_type}",
    "project_id": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_project_id}",
    "private_key_id": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_private_key_id}",
    "private_key": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_private_key}",
    "client_email": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_client_email}",
    "client_id": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_client_id}",
    "auth_uri": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_auth_uri}",
    "token_uri": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_token_uri}",
    "auth_provider_x509_cert_url": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_auth_provider_x509_cert_url}",
    "client_x509_cert_url": "${process.env.GOOGLE_TRANSLATE_CREDENTIALS_client_x509_cert_url}"
}
`,
    function(err) {
        if (err) throw err;
        console.log('Google translate credentials built successfully.');
    }
);
});