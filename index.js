const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  mongoose = require('mongoose'),
  Models = require('./models.js'),
  { check, validationResult } = require('express-validator');


const app = express();

const Movies = Models.Movie;
const Users = Models.User;

// local database
//mongoose.connect('mongodb://localhost:27017/movieDB', {useNewUrlParser: true, useUnifiedTopology: true});
// online database
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// MIDDLEWARE
app.use(bodyParser.json());
// CORS
const cors = require('cors');
// all origins allowed:
app.use(cors());

// certain origins allowed:
// let allowedOrigins = ['http://localhost:8080', 'http://testsite.com']
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true); // i don't understand this line
//     if (allowedOrigins.indexOf(origin) === -1){ // specific origin not in allowedOrigins list
//       let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
//       return callback(new Error(message), false);
//     }
//     return callback(null, true);
//   }
// }));

// authentication
require('./auth')(app);
const passport = require('passport');
require('./passport');
//Logs
app.use(morgan('common'));
app.use(express.static('public'));

// CRUD / ROUTES
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

// Return a list of ALL movies to the user
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.find()
    .then((movies) => {
      res.status(200).json(movies);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Return data about a single movie by title to the user
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
      res.status(200).json(movie);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Return data about a genre (description) by name/title
app.get('/movies/genres/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ "Genre.Name": req.params.Name })
    .then((movie) => {
      res.status(200).json(movie.Genre);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Return data about a director (bio, birth year, death year) by name
app.get('/movies/directors/:Name', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movies.findOne({ "Director.Name": req.params.Name })
    .then((movie) => {
      res.status(200).json(movie.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Input Validation methods for user data
const userValidation = [
  check('Username', 'Username must be at least 5 characters.').isLength({ min: 5 }),
  check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
  check('Password', 'Password must be at least 5 characters.').isLength({ min: 8 }),
  check('Email', 'Email is not valid').isEmail(),
  check('Birthday', 'Birthday is not valid').isDate()
];

// Allow new users to register
// Request expects JSON:
// {
//   ID: Integer,
//   Username: String,
//   Password: String,
//   Email: String,
//   Birthday: Date
// }
app.post('/users', userValidation, (req, res) => {
  //check for validation errors
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ Username: req.body.Username })
    .then((user) => {
      if (user) {
        return res.status(400).send('Username ' + req.body.Username + ' already taken.');
      } else {
        Users
          .create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday
          })
          .then((new_user) => { res.status(201).json(new_user) })
          .catch((error) => {
            console.error(error);
            res.status(500).send('Error: ' + error);
          })
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

// Allow users to update their user info (based on username)
/* Request JSON:
{
  Username: String,
  (required)
  Password: String,
  (required)
  Email: String,
  (required)
  Birthday: Date
}*/

app.put('/users/:Username', passport.authenticate('jwt', { session: false }), userValidation, (req, res) => {
  let hashedPassword = Users.hashPassword(req.body.Password);
  //check for validation errors
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  // only allow if request is referring to active user
  if (req.user.Username != req.params.Username) {
    res.status(403).json("Not authorized.");
  } else {
    // check if requested new username is already taken 
    Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res.status(400).send('Username ' + req.body.Username + ' already taken.');
        } else {
          // update user data
          Users.findOneAndUpdate({ Username: req.params.Username }, {
            $set:
            {
              Username: req.body.Username,
              Password: hashedPassword,
              Email: req.body.Email,
              Birthday: req.body.Birthday
            }
          },
            { new: true }) // updated document is returned
            .then((updatedUser) => {
              res.status(200).json(updatedUser);
            })
            .catch((err) => {
              console.error(err);
              res.status(500).send('Error: ' + err);
            });
        }
      })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      });


  }
});


// Get user data
app.get('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  // only allow if request is referring to active user
  if (req.user.Username != req.params.Username) {
    res.status(403).json("Not authorized.");
  } else {
    Users.findOne({ Username: req.params.Username })
      .then((user) => {
        res.status(200).json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
});


//Allow users to add a movie to their list of favorites
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  // only allow if request is referring to active user
  if (req.user.Username != req.params.Username) {
    res.status(403).json("Not authorized.");
  } else {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
      $push: { FavoriteMovies: req.params.MovieID }
    },
      { new: true }) // updated document is returned
      .then((updatedUser) => {
        res.status(201).send("Favorite movie successfully added to " + updatedUser.Username);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
});

//Allow users to remove a movie from their list of favorites
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
  // only allow if request is referring to active user
  if (req.user.Username != req.params.Username) {
    res.status(403).json("Not authorized.");
  } else {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
      $pull: { FavoriteMovies: req.params.MovieID }
    },
      { new: true }) // updated document is returned
      .then((updatedUser) => {
        res.status(200).send("Favorite movie successfully removed from " + updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
});

// Allow existing users to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  // only allow if request is referring to active user
  if (req.user.Username != req.params.Username) {
    res.status(403).json("Not authorized.");
  } else {
    Users.findOneAndRemove({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res.status(400).send(req.params.Username + ' was not found');
        } else {
          res.status(200).send(req.params.Username + ' was deleted.');
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
      });
  }
});


// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// listen for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Listening on Port ' + port);
});
