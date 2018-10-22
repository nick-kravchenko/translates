const fs = require('fs');
require('dotenv').config();
fs.unlink('storage/users.js', (err) => {
fs.appendFile(
    'storage/users.js',
`const users = {
    '${process.env.user_name}': '${process.env.user_pass}',
};
module.exports = users;`,
    function(err) {
        if (err) throw err;
        console.log('Users built successfully.');
    }
);
});