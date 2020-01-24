const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const sckeys = require("./sckey");
const Movie = require("./models/movie");
const hbs = require("hbs");

//CONFIG MONGOOSE  ---------------------------
mongoose
  .connect(
    `mongodb+srv://movie:${sckeys.mkey}@cluster0-linf1.mongodb.net/moviesite?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Database connected");
  })
  .catch(() => {
    console.log("Database Connection Error");
  });

//FILTERING RESULTS WITH N/A POSTER VALUE (LIST.HBS) -------
const isNotEqual = function(a, b, opts) {
  if (a != b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
};
hbs.registerHelper("isNotEqual", isNotEqual);

//INDEX STARTER FROM 1 (MOVIETABLES.HBS)  -------------------
hbs.registerHelper("incremented", function(index) {
  index++;
  return index;
});

//APP SET
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set("view engine", "hbs");

//ROUTES
app.get("/", (req, res) => {
  res.render("index");
});
app.get("/movielist", (req, res) => {
  fetch(
    `http://omdbapi.com/?s=love&page=1&apikey=${sckeys.omdapikey}&type=movie`
  )
    .then(res => res.json())
    .then(data => {
      res.render("list", { data });
    });
});

app.post("/searchByTitle", (req, res) => {
  var title = req.body.search.split(" ").join("+");
  fetch(
    `http://omdbapi.com/?s=${title}&page=1&apikey=${sckeys.omdapikey}&type=movie`
  )
    .then(res => res.json())
    .then(data => {
      //res.send(data);
      if (data.Error) {
        var result = data.Error;
        res.render("error", { result });
      }
      res.render("searchpage", { data });
    })
    .catch(err => {
      console.log(err);
      var result = "Unsupported search terms. Please try again!";
      res.render("error", { result });
    });
});

app.get("/addtomyfavorites/:imbdid", (req, res) => {
  var id = req.params.imbdid;
  fetch(`http://omdbapi.com/?i=${id}&apikey=${sckeys.omdapikey}&type=movie`)
    .then(res => res.json())
    .then(data => {
      let newMovie = new Movie({
        title: data.Title,
        year: data.Year,
        movieId: data.imdbID,
        poster: data.Poster,
        added_at: Date.now()
      });

      Movie.findOne({ movieId: data.imdbID }, (err, result) => {
        if (err) {
          console.log("Database Error ----- ", err);
        }
        if (result) {
          if (result.movieId == data.imdbID) {
            res.render("likedittoomuch", { result });
          }
        } else {
          newMovie.save((err, result) => {
            if (err) throw err;
            res.render("saved", { result });
          });
        }
      });
    });
});
app.get("/dataTable", (req, res) => {
  let query = Movie.find();
  query.exec((err, result) => {
    if (err) throw err;
    res.render("movieTables", { result });
  });
});
app.get("/delete/:id", (req, res) => {
  var id = req.params.id;

  Movie.findByIdAndRemove({ _id: id }, (err, result) => {
    if (err) throw err;
    let query = Movie.find();
    query.exec((err, result) => {
      if (err) throw err;
      res.render("movieTables", { result });
    });
  });
});

app.listen(port, () => {
  console.log(`Listening on port 3001 ${port}`);
});
