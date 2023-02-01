const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

//----------------------------------------------------//
//Connect to database
mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });

//User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
})
//Exercise schema
const exerciseSchema = new mongoose.Schema({
  userId: { type: String, required: true},
  description: { type: String, required: true},
  duration: { type: Number, required: true},
  date: Date,
})
 
const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)

app.use(bodyParser.urlencoded({ extended: false })); //Use body-parser

//Post to ADD NEW USER if doesn't exist yet
app.post('/api/users', (req, res) => {
  const username = req.body.username
  //console.log(username)

  User.findOne({ username: username }, (err, find) => {
    if (err) return console.log(err);
    
    if (find) {
      res.json({ username: find.username, _id: find._id })
    } else {
      const addUser = new User({ username: username })
      addUser.save()
      res.json({ username: addUser.username, _id: addUser._id })
    }
  })
})

//Get ALL USERS registered
app.get('/api/users', (req, res) => {
  User.find({}, (err, find) => {
    if (err || !find) {
      res.send("No users registered")
    };
    res.json(find)
  })
})
//Post a exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id
  const { description, duration } = req.body
  let date = new Date(req.body.date)
  
  if (date == "Invalid Date"){
    date = new Date()
  }

  //Check if the user exist
  User.findOne( { _id: userId }, (err, find) => {
    if (err || !find) { //If not exist display error message
      res.send({ error: "User not found" })
    } else { //If existe, add new exercise
      const addExercise = new Exercise({
        userId: find._id,
        description,
        duration,
        date
      })
      //Save the new exercise and check for error
      addExercise.save((err, data) => {
        if (err || !data) {
          res.json({ error: "Error trying to save the data" })
        } else {
          //Show the new exercise added
          res.json({
            username: find.username,
            description: data.description,
            duration: data.duration,
            date: data.date.toDateString(),
            _id: find._id
          })
        }
      })
    }
  })
})

//Get exercises log for a certain user
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id

  User.findOne( {_id : userId }, (err, findUser ) => {
    if (err || !findUser) {
      res.send("User not found")
    } else {
      let { from, to, limit } = req.query
      let filter = { userId: userId }
      let dateFromTo = {}

      if (from) {
        dateFromTo['$gte'] = new Date(from)
      }
      if (to) {
        dateFromTo['$lte'] = new Date(to)
      }
      if (from || to) {
        filter.date = dateFromTo
      }
      if (!limit) {
        limit = 100;
      }
      
      Exercise.find(filter)
        .limit(+limit)
        .exec((err, findExercise) => {
        if (err || !findExercise ) {
          res.json([])
        } else {
          const count = findExercise.length
          
          const log = findExercise.map((e) => ({
            description: e.description,
            duration: e.duration,
            date: e.date.toDateString()
          }))
          
          res.json({
            _id: userId,
            username: findUser.username,
            count,
            log: log
          })
        }
      })
    }
  })
  
  /*Exercise.find( { userId: userId }, (err, find) => {
    console.log(find)
    if (err || find === []) {
      res.send("This user has no exercises done")
    } else {
      res.json(find)
    }
  })*/
  
})