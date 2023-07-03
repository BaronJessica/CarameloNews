const express = require("express");
const mongoose = require("mongoose");
const fileupload = require("express-fileupload");
var bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const app = express();

var session = require("express-session");

const Posts = require("./Posts.js");
const fileUpload = require("express-fileupload");
mongoose.set("strictQuery", false);
mongoose
  .connect(
    "mongodb+srv://jessicabaron93:@cluster0.ish0pis.mongodb.net/CarameloNews?retryWrites=true&w=majority",
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => {
    console.log("connected");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.use(bodyParser.json()); //to support json-encoded bodies
app.use(
  bodyParser.urlencoded({
    //to suport URL-encoded bodies
    extended: true,
  })
);

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(__dirname, "temp"),
  })
);

app.use(
  session({
    secret: "keyboard cat",
    cookie: { maxAge: 60000 },
  })
);

app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use("/public", express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "/pages"));

app.get("/", (req, res) => {
  if (req.query.search == null) {
    Posts.find({})
      .sort({ _id: -1 })
      .exec((err, posts) => {
        posts = posts.map((val) => {
          return {
            shortDescription: val.content.substring(0, 160),
            title: val.title,
            content: val.content,
            image: val.image,
            category: val.category,
            slug: val.slug,
            views: val.views,
          };
        });

        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .exec((err, postsTop) => {
            postsTop = postsTop.map((val) => {
              return {
                shortDescription: val.content.substring(0, 160),
                title: val.title,
                content: val.content,
                image: val.image,
                category: val.category,
                slug: val.slug,
                views: val.views,
              };
            });
            res.render("home", { posts: posts, postsTop: postsTop });
          });
      });
  } else {
    Posts.find(
      { content: { $regex: req.query.search, $options: "i" } },
      (err, posts) => {
        posts = posts.map((val) => {
          return {
            shortDescription: val.content.substring(0, 160),
            title: val.title,
            content: val.content,
            image: val.image,
            category: val.category,
            slug: val.slug,
            views: val.views,
          };
        });
        res.render("search", { posts: posts, count: posts.lenght });
      }
    );
  }
});

app.get("/:slug", (req, res) => {
  Posts.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { views: 1 } },
    { new: true },
    (err, resposta) => {
      if (resposta != null) {
        Posts.find({})
          .sort({ views: -1 })
          .limit(3)
          .exec((err, postsTop) => {
            postsTop = postsTop.map((val) => {
              return {
                shortDescription: val.content.substring(0, 160),
                title: val.title,
                content: val.content,
                image: val.image,
                category: val.category,
                slug: val.slug,
                views: val.views,
              };
            });
            res.render("single", { news: resposta, postsTop: postsTop });
          });
      } else {
        res.render("error", {});
      }
    }
  );
});

var users = [
  {
    login: "caramelo",
    password: "panda",
  },
];

app.post("/admin/login", (req, res) => {
  users.map((val) => {
    if (val.login == req.body.login && val.password == req.body.password) {
      req.session.login = "caramelo";
    }
  });
  res.redirect("/admin/login");
});

app.post("admin/cadastro", (req, res) => {
  let format = req.files.file.name.split(".");
  var image = "";
  if (format[format.lenght - 1] == "jpg") {
    image = new Date().geTime() + ".jpg";
    req.files.file.mv(__dirname + "/public/images/" + image);
  } else {
    fs.unlinkSync(req.files.file.tempFilePath);
  }
  Posts.create({
    title: req.body.news_title,
    image: __dirname + "http://localhost:5000/public/images/" + image,
    category: "none",
    content: req.body.news,
    slug: req.body.slug,
    author: "Admin",
    views: 0,
  });
  res.redirect("/admin/login");
});

app.get("/admin/delete/:id", (req, res) => {
  Posts.deleteOne({ _id: req.params.id }).then(() => {
    res.redirect("/admin/login");
  });
});

app.get("/admin/login", (req, res) => {
  if (req.session.login == null) {
    res.render("admin-login");
  } else {
    Posts.find({})
      .sort({ _id: -1 })
      .exec((err, posts) => {
        posts = posts.map((val) => {
          return {
            id: val._id,
            shortDescription: val.content.substring(0, 160),
            title: val.title,
            content: val.content,
            image: val.image,
            category: val.category,
            slug: val.slug,
            views: val.views,
          };
        });
        res.render("admin-panel", { posts: posts });
      });
  }
});

app.listen(5000, () => {
  console.log("Server on");
});
