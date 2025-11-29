const fs = require("fs");
const path = require("path");

const inputPath = path.join(__dirname, "bible_kjv.json"); // your file
const outputPath = path.join(__dirname, "init.sql");

const bible = JSON.parse(fs.readFileSync(inputPath, "utf8"));

let sql = `
CREATE TABLE IF NOT EXISTS verses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book VARCHAR(100) NOT NULL,
  chapter INT NOT NULL,
  verse INT NOT NULL,
  text LONGTEXT NOT NULL,
  UNIQUE KEY uq_book_chapter_verse (book, chapter, verse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO verses (book, chapter, verse, text) VALUES
`;

let first = true;

for (const book of bible.books) {
    for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {

            const cleanText = verse.text
                .replace(/'/g, "''")
                .replace(/\\/g, "\\\\");

            if (!first) sql += ",\n";
            first = false;

            sql += `('${book.name}', ${chapter.chapter}, ${verse.verse}, '${cleanText}')`;
        }
    }
}

sql += ";\n";

fs.writeFileSync(outputPath, sql, "utf8");
console.log("✔ init.sql successfully generated!");
