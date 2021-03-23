var express = require('express')
var bodyParser = require('body-parser')
var app = express() //reference variable
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
mongoose.Promise = Promise

var dbUrl = 'mongodb://localhost:27017/belajar_nodejs'
var Message = mongoose.model('Message', {nama: String, pesan: String}) //schema definition
var MessageSensor = mongoose.model('Badword',{word: String, sensor: String}) // sensor badword


app.get('/pesan', function (req, res) {
    Message.find({}, function (err, pesan) {
        res.send(pesan)
    })
});

app.post('/pesan', async function (req, res) {

    try{
        var message = new Message(req.body)
        // await MessageSensor.create({word: "makanan", sensor: "ma*****"}) // add data
        //
        await MessageSensor.find({}, (err, words) => {
            words.forEach(word => {
                let regex = new RegExp(word.word.toString(), "ig")
                req.body.pesan = req.body.pesan.toString().replace(regex, word.sensor.toString())
            })
        })

        await message.save();
        io.emit('pesan', req.body)
        res.sendStatus(200)
    }catch (error) {
        res.sendStatus(500)
        return console.log(error)
    }finally {
        console.log('post pesan dipanggil')
    }

});

// path for sendSensor to monggo db
app.post('/sensor', async function(req,res){
    try {
        let sensorMessage = MessageSensor(req.body)
        function allData({word, sensor}){
            console.log(`Data sensor: ${word}`)
            console.log(`has been censored: ${sensor} `)
        }
        allData(sensorMessage);

        await sensorMessage.save();

    } catch (error){
        res.sendStatus(500)
        return console.log(error)
    }finally {
        console.log("Pesan Telah masuk ke Collection BadWord")
    }
})

io.on('connection', function (socket) {
    console.log('a user connected')
})

mongoose.connect(dbUrl,{ useNewUrlParser: true,useUnifiedTopology: true } ,function (err) {
    if (err)
        console.log(`Koneksi terjadi error: ${err}`)
    else
        console.log(`koneksi ke mongodb berhasil`)
})

var server = http.listen(3000, function () {
    console.log(`Server Running on port: http://localhost:${server.address().port}`)
})