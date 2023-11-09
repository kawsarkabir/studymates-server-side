const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://studymates-69d81.web.app",
      "https://studymates-69d81.firebaseapp.com",
      "http://localhost:5173"
    ],
    credentials: true,
  })
);
app.use(express.json());

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

// own midleware
const varifyToken = async (req, res, next) => {
  const token = req?.cookies?.token;
  console.log("token in the midleware", token);

  console.log(req.cookies);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.SECRET_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const assingmentCollection = client
      .db("studyMates")
      .collection("assingment");
    const submitedAssingmentCollection = client
      .db("studyMates")
      .collection("submitedAssingment");

    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_TOKEN, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          // h/* ttpOnly: true,
          // secure: process.env.NODE_ENV === "production" ? true : false,
          // sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", */
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // user logout then clear the token
    app.post("/logOutWithclearCookie", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // assingment api here
    app.post("/assingments", async (req, res) => {
      const assingment = req.body;
      res.send(await assingmentCollection.insertOne(assingment));
    });

    // get all service data
    app.get("/assingments", async (req, res) => {
      console.log('paginaaton query', req.query);
      const page = parseInt(req.query.page)
      const size = parseInt(req.query.size)
      res.send(await assingmentCollection.find()
      .skip(page * size)
      .limit(size)
      .toArray());
    });
    // count all assingment data
    app.get("/assingmentsCount", async (req, res) => {
      const count = await  assingmentCollection.estimatedDocumentCount();
      res.send({count});
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
          deoDate: assingment.dueDate,
          assingmentImgURL: assingment.assignmentImgURL,
        },
      };
      res.send(
        await assingmentCollection.updateOne(query, updateAssingment, options)
      );
    });

    // assingment delete
    app.delete("/assingments/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      res.send(await assingmentCollection.deleteOne(query));
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

    app.get("/submitedAssingment/complete", varifyToken, async (req, res) => {
      let query = {};
      if (req.query.email) {
        query = {
          assingmentStatus: "complete",
          submitedUserEmail: req.query?.email,
        };
      }
      res.send(await submitedAssingmentCollection.find(query).toArray());
    });
    app.get("/pending/pending", async (req, res) => {
      const query = {
        assingmentStatus: "pending",
      };
      res.send(await submitedAssingmentCollection.find(query).toArray());
    });

    // update submited asssingment status
    app.patch("/submitedAssingment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updated = req.body;
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
