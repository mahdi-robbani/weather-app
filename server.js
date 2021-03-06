//import and set up environment modules
import dotenv from 'dotenv'
dotenv.config()

//import packages
import express, { request } from 'express'
import fs from 'fs'
import { MongoClient, CURSOR_FLAGS, ObjectId } from 'mongodb'
import fetch from 'node-fetch';

//create app
const app = express();
//get port from environment variable or user localhost:3000
const port = process.env.PORT || 3000
//start listening
app.listen(port, () => console.log(`Listening at port: ${port}`))
//use the express library to host static files
app.use(express.static('public'));
//enable ability to receive json data
app.use(express.json({limit: '1mb'}));

//uncomment to use local uri
// const db_uri = 'mongodb://127.0.0.1:27017'

//use mongodb atlas
const db_uri = `mongodb+srv://${process.env.DB_USER}:${process.env.PASSWORD}@cluster0.b8ua4.mongodb.net/location-app.?retryWrites=true&w=majority`

//new instance of mongo client
const client = new MongoClient(db_uri, { useNewUrlParser: true, useUnifiedTopology: true });

//add endpoints
app.get('/api', async (request, response) => {
    //access info from db and send to response
    const query = ""
    findDb(response, query, "weather", "location-app");
});

app.get('/weather/:lat/:lon', async (request, response) => {
    //receive latlon info from client and use it to get weather +aq data
    //from external APIs
    const lat = request.params.lat;
    const lon = request.params.lon;
    const APIkey = process.env.API_KEY

    //use openweather API
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${APIkey}`
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();
    
    //use open air quality API
    const aqUrl = `https://u50g7n0cbj.execute-api.us-east-1.amazonaws.com/v2/latest?limit=100&page=1&offset=0&sort=desc&coordinates=${lat},${lon}&radius=1000&order_by=lastUpdated&dumpRaw=false`
    const aqResponse = await fetch(aqUrl);
    const aqData = await aqResponse.json();

    const data = {
        weather: weatherData,
        aq: aqData,
    }
    response.json(data);
})

app.post('/weather', (request, response) => {
    //save weather data to db
    response.json({
        status: "success",
        data: request.body,
    })

    //update database
    const newLocation = {
        date: Date.now(),
        lat: request.body.latitude,
        lon: request.body.longitude,
        country: request.body.weather.sys.country,
        weather: request.body.weather.weather[0].main,
        temp: request.body.weather.main.temp,
        feels: request.body.weather.main.feels_like,
        humidity: request.body.weather.main.humidity,
        aqArray: request.body.aqArray,
    }
    addOneDb(newLocation, "weather", "location-app")
});

app.post('/delete_location', (request, response) => {
    response.json({
        status: "success",
        info: `Deleted location ID: ${request.body.locationID}`
    });
    const query = {"_id" : ObjectId(request.body.locationID)};
    deleteOneDb(query, "weather", "location-app")
})

// app.post('/api', (request, response) => {
//     response.json({
//         status: "success",
//         data: request.body,
//     })
//     //updateLocalFile(request)
//     updateDb(request, "location")
// });

async function deleteOneDb(query, collectionName, dbName){
    try{
        //connect to client
        await client.connect();

        //delete location
        console.log(query)
        const result = await client.db(dbName).collection(collectionName).deleteOne(query);
        console.log(`Update DB: ${dbName}`)
        console.log(`Updated collection: ${collectionName}`)
        console.log(`${result.deletedCount} ID deleted: ${query._id}`);
    } catch (e) {
        console.error(e)
    } finally {
        //close connection after performing all operations
        await client.close()
    }
}

async function findDb(response, query, collectionName, dbName){
    // query data from db
    try{
        //connect to client
        await client.connect();

        //list all entries
        const cursor = await client.db(dbName).collection(collectionName).find(query);
        const data = await cursor.toArray();

        //send data
        response.json(data);
    } catch(e){
        console.error(e);
    } finally {
        await client.close(); 
    }
}

async function addOneDb(newLocation, collectionName, dbName){
    //update db with new data
    try{
        //connect to client
        await client.connect();

        const result = await client.db(dbName).collection(collectionName).insertOne(newLocation);
        console.log(`Update DB: ${dbName}`)
        console.log(`Updated collection: ${collectionName}`)
        console.log(`New location ID: ${result.insertedId}`);

    } catch (e) {   
        console.error(e)
    } finally {
        //close connection after performing all operations
        await client.close()
    }
}

function updateLocalFile(request){
    //load and save data to local file
    fs.readFile("location.txt", 'utf-8', (err, data) => {
        console.log("File loaded")
        location = JSON.parse(data)
        location.push(request.body)
        console.log(location)
        fs.writeFile("location.txt", JSON.stringify(location), (err) => {
            if (err) throw err;
            console.log("File saved")
        })
    })
}

//nodemon ./server.js