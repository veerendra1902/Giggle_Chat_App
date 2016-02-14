
var express =require('express');
var crypto = require('crypto');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var session = require('express-session');
var uuid = require('node-uuid');

var online_users = []
var user_socket_map={};
var socket_user_map={};
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");
app.set('port', (process.env.OPENSHIFT_NODEJS_PORT || 8080));

app.use('/public',express.static(__dirname+'/public'));
app.use(session({secret: 'secretKey'}));

var user_session;

app.get('/', function(req, res){
    user_session = req.session;
    if(user_session.user_uuid){
        res.redirect('/mainpage?id='+user_session.user_uuid)
    }
    else{
        res.sendFile(__dirname + '/landingPage.html');
    }
});

app.get('/signin', function(req, res){
    user_session = req.session;
    if(user_session.user_uuid){
        res.redirect('/mainpage?id='+user_session.user_uuid)
    }
    else{
        res.sendFile(__dirname + '/SignIn.html');
    }
});

app.get('/signup', function(req, res){
    user_session = req.session;
    if(user_session.user_uuid){
        res.redirect('/mainpage?id='+user_session.user_uuid)
    }
    else{
      res.sendFile(__dirname + '/SignUp.html');
    }

});
app.get('/success', function(req, res){
    user_session = req.session;
    if(user_session.user_uuid){
        res.redirect('/mainpage?id='+user_session.user_uuid)
    }
    else{
        res.sendFile(__dirname + '/success.html');
    }
});


app.get('/termsAndPrivacy', function(req, res){
    res.sendFile(__dirname + '/termsAndPrivacy.html');
});

app.get('/supportfailed', function(req, res){
    res.sendFile(__dirname + '/mobileError.html');
});

app.get('/mainpage', function(req, res){
    user_session = req.session;
    var query = require('url').parse(req.url,true).query;
    var user_uuid = query.id;
    // var user_session_remember = query.session
    // console.log(user_session_remember)
    user_session.user_uuid = user_uuid
    if(user_session.user_uuid){
        res.sendFile(__dirname + '/mainPage.html');
    }
    else{
        res.redirect('/signin');
    }
});

app.get('/logout', function(req, res){
    req.session.destroy(function(err){
        if(err){
            console.log('Error in Logging out',err);
        }
        else
        {
            res.redirect('/');
        }
    });
});




var connection = mysql.createConnection({
   host     : process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost',
   user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'root',
   password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD || '1234',
   database : 'giggle'
 });
  
connection.connect();
 
connection.query('create table if not exists users(uuid text, username varchar(255) NOT NULL,email text, password text, firstname text, lastname text, imageId int, UNIQUE(username), PRIMARY KEY (username))', function(err, rows, fields) {
   if (err){
     console.log('Error while performing Query of createing users table');
   }
 });

connection.query('create table if not exists messages(sender text, receiver text,message_id text, message text)', function(err, rows, fields) {
   if (err){
     console.log('Error while performing Query of createing message table');
   }
 });

connection.query('SELECT * from users', function(err, rows, fields) {
    if (!err)
     console.log('The solution is: ', rows);
    else
     console.log('Error while performing Query.');
});

console.log(uuid.v4())

io.on('connection', function(socket){
    socket.on('disconnect', function(){
        // console.log('user disconnected');
        if(socket.id in socket_user_map){
            disconnected_user_uuid = socket_user_map[socket.id]
            var uuid_index = online_users.indexOf(disconnected_user_uuid)
            if (uuid_index > -1) {
                online_users.splice(uuid_index, 1)
            }
            delete user_socket_map[disconnected_user_uuid]
            delete socket_user_map[socket.id]

            io.emit('online_users_changed',online_users);
        }

    });    
    // Listening to signup credentials. It will emit the signup_result. It checks the duplicate username.
    socket.on('signup_credentials', function(signup_credentials){
        var signup_result = {}
        var username_exists =false
        var query =  connection.query('SELECT * from users where username="'+signup_credentials.username+'"');
        query.on('result', function(row) {
            username_exists = true
        });
        query.on('end',function(){
            if(username_exists){
                console.log('username already exists')
                signup_result.success = 0
                signup_result.error_msg = 'USERNAME_EXSITS'
                socket.emit('signup_result',signup_result)
            }
            else{
                var imageId = Math.floor(Math.random()*15)+1
                var user_uuid = uuid.v4()
                var password_hash = crypto.createHash("md5").update(signup_credentials.password).digest('hex');
                var insert_query = 'insert into users values("'+user_uuid+'","'+signup_credentials.username+'","'+signup_credentials.email+'","'+password_hash+'","'+signup_credentials.firstname+'","'+signup_credentials.lastname+'",'+imageId+')'
                connection.query(insert_query, function(err, rows, fields) {
                    if (!err){
                        console.log('User Successfully created !!!');
                        signup_result.success = 1
                        socket.emit('signup_result',signup_result)
                    }
                    else{
                        console.log('Insert Unsuccessful !!!')
                        signup_result.success = -1
                        signup_result.error_msg = 'QUERY_PROBLEM'
                        socket.emit('signup_result',signup_result)
                    }
                });   
            }
        });
        
    });

    socket.on('signin_credentials', function(signin_credentials){
        var password_hash = crypto.createHash("md5").update(signin_credentials.password).digest('hex')
        var query =  connection.query('select uuid, password from users where username="'+signin_credentials.username+'"');
        var signin_result={success:-1}
        query.on('result', function(row) {
            var hashed_password = row.password
            if(hashed_password == password_hash){
                signin_result.success = 1
                signin_result.username = signin_credentials.username
                signin_result.uuid = row.uuid
                signin_result.remember = signin_credentials.remember
                console.log('Password Matched !!! Logging in...')
                // user_session.username = signin_credentials.username
            }
            else{
                signin_result.success = 0
                signin_result.username = signin_credentials.username
                signin_result.uuid = row.uuid
                signin_result.remember = signin_credentials.remember
                signin_result.message = 'PASSWORD_DOES_NOT_MATCH'
                console.log('PASSWORD_DOES_NOT_MATCH')   
            }
        });
        query.on('end',function(){
            if(signin_result.success == -1){
                signin_result.username = signin_credentials.username
                signin_result.remember = signin_credentials.remember
                signin_result.message = 'USERNAME_DOES_NOT_EXSITS'
                console.log('USERNAME_DOES_NOT_EXSITS')   
            }
            socket.emit('signin_result',signin_result);
        });
    });
    
    socket.on('mainpage_initialization', function(user_uuid){
        //Socket added to the list. For online, offline feature
        console.log(user_uuid)
        user_socket_map[user_uuid] = socket
        socket_user_map[socket.id] = user_uuid
        online_users.push(user_uuid)
        var query =  connection.query('select uuid, username,firstname,lastname,email,imageId from users where uuid="'+user_uuid+'"')
        var user_data = {online_users:online_users};
        query.on('result', function(row) {
           user_data.current_user = row
        });
        query.on('end',function(){
            var all_users = []
            var query =  connection.query('select uuid, username,firstname,lastname,email,imageId from users where uuid<>"'+user_uuid+'"')
            query.on('result', function(row) {
               all_users.push(row)
            });
            query.on('end',function(){
                user_data.friend_list = all_users
                var user_messages = {}
                var msg_query =  connection.query('select * from messages where receiver="'+user_uuid+'"')
                msg_query.on('result', function(row) {
                    if(row.sender in user_messages){
                        user_messages[row.sender].push({message_id:row.message_id,message:row.message});
                    }
                    else{
                        var message_list = [{message_id:row.message_id,message:row.message}];
                        user_messages[row.sender] = message_list;
                    }
                });
                msg_query.on('end',function(){
                    user_data.user_messages = user_messages;
                    var sent_messages = {}
                    var msg_query =  connection.query('select * from messages where sender="'+user_uuid+'"')
                    msg_query.on('result', function(row) {
                        if(row.receiver in sent_messages){
                            sent_messages[row.receiver].push({message_id:row.message_id,message:row.message});
                        }
                        else{
                            var message_list = [{message_id:row.message_id,message:row.message}];
                            sent_messages[row.receiver] = message_list;
                        }
                    });
                    msg_query.on('end',function(){
                         user_data.sent_messages = sent_messages;
                         socket.emit('mainpage_initialization',user_data);
                        io.emit('online_users_changed',online_users);
                    });
                    
                });  
            });
        });

    });

    socket.on('chat_message', function(message_detail){
        console.log(message_detail)
        var sender = message_detail.sender;
        var receiver = message_detail.receiver;
        var message = message_detail.message;
        var message_id = message_detail.message_id;
        var insert_query = 'insert into messages values("'+sender+'","'+receiver+'","'+message_id+'","'+message+'")';
        connection.query(insert_query, function(err, rows, fields) {
            if (!err){
                console.log('message stored');
            }
            else{
                console.log('message storage failed !!!')
            }
        }); 
        if(receiver in user_socket_map){
            user_socket_map[receiver].emit('incoming_chat_message',message_detail);
            console.log('msg emit');
        }
        else{
            console.log('msg did not emit');
        }
    });

    socket.on('delivered', function(ack){
        if(ack.sender in user_socket_map){
            user_socket_map[ack.sender].emit('delivered',ack);
        }
    });

    socket.on('seen', function(ack){
        if(ack.sender in user_socket_map){
            user_socket_map[ack.sender].emit('seen',ack);
            var delete_query = 'delete from messages where sender="'+ack.sender+'" and receiver="'+ack.receiver+'"';
            connection.query(delete_query, function(err, rows, fields) {
                if (!err){
                    console.log('messages deleted');
                }
                else{
                    console.log('message delete failed !!!')
                }
            }); 
        }
    });

    socket.on('typing', function(typing_detail){
        var sender = typing_detail.sender;
        var receiver = typing_detail.receiver;
        if(receiver in user_socket_map){
            user_socket_map[receiver].emit('typing',typing_detail);
        }
    });


});


// connection.end();
// io.on('connection', function(socket){
//     // console.log('socket Id- : '+ socket.id);
//     socket.on('disconnect', function(){
//         // console.log('user disconnected');
//         if(socket.id in reverse_map){
//             status[reverse_map[socket.id]]=0;
//             delete mappings[reverse_map[socket.id]];
//             delete reverse_map[socket.id];
//             var cred={};
//             cred['friends']=friendList;
//             cred['available']=status;
//             cred['identifier']=ids;
//             io.emit('state_changed',cred);
//         }

//     });
//     socket.on('credentials', function(msg){
//         // console.log("credentials");     
//         var found=0;
//         var cred={};
//         for(var i=0; i<data.length; i++){
//             if(msg.user==data[i].user && msg.pass==data[i].pass){
//                 mappings[i+1]=socket;
//                 reverse_map[socket.id]=i+1;
//                 found=1;
//                 cred['error_flag']=0;
//                 status[i+1]=1;
//                 cred['friends']=friendList[i+1];
//                 cred['identifier']=ids; 
//                 cred['myId']=i+1;
//                 break;
//             }
//         }
//         if(found==1){
//             socket.emit('credentials',cred);

//             var cred1={};
//             cred1['available']=status;
//             io.emit('state_changed',cred1);
//         }
//         else{
//             cred['error_flag']=1;
//             socket.emit('credentials',cred);
//         }
        
        
//     });



//     socket.on('chat_message',function(data){
        
//         var msg1={sender:data.sender,reciever:data.reciever,message:data.msg,self:1}

//         if(data.sender in mappings){
//             mappings[data.sender].emit('chat_message',msg1);
//         }
//         if(data.reciever in mappings){
//             msg1.self=0;
//             mappings[data.reciever].emit('chat_message',msg1);
//         }

//     });

// socket.on("typing",function(msg){
//     // console.log("typing...");
//     var msg1={type_status:0,id:msg.sender}; 
//     if(msg.val==1){
//         msg1['type_status']=1;
//     }
//     if((msg.reciever in mappings)){

//         mappings[msg.reciever].emit('typing',msg1);
//     }

// });

// socket.on("delivered",function(msg){
//     // console.log("delivered");
//     if((msg.reciever in mappings)){

//         mappings[msg.reciever].emit('delivered',msg.sender);
//     }

// });


// socket.on("seen",function(msg){
//     // console.log("seen");
//     if((msg.reciever in mappings)){

//         mappings[msg.reciever].emit('seen',msg.sender);
//     }

// });

    
// });

http.listen(app.get('port'),app.get('ip'));
console.log("Server is Running")

