// declare libraries with require module
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;
const app = express();
// declare a gateway port for server
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());
// database configuration
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2yruo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri);
// declare db client
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// configure crud operation and create db and api
async function run() {
  try {
    await client.connect();
    // create db
    const database = client.db('fantasyPark');
    const eventCollection = database.collection('events');
    const ordersCollection = database.collection('orders');
    // add an event to db by post api
    app.post('/addEvent', async (req, res) => {
      console.log('receiving ', req.body);
      const event = req.body;
      const result = await eventCollection.insertOne(event);
      console.log(result);
      res.json(result);
    });
    // get data from db call a get api
    app.get('/allEvents', async (req, res) => {
      console.log(req.query);
      const cursor = eventCollection.find({});
      // const events = await cursor.toArray();

      const page = req.query.page;
      const size = parseInt(req.query.size);
      let events;
      const items = await cursor.count();
      if (page) {
        events = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        const events = await cursor.toArray();
      }
      res.send({ items, events });

      // get all orders
      app.get('/allOrders', async (req, res) => {
        const cursor = ordersCollection.find({});
        const orders = await cursor.toArray();
        // console.log(orders);
        res.send(orders);
      });

      // delete item
      app.delete('/allEvents/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await eventCollection.deleteOne(query);
        res.json(result);
      });
      // delete from orders
      app.delete('/allOrders/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const query = { _id: ObjectId(id) };
        const result = await ordersCollection.deleteOne(query);
        res.json(result);
      });
    });

    // find an events
    app.get('/allEvents/:eventId', async (req, res) => {
      const id = req.params.eventId;
      console.log('get id', id);
      const query = { _id: ObjectId(id) };
      const event = await eventCollection.findOne(query);
      res.json(event);
    });
    // find multiple events by id
    app.post('/allEvents/byIds', async (req, res) => {
      var ids = req.body;
      // console.log(ids);
      const newIds = ids.map((id) => ObjectId(id));
      const query = { _id: { $in: newIds } };
      const events = await eventCollection.find(query).toArray();
      res.json(events);
    });

    // create an api for stored orders
    app.post('/orders', async (req, res) => {
      const order = req.body;
      // const option = { status: false };
      // const result = await ordersCollection.insertMany(order, option);
      // order.orderArray.map((e) => await ordersCollection.insertOne(e));
      for (const e of order.orderArray) {
        await ordersCollection.insertOne(e);
      }

      console.log('orders', order);
      res.json('Processed');
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// testing server status
app.get('/', (req, res) => {
  res.send('Hello I"m your alive server dude');
});
app.get('/test', (req, res) => {
  res.send('Hello Updated here');
});
app.listen(port, () => {
  console.log('Fantasy server breathing at port: ', port);
});
