const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require('uuid'),
  mongoose = require('mongoose'),
  Models = require('./models.js');

const app = express();

const Movies = Models.Movie;
const Users = Models.User;
mongoose.connect('mongodb://localhost:27017/movieDB', {useNewUrlParser: true, useUnifiedTopology: true});

// MIDDLEWARE
app.use(bodyParser.json());
// authentication
let auth = require('./auth')(app);
const passport = require('passport');
require('./passport');
//Logs
app.use(morgan('common'));
app.use(express.static('public'));

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
  Movies.findOne( { Title: req.params.Title })
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
  Movies.findOne( { "Genre.Name": req.params.Name })
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
  Movies.findOne( { "Director.Name": req.params.Name })
    .then((movie) => {
      res.status(200).json(movie.Director);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });
});

// Allow new users to register
// Request expects JSON:
// {
//   ID: Integer,
//   Username: String,
//   Password: String,
//   Email: String,
//   Birthday: Date
// }
app.post('/users', (req, res) => {
  Users.findOne({ Username: req.body.Username })
  .then((user) => {
    if (user) {
      return res.status(400).send('Username '+req.body.Username+ ' already taken.');
    } else {
      Users
      .create({
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      })
      .then((new_user) => {res.status(201).json(new_user)})
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: '+error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: '+error);
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

app.put('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
  // only allow if request is referring to active user
  if (req.user.Username != req.params.Username) {
    res.status(403).json("Not authorized.");
  } else {
    Users.findOneAndUpdate( { Username: req.params.Username }, {
      $set:
      {
        Username: req.body.Username,
        Password: req.body.Password,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      }
    },
    {new: true}) // updated document is returned
    .then((updatedUser) => {
      res.status(200).json(updatedUser);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: '+err);
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
      res.status(201).send("Favorite movie successfully added to "+updatedUser.Username);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: '+err);
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
      pull: { FavoriteMovies: req.params.MovieID }
    },
    { new: true }) // updated document is returned
    .then((updatedUser) => {
      res.status(200).send("Favorite movie successfully removed from "+updatedUser.Username);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error: '+err);
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
app.listen(8080, () => {
  console.log('Your app is listening on port 8080.');
});
