if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;

// MySQL pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Format output
function formatOutput(row, type = "text") {
    const text = `${row.text} ${row.book} ${row.chapter}:${row.verse}`;
    
    if (type === "json") {
        return {
            reference: `${row.book} ${row.chapter}:${row.verse}`,
            text: row.text,
            full: text
        };
    }
    return text;
}

// ------------------------
// /random
// ------------------------
app.get("/random", async (req, res) => {
    const type = req.query.type;

    try {
        const [rows] = await db.query(`
            SELECT book, chapter, verse, text
            FROM verses
            ORDER BY RAND()
            LIMIT 1
        `);

        if (rows.length === 0) return res.status(404).send("No verses found.");

        const result = formatOutput(rows[0], type);
        return type === "json" ? res.json(result) : res.send(result);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error.");
    }
});

// ------------------------
// /verse/Luke%201:37
// ------------------------
app.get("/verse/:ref", async (req, res) => {
    const type = req.query.type;
    const ref = decodeURIComponent(req.params.ref);

    const { book, chapter, verse } = parseReference(ref);

    try {
        const [rows] = await db.query(
            `SELECT book, chapter, verse, text FROM verses
             WHERE book = ? AND chapter = ? AND verse = ? LIMIT 1`,
            [book, chapter, verse]
        );

        if (rows.length === 0)
            return res.status(404).send("Verse not found.");

        const result = formatOutput(rows[0], type);
        return type === "json" ? res.json(result) : res.send(result);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error.");
    }
});

// ------------------------
// /verse?ref=Luke 1:37
// ------------------------
app.get("/verse", async (req, res) => {
    const type = req.query.type;
    const ref = req.query.ref;

    if (!ref) return res.status(400).send("Please provide ?ref=Book Chapter:Verse");

    const { book, chapter, verse } = parseReference(ref);

    try {
        const [rows] = await db.query(
            `SELECT book, chapter, verse, text FROM verses
             WHERE book = ? AND chapter = ? AND verse = ? LIMIT 1`,
            [book, chapter, verse]
        );

        if (rows.length === 0)
            return res.status(404).send("Verse not found.");

        const result = formatOutput(rows[0], type);
        return type === "json" ? res.json(result) : res.send(result);

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error.");
    }
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
