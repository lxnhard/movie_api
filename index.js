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

app.use(bodyParser.json());
app.use(morgan('common'));
app.use(express.static('public'));

// Return a list of ALL movies to the user
app.get('/movies', (req, res) => {
  res.status(200).json(movies);
});

// Return data about a single movie by title to the user
app.get('/movies/:title', (req, res) => {
  const movie = movies.find((movie) => { return movie.title === req.params.title });
  if (!movie) {
    res.status(400).send("Movie "+req.params.title+"not available.");
  } else {
    res.status(200).json(movie);
    }
});

// Return data about a genre (description) by name/title
app.get('/movies/genres/:title', (req, res) => {
  const genre = movies.find((movie) => { return movie.genre.title === req.params.title }).genre;
  if (!genre) {
    res.status(400).send("Genre "+req.params.title+"not available.");
  } else {
    res.status(200).json(genre);
  }
});

// Return data about a director (bio, birth year, death year) by name
app.get('/movies/directors/:name', (req, res) => {
  const director = movies.find((movie) => { return movie.director.name === req.params.name }).director;
  if (!director) {
    res.status(400).send("Director "+req.params.name+"not available.");
  } else {
    res.status(200).json(director);
  }
});


// Allow new users to register
app.post('/users', (req, res) => {
  let newUser = req.body;
  const userExists = users.find((user) => { return user.name === newUser.name });
  console.log(newUser);
  if (!newUser.name) {
    res.status(400).send('Missing name in request body');
  } else if (userExists) {
    res.status(400).send('Username not available.');
  } else {
    newUser.id = uuid.v4();
    users.push(newUser);
    res.status(201).json(newUser);
  }
});

// Allow users to update their user info (username)
app.put('/users/:username/:new_username', (req, res) => {
  let user = users.find((user) => { return user.name === req.params.username });
  if (!user) {
    res.status(404).send("User "+req.params.username+" not found.");
  } else {
    user.username = req.params.new_username;
    res.status(201).send("Username successfully changed from "+req.params.username+" to "+req.params.new_username+".");
  }
});

//Allow users to add a movie to their list of favorites
app.post('/users/:username/favorites/:title', (req, res) => {
  let user = users.find((user) => { return user.name === req.params.username });
  let favorite = movies.find((movie) => { return movie.title === req.params.title });
  if (!user) {
    res.status(404).send("User \""+req.params.username+"\" not found.");
  } else if (!favorite) {
    res.status(404).send("Movie \""+req.params.title+"\" not found.");
  } else {
    user.favorites.push(favorite);
    res.status(201).send("Movie \""+req.params.title+"\" successfully added to favorites.");
  }
});

//Allow users to remove a movie to their list of favorites
app.delete('/users/:username/favorites/:title', (req, res) => {
  let user = users.find((user) => { return user.name === req.params.username });
  let favorite = user.favorites.find((movie) => { return movie.title === req.params.title });
  if (!user) {
    res.status(404).send("User \""+req.params.username+"\" not found.");
  } else if (!favorite) {
    res.status(404).send("Movie \""+req.params.title+"\" not found.");
  } else {
    user.favorites = user.favorites.filter((movie) => movie.name != favorite);
    res.status(201).send("Movie \""+req.params.title+"\" successfully removed from favorites.");
  }
});

// Allow existing users to deregister
app.delete('/users/:username', (req, res) => {
  let user = users.find((user) => { return user.name === req.params.username });
  if (!user) {
    res.status(404).send("User \""+req.params.username+"\" not found.");
  } else {
    users = users.filter((user) => { return user.name !== req.params.username });
    res.status(201).send('User ' + req.params.username + ' was deleted.');
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
