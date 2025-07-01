import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import fs from 'fs';
import { dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;
const API_URL = "https://covers.openlibrary.org/b/isbn";

const db = new pg.Client({
    host: "localhost",
    user: "postgres",
    database: "Books",
    password: "db@123",
    port: 5432,
});

db.connect();
app.use(express.static("public"));  //access images and css files
app.use(bodyParser.urlencoded({ extended: true })); //read request body

let books = [
    { id: 1, bookName: "The Silent Patient", author: "Alex Michaelides", dateread: "2024-27-06", notes: "", isbn: "9781250237170", recommend: "7" },
    // { id: 2, bookName: "The Housemaid", author: "Freida McFadden", dateread: "2024-17-09", notes: "", isbn: "1538742578"},
    // { id: 3, bookName: "It Ends With Us", author: "Colleen Hoover", dateread: "2024-19-11", notes: "", isbn: "9781471156267"},
    // { id: 4, bookName: "Surrounded by Idiots", author: "Thomas Erikson", dateread: "2024-28-07", notes: "", isbn: "9781250179944"},
];
let existingBook = [];
let orderbyBooks = [];

// async function getBookCover(books){

// }

app.get("/", async (req, res) => {
    try {
        const result = await db.query("SELECT * from bookslist ORDER BY id ASC");
        books = result.rows;
        // console.log(books);
        for (let book of books) {
            const response = await axios.get(API_URL + "/" + `${book.isbn}` + "-S.jpg", { responseType: "stream" });
            var resultcovers = response.data;
            resultcovers.pipe(fs.createWriteStream(__dirname + "/public/images/" + `${book.isbn}` + "-S.jpg"));
        }
        res.render("index.ejs", { listBooks: books });
    } catch (err) {
        console.log(err);
    }
});

app.get("/book/sort=recommend", async(req,res) => {
    const result = await db.query("SELECT * from bookslist ORDER BY recommend DESC");
    orderbyBooks = result.rows;

    res.render("index.ejs", { listBooks: orderbyBooks });
})

app.get("/book/sort=recency", async(req,res) => {
    const result = await db.query("SELECT * from bookslist ORDER BY dateread DESC");
    orderbyBooks = result.rows;

    res.render("index.ejs", { listBooks: orderbyBooks });
})
app.get("/new", (req, res) => {

    res.render("modify.ejs", { Submit: "Create book" });
})

app.post("/newbook", async (req, res) => {
    try {
        const bookId = books.length + 1;
        const bookTitle = req.body.bookname;
        const bookNotes = req.body.notes;
        const bookAuthor = req.body.author;
        const bookDateread = req.body.dateread;
        const isbn = req.body.isbn;
        const recommend = req.body.recommend;
        await db.query("INSERT INTO bookslist (id, bookname, author, dateread, notes, isbn, recommend) VALUES ($1, $2, $3, $4, $5, $6, $7)", [bookId, bookTitle, bookAuthor, bookDateread, bookNotes, isbn, recommend]);
        res.redirect("/");
    }
    catch (err) {
        console.log(err)
    }

})
app.get("/edit/:id", async (req, res) => {
    const bookId = parseInt(req.params.id);
    console.log(bookId);
    const bookData = await db.query("SELECT * FROM bookslist WHERE id = ($1)", [bookId]);
    existingBook = bookData.rows;
    console.log("Selected book", existingBook);
    res.render("modify.ejs", { book: existingBook, Submit: "Update book" });
})

app.post("/edit/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log("Request body", req.body);
        const updatedbookname = (req.body.bookname) || existingBook.bookName;
        const updatednotes = (req.body.content) || existingBook.notes;
        const updatedauthor = (req.body.author) || existingBook.author;
        const updateddateread = (req.body.dateread) || existingBook.dateread;
        const updatedrecommend = (req.body.recommend) || existingBook.recommend;

        await db.query("UPDATE bookslist SET bookname = ($2), notes = ($3), author = ($4), dateread = ($5), recommend = ($6) WHERE id = ($1)", [id, updatedbookname, updatednotes, updatedauthor, updateddateread, updatedrecommend]);

        res.redirect("/");

    } catch (err) {
        console.log(err)
    }
});



app.get("/delete/:id", async(req, res) => {
    const id = parseInt(req.params.id);
    // const searchIndex = books.findIndex((book) => book.id === id);
    // if (searchIndex > -1) {
    //     books.splice(searchIndex, 1);
    try {
        await db.query("DELETE FROM bookslist WHERE id = ($1)", [id]);
        res.redirect("/")
        // res.sendStatus(200);
    } catch(err){
        console.log(err);}
});

app.get("/vidya", (req, res) => {
    res.render("Vidya.ejs");
});

app.get("/crochet", (req,res) => {
    res.render("crochet.ejs")
})
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})