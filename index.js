const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ob384:AewneOTcxz3dx1yC@after-mdx.w9ple.mongodb.net/';
const DB_NAME = 'aftermdx';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use((req, res, next) => {
  console.log(`A ${req.method} request come from ${req.url}`);
  next();
});

let db;
const connectDB = async () => {
  try {
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db(DB_NAME);
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('✗ MongoDB connection failed:', err);
    process.exit(1);
  }
};

app.get('/api/courses/', async (req, res) => {
  try {
    const courses = await db.collection('courses').find({}).toArray();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:courseID', async (req, res) => {
  try {
    const course = await db.collection('courses').findOne(
      { _id: new ObjectId(req.params.courseID) },
      { projection: { _id: 0 } }
    );
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
