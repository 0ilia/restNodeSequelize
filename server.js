const Sequelize = require("sequelize");
const morgan = require("morgan");
const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3005;

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(morgan("dev"));


const sequelize = new Sequelize("tester", "root", "", {
    dialect: "mysql",
    host: "localhost"
});
const User = sequelize.define("users", {
    login: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        validate: {
            notNull: true,
            len: [4,100]
        }
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: true,
            len: [5,140],
            isEmail: true,
        },
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: true,
            len: [5,140],
        },

    }

});

const Notes = sequelize.define("notes", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement:true

    },
    login: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notNull: true,
            len: [4,100]
        }
    },
    theme: {
        type: Sequelize.STRING,
    },
    message:{
        type: Sequelize.STRING,
    }

});

User.hasMany(Notes, {foreignKey: 'login'});

sequelize.sync().then(result => {
    console.log("result");
})
    .catch(err => console.log(err));


/*User.create({
    name: "Tom",
    age: 35
}).then(res=>{
    console.log(res);
}).catch(err=>console.log(err));
User.findAll({raw:true}).then(users=>{
    console.log(users);
}).catch(err=>console.log(err ));*/

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Content-Type', 'application/json');
    next();
});

//Add User
app.post("/addUser", function (req, res) {
    if(req.body.password.length >4 ) {


        if (req.body.confirmPassword === req.body.password) {

            bcrypt.hash(req.body.password, 10, function (err, hash) {
                if (!err) {
                    passHash = hash;

                    User.create({
                        login: req.body.login,
                        email: req.body.email,
                        password: passHash,
                    }).then(() => {
                        res.status(200).json({
                            messageError: "Вы зарегистрированны",
                            register: true,
                        })
                    }).catch(function (err) {
                            res.status(200).json({
                                messageError: err['errors'][0]['message'],
                                register: false,
                            });
                            console.log(err['errors'][0]['message'])
                        }
                    )
                } else {
                    res.status(200).json({
                        messageError: "Ошибка хеширования пароля",
                        register: false,
                    });
                }
            });
        } else {
            res.status(200).json({
                messageError: "Пароли не совпадают",
                register: false,
            });
        }
    }else {
        res.status(200).json({
            messageError: "Пароль должен содержать минимум 5 символов",
            register: false,
        });
    }
});

//loginUser
app.get('/loginUser/:login/:password', (req, res, next) => {


    User.findOne({where: {login: req.params.login}})
        .then(user=>{
            if(!user) {
                res.status(200).json({
                    //  messageError: err.sqlMessage,
                    messageError: "Логин или пароль введены неверно",
                    register: false,
                });
            }else {
                if(req.params.login === user.login){

                    bcrypt.compare(req.params.password, user.password).then(function (result) {

                        if (result) {
                            res.status(200).json({
                                //  messageError: err.sqlMessage,
                                messageError: "Вы авторизовались",
                                register: true,
                            });
                        } else {
                            res.status(200).json({
                                //  messageError: err.sqlMessage,
                                messageError: "Логин или пароль введены неверно",
                                register: false,
                            });
                        }
                    });
                }else {
                    res.status(200).json({
                        //  messageError: err.sqlMessage,
                        messageError: "Логин или пароль введены неверно",
                        register: false,
                    });
                }

                console.log(user.login, user.password);

            }
        }).catch(err=>console.log(err));

});

//add Notes

app.post('/addNote', (req, res, next) => {

    Notes.create({
        login: req.body.login,
        theme: req.body.theme,
        message: req.body.theme,
    }).then((results) => {
       // console.log(results['dataValues']['updatedAt']);
        res.status(200).json({
            message: "Заметка добавленна",
            id: results['dataValues']['id'],
            updatedAt: results['dataValues']['updatedAt'],
        })
        //  console.log(results);
    }).catch(function (err) {
            res.status(200).json({
                messageError: err['dataValues']['message'],
                message: "Error",
            });
            console.log(err['errors'][0]['message'])
        }
    )

});


app.get('/getAllNotes/:login', (req, res, next) => {

    Notes.findAll({where:{login: req.params.login }, raw: true })
        .then(result=>{
            res.status(200).json({
                //  messageError: err.sqlMessage ,
                notes:result,
            });
        }).catch(err=>console.log(err));

});


app.put('/updateNote/:id', (req, res, next) => {

    Notes.update({ theme: req.body.theme,message: req.body.message }, {
        where: {
            id: req.params.id
        }
    }).then(result=>{
        res.status(200).json({
            //  messageError: err.sqlMessage ,
            update:"Успешно",
        });
    }).catch(err=>console.log(err));

});

app.put('/updateNote/:id', (req, res, next) => {

    Notes.update({ theme: req.body.theme,message: req.body.message }, {
        where: {
            id: req.params.id
        }
    }).then(result=>{
        res.status(200).json({
            //  messageError: err.sqlMessage ,
            update:"Успешно",
        });
    }).catch(err=>console.log(err));

});



app.delete('/deleteNote/:id', (req, res, next) => {

    Notes.destroy({
        where: {
            id: req.params.id
        }
    }).then(result=>{
        res.status(200).json({
            //  messageError: err.sqlMessage ,
            delete:"Заметка удалена",
        });
    }).catch(err=>console.log(err));



});



http.createServer(app).listen(port, () => console.log("Express server is running at port no http://127.0.0.1:" + port));

