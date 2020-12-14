import express from 'express';
import bodyParser from 'body-parser';
//import { MongoClient } from 'mongodb';
//import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import pkg from 'mongodb';

const { MongoClient } = pkg;
var path = require('path'); 
  
// const articlesInfo = {
//     'learn-react': {
//         upvotes: 0,
//         comments: [],
//     },
//     'learn-node': {
//         upvotes: 0,
//         comments: [],
//     },
//     'my-thoughts-on-resumes': {
//         upvotes: 0,
//         comments: [],
//     },
// }
const app = express();
//const path = require('path'); 
//app.use(bodyParser.json());
// app.get('/hello', (req, res) => res.send('Hello!'));
// app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name} !`));
// app.post('/hello', (req, res) => res.send(`Hello ${req.body.name} !`));
//const __dirname = path.resolve(path.dirname());

var __dirname = process.cwd();//path.dirname(require.main.filename);

app.use('/static', express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
    try {

        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });

        const db = client.db('my-website');

        await operations(db);

        client.close();
    }
    catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}
app.get('/api/articles/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });

        res.status(200).json(articlesInfo);
    }, res)

});

app.post('/api/articles/:name/upvote', async (req, res) => {

    try {
        const articleName = req.params.name;
        // articlesInfo[articleName].upvotes +=1;
        // res.status(200).send(`${articleName} now has ${articlesInfo[articleName].upvotes} upvotes!`);
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });

        const db = client.db('my-website');

        const articlesInfo = await db.collection('articles').findOne({ name: articleName });

        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                upvotes: articlesInfo.upvotes + 1,
            },
        });

        const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updateArticleInfo);

        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
});

app.post('/api/articles/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;
    // articlesInfo[articleName].comments.push({ username, text });
    // res.status(200).send(articlesInfo[articleName]);
    withDB(async (db) => {
        const articlesInfo = await db.collection('articles').findOne({ name: articleName });

        await db.collection('articles').updateOne({ name: articleName }, {
            '$set': {
                comments: articlesInfo.comments.concat({username, text })
            },
        });

        const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updateArticleInfo);
    }, res)

});


app.get('*', (req, res) => {
    res.sendFile(path.join( __dirname + '/src/build/index.html'));
});


app.listen(8000, () => console.log("Listening on port 8000"));