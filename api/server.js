const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config({ path: '../.env' });

const app = express();

app.use(express.json());
app.use(cors());


mongoose.connect(
    process.env.DATABASE_CONNECTION, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
).then(() => { console.log("Connected to DB") })
.catch(console.error)

const Todo = require('./models/Todo');


app.get('/todos', async (req, res) => {
    const todos = await Todo.find().sort({ index: 1 });

    res.json(todos);
})

app.post('/todo/new', async (req, res) => {
    const highestIndex = await Todo.findOne({}, {index: 1, _id: 0}).sort({ index: -1 });
    let newIndex;
    try {
        newIndex = highestIndex.index + 1;
    } catch {
        newIndex = 1;
    }
    const todo = new Todo({
        text: req.body.text,
        index: newIndex
    });
    todo.save();

    res.json(todo);
})

app.post('/todo/swap', async (req, res) => {
    const first = await Todo.findById(req.body.first);
    const second = await Todo.findById(req.body.second);

    const newFirst = await Todo.findByIdAndUpdate(first._id, { index: second.index });
    newFirst.save();
    const newSecond = await Todo.findByIdAndUpdate(second._id, { index: first.index });
    newSecond.save();

    res.json([newFirst, newSecond]);
})

app.delete('/todo/delete/:id', async (req, res) => {
    const todos = await Todo.find().sort({ index: 1 });
    const currentIndex = await Todo.findOne({_id: req.params.id}, {index: 1, _id: 0});
    
    async function adjustIndex(todo) {
        const updated = await Todo.findByIdAndUpdate(todo._id, {$inc: {index: -1}});
        updated.save();
        console.log(updated);
    }

    for (let i=currentIndex.index; i<todos.length; i++) {
        adjustIndex(todos[i]);
    }
    
    const result = await Todo.findByIdAndDelete(req.params.id);

    res.json(result);
})

app.get('/todo/complete/:id', async (req, res) => {
    const todo = await Todo.findById(req.params.id);

    todo.complete = !todo.complete;

    todo.save();

    res.json(todo);
})

app.listen(3001, () => console.log("SERVER STARTED!"));