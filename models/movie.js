const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const movie = new Schema({
  title: String,
  year: String,
  poster: String,
  movieId: String,
  added_at: Date
});

const Movie = mongoose.model("movie", movie);
module.exports = Movie;
