const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const URL = process.env.DB; // mongodb IP address and port number
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;

//Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);

let students = [];

let authenticate = function (req, res, next) {
  if (req.headers.authorization) {
    try {
      let verify = jwt.verify(req.headers.authorization, SECRET);
      if (verify) {
        req.userid = verify._id;
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

app.post("/register", async function (req, res) {
  try {
    // Open the Connection
    const connection = await mongoClient.connect(URL);

    // Select the DB
    const db = connection.db("expressDemo");

    // Select the Collection
    const salt = await bcryptjs.genSalt(10);
    const hash = await bcryptjs.hash(req.body.password, salt);
    req.body.password = hash;
    await db.collection("users").insertOne(req.body);

    // Close the connection
    await connection.close();

    res.json({
      message: "Successfully Registered",
    });
  } catch (error) {
    res.json({
      message: "Error",
    });
  }
});

app.post("/login", async function (req, res) {
  try {
    // Open the Connection
    const connection = await mongoClient.connect(URL);

    // Select the DB
    const db = connection.db("expressDemo");

    // Select the Collection
    const user = await db
      .collection("users")
      .findOne({ username: req.body.username });

    if (user) {
      const match = await bcryptjs.compare(req.body.password, user.password);
      if (match) {
        // Token
        const token = jwt.sign({ _id: user._id }, SECRET, { expiresIn: "1m" });
        res.json({
          message: "Successfully Logged In",
          token,
        });
      } else {
        res.status(401).json({
          message: "Password is incorrect",
        });
      }
    } else {
      res.status(401).json({
        message: "User not found",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

// Route to get all students data from db
app.get("/students", authenticate, async (req, res) => {
  try {
    // Open and Establish the Connection
    const connection = await mongoClient.connect(URL);

    // Select the DB
    const db = connection.db("Studentdata");

    // Select the Collection and Insert the Data and Do the Operation
    let students = await db
      .collection("students")
      .find({ userid: mongodb.ObjectId(req.userid) })
      .toArray();

    // Close the connection - connection needs to be closed after the operation is complete otherwise the server overloads
    await connection.close();

    res.json(students);
  } catch (err) {
    console.log(err);
  }
});

// to add new student into the database
app.post("/student", authenticate, async (req, res) => {
  try {
    // Open and Establish the Connection
    const connection = await mongoClient.connect(URL); // the URL needs to be String value and this connect method will return the Promise object

    // Select the DB
    const db = connection.db("Studentdata");

    // Select the Collection and Insert the Data and Do the Operation
    req.body.userid = mongodb.ObjectId(req.userid);
    await db.collection("students").insertOne(req.body);

    // Close the connection - connection needs to be closed after the operation is complete otherwise the server overloads
    await connection.close();

    res.json({
      message: "Student Added successfully",
    });
  } catch (error) {
    console.log(error);
  }
});

// to get the data of particular student using id
app.get("/student/:id", authenticate, async function (req, res) {
  try {
    // Open and Establish the Connection
    const connection = await mongoClient.connect(URL);

    // Select the DB
    const db = connection.db("Studentdata");

    // Select the Collection and Insert the Data and Do the Operation
    let student = await db
      .collection("students")
      .findOne({ _id: mongodb.ObjectId(req.params.id) }); // to match objectID and string we need to convert the string to objectId

    // Close the connection
    await connection.close();

    res.json(student);
  } catch (error) {
    console.log(error);
  }
});

// to edit particular student data using the id
app.put("/student/:id", authenticate, async function (req, res) {
  // Find the student with ID

  try {
    // Open and Establish the Connection
    const connection = await mongoClient.connect(URL);

    // Select the DB
    const db = connection.db("Studentdata");

    // Select the Collection and do the operation
    let student = await db
      .collection("students")
      .updateOne({ _id: mongodb.ObjectId(req.params.id) }, { $set: req.body });

    // Close the connection
    await connection.close();
    res.json({ message: "Data Updated Succesfully !" });
  } catch (e) {
    console.log(e);
  }
});

// to delete a student using id
app.delete("/student/:id", authenticate, async function (req, res) {
  try {
    // Open and Establish the Connection
    const connection = await mongoClient.connect(URL);

    // Select the DB
    const db = connection.db("Studentdata");

    // Select the Collection and do the operation
    let student = await db
      .collection("students")
      .deleteOne({ _id: mongodb.ObjectId(req.params.id) }); //never use delete methods in production builds

    // Close the connection
    await connection.close();

    res.json({
      message: "Student Deleted Successfully",
    });
  } catch (e) {
    console.log(e);
  }
});

app.listen(process.env.PORT || 3001);
