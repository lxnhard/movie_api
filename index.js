const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  uuid = require('uuid');

const app = express();

let topmovies = [
  {
    title: 'Movie 1',
    director: 'director 1'
  },
  {
    title: 'Movie 2',
    director: 'director 2'
  },
  {
    title: 'Movie 3',
    director: 'director 3'
  },
  {
    title: 'Movie 4',
    director: 'director 4'
  },
  {
    title: 'Movie 5',
    director: 'director 5'
  },
  {
    title: 'Movie 6',
    director: 'director 6'
  },
  {
    title: 'Movie 7',
    director: 'director 7'
  },
  {
    title: 'Movie 8',
    director: 'director 7'
  },
  {
    title: 'Movie 9',
    director: 'director 9'
  },
  {
    title: 'Movie 10',
    director: 'director 1 (again)'
  }
];

app.use(morgan('common'));
app.use(express.static('public'));

// GET requests
app.get('/', (req, res) => {
  res.send('This is going to become my incredible movie API!');
});

app.get('/movies', (req, res) => {
  res.json(topmovies);
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
