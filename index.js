const express = require('express');
const cors = require('cors');
require('dotenv').config()
var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.b2stcle.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const courseCollection =client.db('learnDB').collection('courses');
    const usersCollection =client.db('learnDB').collection('users');
    const teachersrequestCollection =client.db('learnDB').collection('teachers');
    const enrolledCourseCollection =client.db('learnDB').collection('enrolled');


     //jwt related api
     app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: '1h'});
        res.send({token});
    })

//middlewares
const verifyToken = (req, res, next) =>{
  console.log('inside verify token', req.headers);
  if(!req.headers.authorization){
    return res.status(401).send({message: 'forbidden access'});
  }
  const token = req.headers.authorization.split(' ')[1];
  // next();
}


//users related api
// verifyToken
app.get('/users', async(req, res)=>{
const result = await usersCollection.find().toArray();
res.send(result);
})

app.patch('/users/admin/:id', async(req, res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const updateDoc ={
    $set:{
      role:'admin'
    }
  }
  const result = await usersCollection.updateOne(filter,updateDoc)
  res.send(result);
})



app.post('/user',async(req,res)=>{
  const user = req.body;
  //insert email if user dosent exist:
  const query = {email: user.email}
  const existingUser = await usersCollection.findOne(query)
  if(existingUser){
    return res.send({message: 'user already exist', insertedId:null})
  }
  const result = await usersCollection.insertOne(user);
  res.send(result);
})



//course related api

app.post('/course', async(req, res)=>{
  const course = req.body;
  const result = await courseCollection.insertOne(course);
  res.send(result)
})
    app.get('/course',async(req, res)=>{
        const result = await courseCollection.find().toArray();
        res.send(result)
    })

    app.get('/courses/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await courseCollection.find(filter).toArray();
      res.send(result);
    });

//accepted course
app.patch('/accept/:id', async(req, res)=>{
  const id= req.params.id;
  console.log(id)
  const filter = {_id: new ObjectId(id)};
  // const user = await usersCollection.findOne(query)
  const updateDoc ={
    $set:{
      status:'accepted'
    }
  }
  const result = await courseCollection.updateOne(filter,updateDoc)
  res.send(result);
})

//Reject course
app.patch('/reject/:id', async(req, res)=>{
  const id= req.params.id;
  const filter = {_id: new ObjectId(id)};
  // const user = await usersCollection.findOne(query)
  const updateDoc ={
    $set:{
      status:'rejected'
    }
  }
  const result = await courseCollection.updateOne(filter,updateDoc)
  res.send(result);
})



//single product delete by teacher 
app.delete('/course/:id', async(req, res) =>{
  const id  = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result  = await courseCollection.deleteOne(query);
  res.send(result);
})

app.post('/enroll/:id', async(req, res)=>{
  const id = req.params.id;
  
  const filter = courseCollection.findOne(id);
  const result = await enrolledCourseCollection.insertOne(filter);
  res.send(result);
})





//admin check
app.get('/users/admin/:email', async(req, res)=>{
  const email = req.params.email;
  // if(email !== req.decoded.email){
  //   return res.status(403).send({message:'unauthorized access'})
  // }

  const query = {email: email}
  const user = await usersCollection.findOne(query)
  let admin = false;
  if(user){
    admin = user?.role === 'admin';
  }
  res.send({admin});
})

















//Teachers related api
app.post('/teachers',async(req, res)=>{
  const teacher = req.body;
  const result = await teachersrequestCollection.insertOne(teacher)
})

app.get('/teachers', async(req, res)=>{
  const result = await teachersrequestCollection.find().toArray();
  res.send(result);
})



//both update user role and request approved for teacher

app.patch('/users/teacher/:email', async (req, res) => {
  const email = req.params.email;
  const updateDoc = {
    $set: {
      role: 'teacher',
      status: 'approved',
    },
  };

  try {
    // Update users collection
    const usersResult = await usersCollection.updateOne({ email }, updateDoc);

    // Update teachers request collection
    const teachersRequestResult = await teachersrequestCollection.updateOne({ email }, updateDoc);

    res.json({
      usersResult: usersResult.modifiedCount,
      teachersRequestResult: teachersRequestResult.modifiedCount,
    });
  } catch (error) {
    console.error('Error updating collections:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/users/teacher/:id', async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await teachersrequestCollection.deleteOne(query);
  res.send(result);
})


// //make teacher
// app.patch('/users/teacher/:email', async(req, res)=>{
//   const email= req.params.email;
//   const filter = {email:email};
//   // const user = await usersCollection.findOne(query)
//   const updateDoc ={
//     $set:{
//       role:'teacher',
//       status:'approved',
//     }
//   }
//   const result = await usersCollection.updateOne(filter,updateDoc)
//   res.send(result);
// })
// //make teacher
// app.patch('/users/teacher/:email', async(req, res)=>{
//   const email= req.params.email;
//   const filter = {email:email};
//   // const user = await usersCollection.findOne(query)
//   const updateDoc ={
//     $set:{
//       role:'teacher',
//       status:'approved',
//     }
//   }
//   const result = await teachersrequestCollection.updateOne(filter,updateDoc)
//   res.send(result);
// })



//is Teacher ?
app.get('/users/teacher/:email', async(req, res)=>{
  const email = req.params.email;
  // if(email !== req.decoded.email){
  //   return res.status(403).send({message:'unauthorized access'})
  // }

  const query = {email: email}
  const user = await usersCollection.findOne(query)
  let teacher = false;
  if(user){
    teacher = user?.role === 'teacher';
  }
  res.send({teacher});
})






    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/',(req, res)=>{
    res.send('learn me is running')
})

app.listen(port,()=>{
    console.log(`Learn Me Server is running on port ${port}`)
})