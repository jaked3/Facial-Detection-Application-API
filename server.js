const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');



const db = knex({
client: 'pg',
connection:{
	host : '127.0.0.1',
	user : 'user',
	password: '',
	database: 'smart-brain'

	}
});




const app = express();

app.use(bodyParser.json());
app.use(cors());

// const database ={
// 	users:[
// 		{
// 			id: '123',
// 			name: 'John',
// 			email: 'john@gmail.com',
// 			password: 'cookies',
// 			entries: 0,
// 			joined: new Date()

// 		},
// 		{
// 			id: '124',
// 			name: 'Sally',
// 			email: 'Sally@gmail.com',
// 			password: 'dog',
// 			entries: 0,
// 			joined: new Date()

// 		}


// 	]
// }

const app2 = new Clarifai.App({
 apiKey: 'insert api key here'
});

const handleApiCall = (req, res) => {
	app2.models
  	.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
    .then(data => {
    	res.json(data);
    })
    .catch(err => res.status(400).json('unable to work with api'))
}

app.get('/', (req, res)=> {
	res.send(database.users);
})

// if (!email !password) {

// 	return res.status(400).json('incorrect form submission');
// }

app.post('/signin', (req,res) => {
	db.select('email', 'hash').from('login')
		.where('email', '=', req.body.email)
		.then(data => {
		const isValid = bcrypt.compareSync(req.body.password, data[0].hash); 
		if (isValid) {
			return db.select('*').from('users')
			.where('email', '=', req.body.email)
			.then(user => {
				res.json(user[0])	
			})
			.catch(err => res.status(400).json('unable to get user'))
		}
		else{
			res.status(400).json('wrong')
		}
	})
	.catch(err => res.status(400).json('wrong credentials'))
	
})

// if (!email || !name || !password) {

// 	return res.status(400).json('incorrect form submission');
// }
app.post('/register', (req,res) => {
	const {email, name, password} = req.body;
	const hash = bcrypt.hashSync(password);
		db.transaction(trx => {
			trx.insert({
				hash: hash,
				email: email
			})
			.into('login')
			.returning('email')
			.then(loginEmail => {
			return trx('users')
				.returning('*')
				.insert({
					email: loginEmail[0],
					name: name,
					joined: new Date()
				})
				.then(user => {
				res.json(user[0]);
				})

			})
			.then(trx.commit)
			.catch(trx.rollback)
		})
		
	.catch(err => res.status(400).json('unable to register'))
	
})

app.get('/profile/:id', (req,res) => {
	const {id} = req.params;

	db.select('*').from('users').where({
		id: id
	})
	.then(user => {
		if(user.length){
			res.json(user[0])
		}else{
			res.status(400).json('not found')
		}
		
	})
	.catch(err => res.status(400).json('error getting user'))

})


app.put('/image', (req,res) =>{
	const {id} = req.body;
		db('users').where('id', '=', id)
			.increment('entries', 1)
			.returning('entries')
			.then(entries =>{
				res.json(entries[0]);
			})
			.catch(err => res.status(400).json('Unable to get account'))
		
		// let found = false;
		// 	database.users.forEach(user =>{
		// 		if (user.id === id){
		// 			found = true;
		// 			user.entries++
		// 			return res.json(user.entries);
					
		// 		}

		// 	})
		// 	if (!found){
		// 		res.status(400).json('not found')
		// }
})

app.post('/imageurl', (req, res) => {handleApiCall(req, res)})

app.listen(3001, () => {
	console.log('working');
	
})


