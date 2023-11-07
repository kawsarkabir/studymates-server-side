const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// mongoDB connenct here
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hvlfmu8.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const assingmentCollection = client
      .db("studyMates")
      .collection("assingment");
    const submitedAssingmentCollection = client
      .db("studyMates")
      .collection("submitedAssingment");

    // assingment api here
    app.post("/assingments", async (req, res) => {
      const assingment = req.body;
      res.send(await assingmentCollection.insertOne(assingment));
    });

    // get all service data
    app.get("/assingments", async (req, res) => {
      res.send(await assingmentCollection.find().toArray());
    });
    // get single items
    app.get("/assingments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      res.send(await assingmentCollection.findOne(query));
    });

    // update assingment api
    app.put("/assingments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const assingment = req.body;
      const updateAssingment = {
        $set: {
          title: assingment.title,
          description: assingment.description,
          marks: assingment.marks,
          difficultyLevel: assingment.difficultyLevel,
          deoDate: assingment.deoDate,
          assingmentImgURL: assingment.assingmentImgURL,
        },
      };
      res.send(
        await assingmentCollection.updateOne(query, updateAssingment, options)
      );
    });

    //   level api
    app.get("/assingments", async (req, res) => {
      let query = { difficultyLevel: req.query.difficultyLevel };
      console.log(query);
      res.send(await assingmentCollection.find(query).toArray());
    });

    //   here is a submited assingment api
    app.post("/submitedAssingments", async (req, res) => {
      const submitedAssingments = req.body;
      res.send(
        await submitedAssingmentCollection.insertOne(submitedAssingments)
      );
    });

    // get all submited assingment data
    app.get("/submitedAssingments", async (req, res) => {
      res.send(await submitedAssingmentCollection.find().toArray());
    });
    // get single items
    app.get("/submitedAssingments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      res.send(await submitedAssingmentCollection.findOne(query));
    });

    app.get("/submitedAssingment/complete", async (req, res) => {
      const query = { assingmentStatus: 'complete' };
      res.send(await submitedAssingmentCollection.find(query).toArray());
    });
    app.get("/submitedAssingment/pending", async (req, res) => {
      const query = { assingmentStatus: 'pending' };
      res.send(await submitedAssingmentCollection.find(query).toArray());
    });

    // update submited asssingment status
    app.patch("/submitedAssingment/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const updated = req.body;
      console.log(updated);
      const updateStatus = {
        $set: {
          assingmentStatus: updated.assingmentStatus,
          title: updated.title,
          ObtainMarks: updated.ObtainMarks,
          giveFeedback: updated.giveFeedback,
        },
      };
      res.send(
        await submitedAssingmentCollection.updateOne(query, updateStatus)
      );
    });
 

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server in running");
});
app.listen(port, (req, res) => {
  console.log(`server in runing ${port}`);
});
