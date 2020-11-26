const Database = require("better-sqlite3");
const db = new Database(__dirname + "/support.db", {
    /* verbose: console.log */
}); // debugging

/*const { Pool } = require("pg");
const connectionString =
    "postgressql://postgres:postgres@localhost:5432/UzAutoHR";
const pool = new Pool({
    connectionString: connectionString,
});*/

const dbTable = db.prepare(
    `CREATE TABLE IF NOT EXISTS supportees
    (id INTEGER PRIMARY KEY AUTOINCREMENT,
        userid TEXT, name TEXT, status TEXT, type TEXT,
        message TEXT, answer TEXT, created_time TIMESTAMP
        DEFAULT (datetime('now','localtime')));`
);
dbTable.run();

exports.check = function(userid, callback) {
    const searchDB = db
        .prepare(
            `SELECT * from supportees
            WHERE (userid = '${userid}' OR id = ${userid})
            AND status = 'open' ORDER BY id DESC`
        )
        .get();
    callback(searchDB);
};

/*exports.check = function(userid, callback) {
    pool.query(
        `SELECT * from supportees
    WHERE (userid = '${userid}' OR id = ${userid})
    AND status = 'open' ORDER BY id DESC`,
        (err, res) => {
            if (err) return console.log(err.message);
            return callback(res.rows[0]);
        }
    );
};*/

exports.add = async function(msg, status, type) {
    if (status == "closed") {
        db.prepare(
            `UPDATE supportees
              SET status = 'closed', answer = '${type}'
              WHERE id = ${msg}`
        ).run();
    } else if (status == "banned") {
        db.prepare(
            `UPDATE supportees
              SET status = 'banned'
              WHERE (userid = '${msg}' OR id = ${msg}) AND status = 'open'`
        ).run();
    } else {
        let name = msg.from.first_name;
        if (msg.from.last_name) name += " " + msg.from.last_name;
        await new Promise((resolve, reject) => {
            db.prepare(
                `INSERT INTO supportees (userid, status, type, message, name)
                VALUES ('${msg.from.id}', '${status}', '${type}', '${msg.text}', '${name}')`
            ).run();

            resolve(null);
        });
    }
};

/*exports.add = async function(msg, status, type) {
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
};*/

exports.open = function(callback) {
    const searchDB = db
        .prepare("SELECT * FROM supportees WHERE status = 'open'")
        .all();
    callback(searchDB);
};

/*exports.open = function(callback) {
    pool.query("SELECT * FROM supportees WHERE status = 'open'", (err, res) => {
        if (err) return console.log(err.message);
        return callback(res.rows);
    });
};*/

exports.all = function(callback) {
    const data = db.prepare("SELECT * FROM supportees ORDER BY id ASC").all();
    callback(data);
};

/*exports.all = function(callback) {
    pool.query("SELECT * FROM supportees ORDER BY id ASC", (err, res) => {
        if (err) return console.log(err.message);
        callback(res.rows);
    });
};

exports.log = async function(ctx) {
    pool.query("INSERT INTO logs()");
};*/
