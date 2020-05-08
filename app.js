// include external libs
require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const ejs = require("ejs");
const _ = require("lodash");
const findOrCreate = require("mongoose-findorcreate");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// create and config app
app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(session({
    secret:"thisIsARandomMessage",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

// config connection to mongoDB
const uri = "mongodb://localhost:27017/newUserDB"
mongoose.connect(uri,{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

// create and config document schema and model
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    username:String,
    googleId:String,
    contents:[String]
});
userSchema.plugin(findOrCreate);
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User",userSchema);

// config passport and session
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// config get requests
app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});
app.get("/user/:username",function(req,res){
    res.render("secrets",{userName:req.params.username});
});
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
});

// config post requests
app.post("/login",passport.authenticate("local",{failureRedirect:"/login"}),function(req,res){
    res.redirect("/user/"+req.user.username);
});
app.post("/register",function(req,res){
    const email = req.body.email;
    const password = req.body.password;
    const userName = _.toLower(req.body.Name);
    User.register({username:userName,email:email},password,function(err,user){
        if(!err){
            User.authenticate("local")(req,res,function(){
                console.log(user);
                res.redirect("/user/"+user.username);
            });
        }else{
            console.log(err);
            res.redirect("/register");
        }
    })
});

// config port and server
let port = process.env.PORT;
if (port == null || port == ""){
    port = 3000;
}
app.listen(port,function(){
    console.log("server is connected to port: "+port);
})