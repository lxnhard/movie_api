const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const app = express();

let movies = [
  {
    'title': 'Cannibal Holocaust',
    'director': {
      'name': 'Gianfranco Clerici',
      'biography': 'birth, life, death',
      'birth year': '1941',
      'death year': ''
    },
    'genre': {
      'title': 'Horror',
      'description': 'Horror is a film genre that seeks to elicit fear or disgust in its audience for entertainment purposes.'
    }
  },
  {
    'title': 'Christmas in Connecticut',
    'director': {
      'name': 'Peter Godfrey',
      'biography': 'birth, life, death',
      'birth year': '1899',
      'death year': '1970'
    },
    'genre': {
      'title': 'Romantic comedy',
      'description': 'Romantic comedy (also known as romcom or rom-com) is a subgenre of comedy and slice-of-life fiction, focusing on lighthearted, humorous plot lines centered on romantic ideas, such as how true love is able to surmount most obstacles.'
    }
  }
];

let users = [
  {
    'name': 'lxnhard',
    'password': 'abc123',
    'favorites': [{
      'title': 'Christmas in Connecticut',
      'director': {
        'name': 'Peter Godfrey',
        'biography': 'birth, life, death',
        'birth year': '1899',
        'death year': '1970'
      },
      'genre': {
        'title': 'Romantic comedy',
        'description': 'Romantic comedy (also known as romcom or rom-com) is a subgenre of comedy and slice-of-life fiction, focusing on lighthearted, humorous plot lines centered on romantic ideas, such as how true love is able to surmount most obstacles.'
      }
    }],
    'id': 'ca9bef3b-ce03-45ae-83ef-1472530ad703'
  }
];

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
