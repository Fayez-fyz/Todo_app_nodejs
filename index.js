const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require('mongodb')
const bcryptjs = require('bcryptjs')
const jwt =require('jsonwebtoken')
const mongoClient =  mongodb.MongoClient;
// const url = 'mongodb+srv://todo:todoapp@cluster0.pdhym.mongodb.net?retryWrites=true&w=majority';
const url = process.env.DB
const dotenv = require("dotenv")
dotenv.config();
app.use(express.json());

const Port = process.env.PORT || 3000;
app.use(
  cors({
    origin: "*",
  })
);

function authenticate(req, res, next) {
  try {
  // Check if the token is present
  // if present -> check if it is valid
  if(req.headers.authorization){
      jwt.verify(req.headers.authorization,process.env.JWT_SECRET,function(error,decoded){
          if(error){
              res.status(500).json({
                  message: "Unauthorized"
              })
          }else{
              console.log(decoded)
              req.userid = decoded.id;
          next()
          }
          
      });
    
  }else{
      res.status(401).json({
          message: "No Token Present"
      })
  }
  } catch (error) {
      console.log(error)
      res.status(500).json({
          message: "Internal Server Error"
      })
  }
  
}


app.get("/list-all-todo",[authenticate],async function (req, res) {
  try {
        //connect the database
        let client = await mongoClient.connect(url)
        //select the db
        let db = client.db('todo_app')
        //select the connection perform the action
        let data = await db.collection('tasks').find({userid : req.userid}).toArray();
        // close the connection
        await client.close();
      res.json(data);
  } catch (error) {
    res.status(500).json({
      message:'Something went wrong'
    })
  }
});

app.post("/register", async function(req,res){
  try {
      //connect the database
      let client = await mongoClient.connect(url)
      //select the db
      let db = client.db('todo_app')
      //hashing passwords
      let salt= bcryptjs.genSaltSync(10);
      let hash = bcryptjs.hashSync(req.body.password,salt)
      req.body.password = hash
      //select the connection perform the action
        let data = await db.collection('users').insertOne(req.body)
       // close the connection
       await client.close();

       res.json({
        message: "User created",
        id: data._id
      });
    
  } catch (error) {
    res.status(500).status({
      message:'Something went wrong'
    })
  }
})

app.post('/login', async function(req,res){
  try {
    // Connect the Database
    let client = await mongoClient.connect(url)

    // Select the DB
    let db = client.db("todo_app");

    // Find the user with email_id
    let user = await db.collection("users").findOne({ username: req.body.username });

    if (user) {
        // Hash the incoming password
        // Compare that password with user's password
        console.log(req.body)
        console.log(user.password)
        let matchPassword = bcryptjs.compareSync(req.body.password, user.password)
        if (matchPassword) {
            // Generate JWT token
            let token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({
                message: true,
                token
            })
        } else {
            res.status(404).json({
                message: "Username/Password is incorrect"
            })
        }
        // if both are correct then allow them
    } else {
        res.status(404).json({
            message: "Username/Password is incorrect"
        })
    }

} catch (error) {
    console.log(error)
}


} )

app.post("/create-task",[authenticate], async function (req, res) {
  try {
      //connect the database
     let client = await mongoClient.connect(url)
     //select the db
     let db = client.db('todo_app')
     //select the connection perform the action
     req.body.userid = req.userid;
     console.log(req.body)
     let data = await db.collection('tasks').insertOne(req.body)
     // close the connection
     await client.close();

     res.json({
      message: "sucessfully created",
    });
  } catch (error) {
    res.status(500).status({
      message:'Something went wrong'
    })
    
  }

});

app.put("/update-task/:id",[authenticate], async function (req, res) {

  try {
      //connect the database
      let client = await mongoClient.connect(url)
      //select the db
      let db = client.db('todo_app')
      //select the connection perform the action
         let data = await db.collection('tasks').findOneAndUpdate({_id:mongodb.ObjectId(req.params.id)},{$set:req.body})
          // close the connection
          await client.close();
          res.json({
           message: "sucessfully updated",
         });
  } catch (error) {
    res.status(500).status({
      message:'Something went wrong'
    })
  }
    
});

app.delete("/delete-task/:id",[authenticate],async function (req, res) {
  try {
    //connect the database
    let client = await mongoClient.connect(url)
    //select the db
    let db = client.db('todo_app')
    //select the connection perform the action
       let data = await db.collection('tasks').findOneAndDelete({_id:mongodb.ObjectId(req.params.id)})
        // close the connection
        await client.close();
        res.json({
         message: "sucessfully deleted",
       });
} catch (error) {
  res.status(500).status({
    message:'Something went wrong'
  })
}
});

app.get ('/dashboard',[authenticate],async function(req,res){
    res.json({
      message:'Protected data'
    })
})

app.listen(Port, function () {
  console.log(`Server is started on port ${Port}`);
});
