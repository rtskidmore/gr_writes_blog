// requirements
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
require('dotenv').config();
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



// app creation
app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// passport
app.use(session({
    secret: "This is a string of text.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// DB design
mongoose.connect("mongodb+srv://admin-russell:" + process.env.MDB_PASS +"@cluster0.sinxksx.mongodb.net/grwritesDB");

const blogSchema = new mongoose.Schema ({
    title: {
        type: String,
        required: true
    },
    img_url: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    username: String,
    date: Number
});

const userSchema = new mongoose.Schema ({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    blogs: [blogSchema]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);
const Blog = mongoose.model("blog", blogSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req, res) {

    const blogsData = Blog.find({}, function(err, blogs) {
        const sortedBlogs = blogs.sort((a,b) => {
            return a.date - b.date;
        })
        sortedBlogs.reverse();
        res.render("index", {blogs: sortedBlogs})
    })

});

app.get("/posts/:postid", function(req,res) {
    const postid = req.params.postid;

    const requestedBlog = Blog.findById(postid, function(err, blog) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            res.render("blog", {blog: blog});
        }
    });

});

// compose routes
app.get("/compose", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("compose");
    } else {
        res.redirect("login");
    }
});

app.post("/compose", function(req, res) {

    const currentTime = Date.now();

    const newBlog = new Blog ({
        title: req.body.blogTitle,
        img_url: req.body.imgUrl,
        content: req.body.content,
        date: currentTime
    });

    newBlog.save()

    res.redirect("/");
});

// login routes
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", function(req, res) {
    User.findOne({username: req.body.username}, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                    if (result == true) {
                        req.login(foundUser, function(err) {
                            if (err) {
                                console.log(err);
                            } else {
                                passport.authenticate("local");
                                res.redirect("/compose");
                            }
                        });
                    } else {
                        alert("Incorrect username or password!");
                        res.redirect("login");
                    }
                });
            }
        }
    });
});

// logout a user
app.get("/logout", function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            res.redirect("/");
        }
    });
});

// sign up routes
app.get("/signup", function(req, res) {
    res.render("signup");
});

app.post("/signup", function(req, res) {
    const firstName = req.body.firstName;
    const email = req.body.email;
    res.redirect("/");
});

let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});