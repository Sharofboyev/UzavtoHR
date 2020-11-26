/*const Database = require('better-sqlite3');
const db = new Database(__dirname + '/support.db', {
    /* verbose: console.log 
}); // debugging

const dbTable = db.prepare(
    `CREATE TABLE IF NOT EXISTS supportees
    (id INTEGER PRIMARY KEY AUTOINCREMENT,
    userid TEXT, status TEXT, type TEXT,
    message TEXT, created_time TIMESTAMP
    DEFAULT (datetime('now','localtime')));`);
dbTable.run();

exports.check2 = async function(userid, msg, callback) {
    await db.prepare(`UPDATE supportees SET message = message || '__,__' || '${msg}'
              WHERE userid = ${userid}
              AND status = 'open'`).run()
    const searchDB = db.prepare(`select * from supportees
                              WHERE (userid = ${userid} or id = ${userid})
                              AND status = 'open'`).get();
    callback(searchDB);
};

exports.check = function(userid, callback) {
    const searchDB = db.prepare(`select * from supportees
                              WHERE (userid = ${userid} or id = ${userid})
                              AND status = 'open'`).get();
    callback(searchDB);
}

exports.add = function(msg, status, type) {
    if (status == 'closed') {
        db.prepare(`UPDATE supportees
                SET status = 'closed'
                WHERE userid = ${msg}`).run();
    } else if (status == 'banned') {
        db.prepare(`UPDATE supportees
              SET status = 'banned'
              WHERE userid = '${msg}'`).run();
    else {
        let name = msg.from.first_name;
        if (msg.from.last_name) name += ' ' + msg.from.last_name;
        db.prepare(`INSERT INTO supportees (userid, status, type, message, name)
              VALUES ('${msg.from.id}', '${status}', '${type}', '${msg.text}', '${name}')`).run();
    }
};

exports.open = function(callback) {
    const searchDB = db.prepare(
        'select * from supportees where status = \'open\'').all();
    callback(searchDB);
};

exports.all = function(callback) {
    const data = db.prepare('SELECT * FROM supportees ORDER BY id ASC').all()
    callback(data);
}*/

const { Pool } = require("pg");
const connectionString =
    "postgressql://postgres:postgres@localhost:5432/UzAutoHR";
const pool = new Pool({
    connectionString: connectionString,
});

exports.check = function(userid, callback) {
    pool.query(
        `SELECT * from supportees
    WHERE (userid = '${userid}' OR id = ${userid})
    AND status = 'open' ORDER BY id DESC`,
        (err, res) => {
            if (err) return console.log(err.message);
            return callback(res.rows[0]);
        }
    );
};

exports.add = async function(msg, status, type) {
    if (status == "closed") {
        pool.query(
            `UPDATE supportees
              SET status = 'closed', answer = '${type}'
              WHERE id = ${msg}`,
            (err, res) => {
                if (err) return console.log(err.message);
            }
        );
    } else if (status == "banned") {
        pool.query(
            `UPDATE supportees
              SET status = 'banned'
              WHERE (userid = '${msg}' OR id = ${msg}) AND status = 'open'`,
            (err, res) => {
                if (err) return console.log(err.message);
            }
        );
    } else {
        let name = msg.from.first_name;
        if (msg.from.last_name) name += " " + msg.from.last_name;
        await pool.query(`INSERT INTO supportees (userid, status, type, message, name)
            VALUES ('${msg.from.id}', '${status}', '${type}', '${msg.text}', '${name}')`);
    }
};

exports.open = function(callback) {
    pool.query("SELECT * FROM supportees WHERE status = 'open'", (err, res) => {
        if (err) return console.log(err.message);
        return callback(res.rows);
    });
};

exports.all = function(callback) {
    pool.query("SELECT * FROM supportees ORDER BY id ASC", (err, res) => {
        if (err) return console.log(err.message);
        callback(res.rows);
    });
};

exports.log = async function(ctx) {
    pool.query("INSERT INTO logs()");
};