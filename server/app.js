require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth20").Strategy;
const userdb = require("./Model/userSchema");
require("./DB/connection");
const PORT = 6005;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,PUT,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());

// setup session
app.use(
  session({
    secret: "hfaiugouwQUgcioig12BIOBAWIIsf45682@*hvw&",
    resave: false,
    saveUninitialized: true,
  })
);

// setup passport

app.use(passport.initialize());
app.use(passport.session());

app.get("/logout", (req, res, next) => {
  req.logout(function(err){
    if(err){return next(err)}
    res.redirect("http://localhost:5173/sign-in");
  })
})

passport.use(
  new OAuth2Strategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userdb.findOne({ googleId: profile.id });

        if (!user) {
          user = new userdb({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
            image: profile.photos[0].value,
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "http://localhost:5173/",
    failureRedirect: "http://localhost:5173/sign-in",
  })
);


app.get("/login/sucess", async(req, res) => {
  
  if(req.user){
    res.status(200).json({success: true, message: "User Login", user: req.user});
  }else{
    res.status(400).json({success: false, message: "unauthorized user"});
  }
});

app.listen(PORT, () => {
  console.log(`server started at post ${PORT}`);
});
