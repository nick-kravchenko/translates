const debounce = require('./debounce');
const t = require('./translate');

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
    clients.forEach((client) => {
        client.send(JSON.stringify(translates));
    });
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
const addLanguage = function(lang) {
    const q = translates.map(val => val.key).join('\n');
    t(q, lang).then((response) => {
        const w = response.split('\n');
        translates = translates.map((val, i) => {
            return {
                ...val,
                [`${lang}.js`]: w[i]
            }
        });
        updateTranslates();
    }).catch((err) => {
        console.error(err);
    })
}

wss.on('connection', function (ws) {
    clients.push(ws);
    ws.send(JSON.stringify(translates));

    ws.on('message', function (message) {
        switch (JSON.parse(message).key) {
            case 'updateTranslates':
                translates = JSON.parse(message).data;
                updateTranslates();
                break;
            case 'addLanguage':
                addLanguage(JSON.parse(message).data);
                break;
            default:
                break;
        }
    });

    ws.on('close', function () {
        clients = clients.filter(client => client !== ws);
    });
});