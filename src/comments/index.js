const express = require("express");
const fs = require("fs-extra");
const path = require("path");
const {check, validationResult, sanitizeBody} = require("express-validator");

const commentsJsonPath = path.join(__dirname, "comment.json");

const getComments = async () => {
    const buffer = await fs.readFile(commentsJsonPath);
    return JSON.parse(buffer.toString())
};

const router = express.Router();

router.get("/", async (req, res) => {
    res.send(await getComments())
});

router.get("/:imdbID", async (req, res) => {
    const comments = await getComments();
    const comment = comments.filter(m => m.movieId === req.params.imdbID);
    if (comment)
        res.send(comment);
    else
        res.status(404).send("Not found");
});

router.post("/",
    [
        check("movieId").exists().withMessage("movieId is required"),
        check("username").exists().withMessage("username is required"),
        check("text").exists().withMessage("text is required"),
        check("rate").exists().withMessage("rate is required")
    ], async (req, res) => {
        const errors = validationResult(req);
        // if (errors. > 0);
        //     res.status(400).send(errors);

        const comments = await getComments();
        req.body._id = Date.now() + "";
        req.body.createdAt = new Date();

        comments.push(req.body);
        await fs.writeFile(commentsJsonPath, JSON.stringify(comments));
        res.status(201).send(req.body);
    });

router.put("/:id", async (req, res) => {
    const comments = await getComments();
    const comment = comments.find(m => m._id === req.params.id);
    if (comment) {
        const position = comments.indexOf(comment);
        req.body.createdAt = new Date();
        const commentUpdated = Object.assign(comment, req.body);
        comments[position] = commentUpdated;
        await fs.writeFile(commentsJsonPath, JSON.stringify(comments));
        res.status(200).send(commentUpdated)
    } else
        res.status(404).send("Not found")
});

router.delete("/:id", async (req, res) => {
    const comments = await getComments();
    const commentsToBeSaved = comments.filter(x => x._id !== req.params.id);
    if (commentsToBeSaved.length === comments.length)
        res.status(404).send("cannot find comment " + req.params.id);
    else {
        await fs.writeFile(commentsJsonPath, JSON.stringify(commentsToBeSaved));
        res.send("Deleted")
    }
});


module.exports = router;