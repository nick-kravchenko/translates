const debounce = require('./helpers/debounce');
const t = require('./helpers/translate');
const randomColor = require('./helpers/randomColor');
const users = require('./storage/users');

let WebSocketServer = require('ws').Server,
    fs = require('fs'),
    wss = new WebSocketServer({ port: 40510 }),
    clients = [],
    translates = [],
    disabledFields = [],
    connectedUsers = [];

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
        client.send(JSON.stringify({
            type: 'updateTranslates',
            data: translates,
        }));
    });
    let values = translates;
    if (values.length > 0) {
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
    }
}, 1500);
const updateDisabledFields = function() {
    clients.forEach((client) => {
        client.send(JSON.stringify({
            type: 'updateDisabledFields',
            data: disabledFields
        }))
    });
}
const updateUsers = function() {
    clients.forEach((client) => {
        client.send(JSON.stringify({
            type: 'updateConnectedUsers',
            data: connectedUsers
        }))
    })
}

const focusField = function(data, params) {
    disabledFields.push({
        ...data,
        user: params.name
    });
    updateDisabledFields();
}
const releaseField = function(data, params) {
    disabledFields.splice(disabledFields.indexOf(f => f.index != data.index && f.key != data.key));
    updateDisabledFields();
}

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

wss.on('connection', function (ws, a) {
    const params = a.url.replace('/?', '').split('&').map(a => {
        return {
            [a.split('=')[0]]: a.split('=')[1]
        }
    }).reduce((acc, cur) => {
        return {
            ...acc,
            ...cur
        }
    }, {});
    if (users[params.name] !== params.pass) {
        ws.send(JSON.stringify({
            type: 'unauthorized',
            data: true
        }))
        ws.close();
        console.log('Unauthorized: ', JSON.stringify(params));
    } else {
        console.log('Authorized', JSON.stringify(params));
        connectedUsers.push({
            name: params.name,
            color: randomColor()
        })
        clients.push(ws);
        updateTranslates();
        updateDisabledFields();
        updateUsers();
    
        ws.on('message', function (message) {
            switch (JSON.parse(message).key) {
                case 'focusField':
                    focusField(JSON.parse(message).data, params);
                    break;
                case 'releaseField':
                    releaseField(JSON.parse(message).data, params);
                    break;
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
            disabledFields = disabledFields.filter(field => field.user !== params.name);
            connectedUsers = connectedUsers.filter(user => user.name !== params.name)
            updateDisabledFields();
        });
    }
});