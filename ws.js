const debounce = require('./debounce');

let WebSocketServer = require('ws').Server,
    fs = require('fs'),
    wss = new WebSocketServer({ port: 40510 }),
    clients = [],
    translates = [];

fs.readFile('./storage/translate.csv', 'utf8', (err, data) => {
    if (err) return console.error(err);
    function capitalize(string) {
        string = string.toLowerCase();
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    const result = data;
    let arrays = result.split(/\n/)
        .map((row) => {
            let values = [];
            if (row.includes('"')) {
                values = row.split(/","|,"|"|((?<=[\w\d|\(|\)])(,)(?=[\w\d|\(|\)]))/gm).filter(val => val !== '' && val !== ',' && val !== undefined);
            } else {
                values = row.split(/,/gm);
            }
            return values;
        })
        .filter(values => !values.every(value => value === ''));
    let keys = arrays.shift();
    let v = arrays.map((values) => {
        return values.reduce((acc, cur, i) => {
            return {
                ...acc,
                [keys[i]]: capitalize(cur)
            };
        }, {});
    }).map((obj) => {
        delete obj.Desc;
        return {
            ...obj,
            key: obj['en.js']
        }
    });
    translates = v.map(t => { return {...t} });
});

const updateTranslates = debounce(() => {
    let values = translates;
    let keys = Object.keys(values[0]);
    let out = values.map((obj) => `"${Object.values(obj).join('","')}"`);
    out.unshift(`"${keys.join('","')}"`);
    out = out.join('\n');
    fs.unlink('./storage/translate.csv', (err) => {
        if (err) throw err;
        fs.appendFile(
            './storage/translate.csv',
            out,
            function(err) {
                if (err) throw err;
                console.log('Translates updated.');
            }
        );
    });
}, 1500);

wss.on('connection', function (ws) {
    clients.push(ws);
    ws.send(JSON.stringify(translates));

    ws.on('message', function (message) {
        translates = JSON.parse(message);
        updateTranslates();
        clients.forEach((client) => {
            client.send(message);
        });
    });

    ws.on('close', function () {
        clients = clients.filter(client => client !== ws);
    });
});