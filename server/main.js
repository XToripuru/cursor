const express = require('express');
const path = require('path');
const { Surreal } = require('surrealdb.node');
const { WebSocketServer } = require('ws');

const app = express();
const port = 3000;
const db = new Surreal();
const wss = new WebSocketServer({ port: 8080 });

async function init_db() {
    try {
        // Connect to the database
        await db.connect('ws://127.0.0.1:8000');

        await db.signin({
            username: 'root',
            password: 'root',
        });

        await db.use({ ns: 'messages', db: 'cursor' });

        // await db.create("M", { mid: 0, content: "Welcome!" });
        // mid - message id
        // let x = await db.select("M");
        // console.log(x);

    } catch (error) {
        console.error(error);
    }

} init_db();

app.use(express.static(path.join(__dirname, '..', 'dist')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});


const users = [];
let id = 0;

wss.on('connection', async (ws) => {
    let uid = id;

    ws.on('message', async (data) => {

        let message = JSON.parse(data);

        if (message.type == 'fetch') {
            const max_id = parseInt(await db.query("math::max(SELECT VALUE mid from M)"));

            const messages = await db.query("SELECT * FROM M WHERE ID>$id-100 AND ID<$id;", { id: message.id });

            ws.send(JSON.stringify({ "content": messages }));

            return;
        }
        
        const max_id = await db.query("math::max(SELECT VALUE mid from M)");
        const next_id = (parseInt(max_id) + 1) || 0;
        message["mid"] = next_id;

        users.forEach(user => user.ws.send(JSON.stringify([message])));

        await db.create("M", message);
    });

    ws.on('close', (code, reason) => {
        const idx = users.indexOf(users.find(user => user.id == uid));
        
        if (idx > -1) {
            users.splice(idx, 1);
        }
    });

    const messages = await db.query("SELECT mid,content FROM M ORDER BY mid DESC LIMIT 100");
    ws.send(JSON.stringify(messages));

    users.push({
        "ws": ws,
        "id": id,
    });
    id += 1;
});