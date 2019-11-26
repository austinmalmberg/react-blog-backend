const router = require('express').Router();
const { MongoClient } = require('mongodb');

const DB_ADDRESS = 'mongodb://localhost:27017';
const DB_NAME = 'react-blog';
const DB_COLLECTION = 'articles';

router.get('/', async (req, res) => {

  withDB(async (db) => {

    const articles = await db.collection(DB_COLLECTION).find({}).toArray();
    res.status(200).json(articles);

  }, res);

});

router.post('/new', async (req, res) => {

  const { articleUrl, articleTitle, articleBody } = req.body;
  const articleName = (articleUrl ? articleUrl : articleTitle).trim().toLowerCase().split(/\s+/).join('-');
  const articleContent = articleBody.split(/\n+/);

  withDB(async (db) => {

    const existingArticle = await db.collection(DB_COLLECTION).findOne({ name: articleName });
    if (existingArticle != null) {
      res.status(409).json({
        name: articleName,
        error: `Article URL, ${articleName}, already exists`
      });

    } else {
      await db.collection(DB_COLLECTION).insertOne({
        created: Date.now(),
        name: articleName,
        title: articleTitle,
        content: articleContent,
        upvotes: 0,
        comments: []
      });

      const article = await db.collection(DB_COLLECTION).findOne({ name: articleName });
      res.status(201).json(article);
    }

  }, res);
});

router.get('/:name', async (req, res) => {

  const articleName = req.params.name;

  withDB(async (db) => {

    const article = await db.collection(DB_COLLECTION).findOne({ name: articleName });
    res.status(200).json(article);

  }, res);
});

// updates the article upvote count by 1
router.post('/:name/upvote', async (req, res) => {

  const articleName = req.params.name;

  withDB(async (db) => {

    // increments the db count by 1
    await db.collection(DB_COLLECTION).updateOne({ name: articleName }, { '$inc': { upvotes: 1 } });

    const updatedArticle = await db.collection(DB_COLLECTION).findOne({ name: articleName });

    res.status(200).json(updatedArticle);

  }, res);
});

router.post('/:name/add-comment', (req, res) => {

  // parse username and text from body
  const { username, text } = req.body;

  const articleName = req.params.name;

  // add comment to comments array in db
  withDB(async (db) => {

    await db.collection(DB_COLLECTION).updateOne({ name: articleName }, {
      '$push': {
        comments: { username, text, datetime: Date.now() }
      }
    });

    const updatedArticle = await db.collection(DB_COLLECTION).findOne({ name: articleName });

    res.status(200).json(updatedArticle);

  }, res);
});


async function withDB(operations, res) {
  try {

    // connect to the mongo client
    const client = await MongoClient.connect(DB_ADDRESS, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(DB_NAME);

    // preform callback operations
    await operations(db);

    // close db
    client.close();

  } catch (error) {
    console.log(error);
    res.status(500).send({ error: 'Error connecting to the database', error });
  }
};


module.exports = router;
