
const express = require('express');
const mongoose = require('mongoose');
var bodyParser = require('body-parser');

const path = require('path');
const app = express();

const Posts = require('./Posts.js');
mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://jessicabaron93:5rRkfzNr7idqssE0@cluster0.ish0pis.mongodb.net/CarameloNews?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    console.log('connected')
}).catch((err) => {
    console.log(err.message)
})

app.use(bodyParser.json()); //to support json-encoded bodies
app.use(bodyParser.urlencoded({ //to suport URL-encoded bodies
    extended: true
}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/pages'));

app.get('/', (req, res) => {

    if (req.query.search == null) {
        Posts.find({}).sort({ '_id': -1 }).exec((err, posts) => {
            posts = posts.map((val) => {
                return {
                    shortDescription: val.content.substring(0, 160),
                    title: val.title,
                    content: val.content,
                    image: val.image,
                    category: val.category,
                    slug: val.slug,
                    views: val.views
                }
            })

            Posts.find({}).sort({ 'views': -1 }).limit(3).exec((err, postsTop) => {
                postsTop = postsTop.map((val) => {
                    return {
                        shortDescription: val.content.substring(0, 160),
                        title: val.title,
                        content: val.content,
                        image: val.image,
                        category: val.category,
                        slug: val.slug,
                        views: val.views
                    }
                })
                res.render('home', { posts: posts, postsTop: postsTop });
            })


        })
    } else {

        Posts.find({ content: { $regex: req.query.search, $options: "i" } }, ((err, posts) => {
            posts = posts.map((val) => {
                return {
                    shortDescription: val.content.substring(0, 160),
                    title: val.title,
                    content: val.content,
                    image: val.image,
                    category: val.category,
                    slug: val.slug,
                    views: val.views
                }
            })
            res.render('search', { posts: posts, count:posts.lenght })
        }))
    }

});

app.get('/:slug', (req, res) => {
    Posts.findOneAndUpdate({ slug: req.params.slug }, { $inc: { views: 1 } }, { new: true }, (err, resposta) => {
        if (resposta != null) {
            Posts.find({}).sort({ 'views': -1 }).limit(3).exec((err, postsTop) => {
                postsTop = postsTop.map((val) => {
                    return {
                        shortDescription: val.content.substring(0, 160),
                        title: val.title,
                        content: val.content,
                        image: val.image,
                        category: val.category,
                        slug: val.slug,
                        views: val.views
                    }
                })
                res.render('single', { news: resposta, postsTop: postsTop })
            })
        } else {
            res.render('error', {})
        }


    })
})




app.listen(5000, () => {
    console.log("Server on")
})