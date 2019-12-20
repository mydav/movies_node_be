const express = require("express");
const fs = require("fs-extra");
const uuidv4 = require('uuid/v4');
const path = require("path");
const multer = require("multer");
const { check, validationResult, sanitizeBody } = require("express-validator");

const moviesJsonPath = path.join(__dirname,"movies.json");
const commentsJsonPath = path.join(__dirname,"../comments","comment.json");

console.log(commentsJsonPath);
const getMovies = async() => {
    const buffer = await fs.readFile(moviesJsonPath);
    return JSON.parse(buffer.toString())
};
const router = express.Router();

router.get("/", async (req, res)=>{
    res.send(await getMovies())
});
router.get("/:imdbID", async (req, res)=>{
    const movies = await getMovies();
    console.log(movies);
    const movie = movies.find(m => m.imdbID === req.params.imdbID);
    if (movie)
        res.send(movie);
    else
        res.status(404).send("Not found")
});
router.get("/:imdbID/comments", async (req, res)=>{
    const buffer = await fs.readFile(commentsJsonPath);
    const content = buffer.toString();
    const comments = JSON.stringify(content);
    console.log(comments);
    const comment = comments.filter(m => m.imdbID === req.params.imdbID);
    if (comment)
        res.send(comment);
    else
        res.status(404).send("Not found")
});
router.post("/",
    [ check("Title").exists().withMessage("Title is required"),
        check("Year").isNumeric().withMessage("Year is required"),
        check("imdbID").exists().withMessage("You should specify the imdbID"),
        check("Type").exists().withMessage("Type is required"),
        check("Poster").exists().withMessage("Poster is required")
        ]
    ,async(req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            res.status(400).send(errors);
        const movies = await getMovies();
        const imdbIDCheck = movies.find(x => x.imdbID === req.body.imdbID); //get a previous element with the same imdbID
        if (imdbIDCheck) //if there is one, just abort the operation
            res.status(500).send("imdbID should be unique");

        movies.push(req.body);
        await fs.writeFile(moviesJsonPath, JSON.stringify(movies));
        res.status(201).send("Created")
    });
router.put("/:imdbID", async(req, res)=>{
    const movies = await getMovies();
    const movie = movies.find(m => m.imdbID === req.params.imdbID);
    if (movie)
    {
        const position = movies.indexOf(movie);
        const movieUpdated = Object.assign(movie, req.body);
        movies[position] = movieUpdated;
        await fs.writeFile(moviesJsonPath, JSON.stringify(movies));
        res.status(200).send("Updated")
    }
    else
        res.status(404).send("Not found")
} );

router.delete("/:imdbID", async(req, res) => {
    const movies = await getMovies();
    const moviesToBeSaved = movies.filter(x => x.imdbID !== req.params.imdbID);
    if (moviesToBeSaved.length === movies.length)
        res.status(404).send("cannot find movie " + req.params.imdbID);
    else {
        await fs.writeFile(moviesJsonPath, JSON.stringify(moviesToBeSaved));
        res.send("Deleted")
    }
});
const imgFolder = path.join(__dirname, '../../public/images');
const upload = multer({
    limits: {
        fileSize: 20000000
    }
});
router.post('/upload/:id', upload.single('movie_picture'), (req, res) => {
    const fullUrl = req.protocol + '://' + req.get('host') + '/image/';
    const ext = req.file.originalname.split('.').reverse()[0];
    if (ext !== 'png' && ext !== 'jpg' && ext !== 'gif' && ext !== 'jpeg') {
        res.status(400).send('only images allowed');
    } else {
        const fileName = req.params.id + '.' + ext;
        const path = './public/images/' + fileName;
        fs.writeFile(path, req.file.buffer, err => {
            if (err) throw err;
        });
        getMovies().then(r=> {
            allMovies = r;
            console.log(allMovies);
            var movieToUpdate = allMovies.find(movi => movi.imdbID=== req.params.id);
            if (movieToUpdate) {
                movieToUpdate.imageUrl = fullUrl + fileName;
                allMovies.push(movieToUpdate);
                console.log(__dirname);
                fs.writeFileSync('./src/movies/movies.json', JSON.stringify(allMovies));
                res.send('Uploaded');
            } else {
                res.status(404).send("not found");
            }
        });

    }
});

module.exports = router;