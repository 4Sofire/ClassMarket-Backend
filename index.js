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

app.post('/checkout', async (req, res) => {
  try {
    const orderObject = req.body;
    orderObject.time = new Date();
    orderObject.orderDetails = JSON.parse(orderObject.orderDetails);
    
    const coursesCol = db.collection('courses');
    const ordersCol = db.collection('orders');
    
    // Update available spaces for each course in the order
    for (const order of orderObject.orderDetails) {
      const { course, space } = order;
      
      const courseData = await coursesCol.findOne({ name: course });
      
      if (!courseData) {
        throw new Error(`Course "${course}" not found`);
      }
      
      if (courseData.availableSpaces < space) {
        throw new Error(`Not enough spaces available for "${course}"`);
      }
      
      // Decrease available spaces
      await coursesCol.updateOne(
        { name: course },
        { $inc: { availableSpaces: -space } }
      );
      
      console.log(`Updated ${course}: Available spaces decremented by ${space}`);
    }
    
    // Store the order
    const result = await ordersCol.insertOne(orderObject);
    console.log(`Insertion ${result.insertedId}: Complete`);
    
    res.status(201).json({ success: true, message: 'Order Completed' });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: err.message || 'Bad Order Could Not be completed' });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const result = await db.collection('courses').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ success: true, message: 'Course updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
});
