const Sequelize = require("sequelize");
const morgan = require("morgan");
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3005;

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(morgan("dev"));

/*
const sequelize = new Sequelize("tester", "root", "", {
    dialect: "mysql",
    host: "localhost"
});*/


const sequelize = new Sequelize("postgres://dxxvygmwbayrvz:c597caa441805314c373329c7a5ce350b73e1ce1f6e4ef88a81418378be789a1@ec2-46-137-177-160.eu-west-1.compute.amazonaws.com:5432/d1akeuhvh055t2");

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

    if(req.body.login.trim().length >3 ) {
        if (req.body.password.length > 4) {
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
                              //  console.log(err);
                                res.status(200).json({
                                   // messageError: err['errors'][0]['message'],
                                    messageError: err['parent']['sqlMessage'],
                                    register: false,
                                });
                                console.log(err['parent']['sqlMessage']);
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
        } else {
            res.status(200).json({
                messageError: "Пароль должен содержать минимум 5 символов",
                register: false,
            });
        }
    }else {
        res.status(200).json({
            messageError: "Логин должен содержать минимум 4 символа",
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
    console.log(req.body.theme.trim());
if(req.body.theme.trim()!==""||req.body.message.trim()!=="") {
    Notes.create({
        login: req.body.login,
        theme: req.body.theme.trim(),
        message: req.body.message.trim(),
    }).then((results) => {
        // console.log(results['dataValues']['updatedAt']);
        res.status(200).json({
            message: "Заметка добавленна",
            id: results['dataValues']['id'],
            updatedAt: results['dataValues']['updatedAt'],
            createdAt: results['dataValues']['createdAt'],

            theme: results['dataValues']['theme'],
            message: results['dataValues']['message'],
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
}
});


app.get('/getAllNotes/:login', (req, res, next) => {

    Notes.findAll({where:{login: req.params.login },

        order: [
            ['createdAt', 'DESC'],

        ],
        raw: true })
        .then(result=>{
            res.status(200).json({
                //  messageError: err.sqlMessage ,
                notes:result,
            });
        }).catch(err=>console.log(err));

});


app.put('/updateNote/:id', (req, res, next) => {



    (async function () {
        await Notes.update({ theme: req.body.theme,message: req.body.message }, {
            where: {
                id: req.params.id
            }
        }).then(result=>{
            /*  res.status(200).json({
                  //  messageError: err.sqlMessage ,
                  update:"Успешно",
              });*/

        }).catch(err=>console.log(err));



        Notes.findOne({where: {id: req.params.id}})
            .then(result=>{
                console.log(result['dataValues']['updatedAt']);
                console.log(result['_previousDataValues']['updatedAt']);
                res.status(200).json({
                    //  messageError: err.sqlMessage,
                    update:"Заметка сохранена",
                    updatedAt:result['dataValues']['updatedAt'],
                });
            }).catch(err=>console.log(err));

    }());


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



https.createServer(app).listen(port, () => console.log("Express server is running at port no http://127.0.0.1:" + port));

