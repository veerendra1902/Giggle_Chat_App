var socket = io();
var global_uuid;
var selected_friend = "no-body";
var user_friend_list = []
var Happiness_level=["Feeling low? Talking to friends might help.","Feeling bored? Let's chat with some friends.","Talking with friends might raise your happiness level.","Good to see you  happy.","Excited? Let's share with your friends."];
var user_seen_message_log = {}
var user_delivered_message_log = {}

function logout(){
	socket.emit('logout',global_uuid)
	window.open("/logout","_self");	
} 

function apply_seen_status(ack){
	var sender = ack.sender;
	var receiver = ack.receiver;
	var message_id = ack.message_id;
	var i = 0;
	if(receiver in user_seen_message_log){
		// var message_list = user_seen_message_log[receiver];
		while(i < user_seen_message_log[receiver].length){
			var seen_message_id = parseInt(message_id);
			var sent_message_id = parseInt(user_seen_message_log[receiver][i]);
			if(seen_message_id >= sent_message_id){
				document.getElementById(sent_message_id+'-single-tick').style.display = 'none';
				document.getElementById(sent_message_id+'-double-tick').style.display = 'none';
				document.getElementById(sent_message_id+'-blue-tick').style.display = 'block';
				user_seen_message_log[receiver].splice(i, 1);
			}
			else{
				i = i+1;
			}
		}
	}
	
}

function apply_delivered_status(ack){
	var sender = ack.sender;
	var receiver = ack.receiver;
	var message_id = ack.message_id;
	var i = 0;
	if(receiver in user_delivered_message_log){
		// var message_list = user_delivered_message_log[receiver];
		while(i < user_delivered_message_log[receiver].length){
			var seen_message_id = parseInt(message_id);
			var sent_message_id = parseInt(user_delivered_message_log[receiver][i]);
			if(seen_message_id >= sent_message_id){
				document.getElementById(sent_message_id+'-single-tick').style.display = 'none';
				document.getElementById(sent_message_id+'-double-tick').style.display = 'block';
				document.getElementById(sent_message_id+'-blue-tick').style.display = 'none';
				user_delivered_message_log[receiver].splice(i, 1);
			}
			else{
				i = i+1;
			}
		}
	}
	
}

$(document).ready(function(){
	var current_url = String(window.location.href);
	var index = current_url.indexOf("?id=");
	var user_uuid = current_url.substr(index+4)
	global_uuid = user_uuid
	console.log(user_uuid)
	socket.emit('mainpage_initialization', user_uuid);

	socket.on('mainpage_initialization', function(user_data){
		// console.log(user_data);
		// selected_friend = user_data.friend_list[0].uuid;
		var friendList=user_data.friend_list;
		user_friend_list = friendList;

		var image=$('#TheImg');
		var friend_list_div = $('#friend_list');
		var chat_box_div=$('#chat_box');
		var current_chat_friend_div=$('#current_chat_friend');
		var len=user_friend_list.length

		for(i=0;i<len;i++)
		{
			var user = user_friend_list[i];
			var FirstName=user.firstname;
			var LastName=user.lastname;
			var Name=String(FirstName) + " "+String( LastName);
			image.append('<div id="'+user.uuid+'-img"> <img src="public/images/m'+user.imageId+'.jpg" style="height:80px;width:75px"> </div>')
			friend_list_div.append('<div id="'+user.uuid+'" style="font-family:Lato;font-size:20px;height:80px;background-color:#ffffff;border-bottom:1px solid #e3e8cf"> <div id="'+ user.uuid+'-name"> '+Name+'</div> <div class="row"> <div id="'+user.uuid+'-new-message" class="col-md-3" style="display:none;"> <img src="public/images/new_message.jpg" style="width:30px; height:30px;"> </div> <div id="'+user.uuid+'-new-message-reverse" class="col-md-3" style="display:block;"> </div> <div class="col-md-1" id ="'+user.uuid+'-greendot-reverse" style="display:block;"></div> <div class="col-md-1" id ="'+user.uuid+'-greendot" style="display:none;"> <img src="public/images/greendot.png" style="height:10px;width:10px"> </div> <div class="col-md-6" id="'+user.uuid+'-status" > offline </div> <div class="col-md-6" id="'+user.uuid+'-typing" style="display:none;"> typing... </div> </div></div>')
			chat_box_div.append('<div id="'+user.uuid+'chat" style="font-family:Lato;font-size:20px;height:515px;background-color:#ffffff;display:none;"> <br> </div>')
			current_chat_friend_div.append('<div id="'+user.uuid+'currentChat" style="font-family:Papyrus;font-weight:bold;font-size:20px;height:515px;display:none;text-align:center;margin-top:2%"> <div> '+Name+' </div> <div class="row"> <div class="col-md-5"> </div> <div class="col-md-1" id ="'+user.uuid+'-currentChat-greendot-reverse" style="display:block;"></div><div class="col-md-1" id ="'+user.uuid+'-currentChat-greendot" style="display:none;"> <img src="public/images/greendot.png" style="height:10px;width:10px"> </div> <div class="col-md-1" id="'+user.uuid+'-currentChat-status" style="margin-left:-30px;"> offline </div> <div class="col-md-1" id="'+user.uuid+'-currentChat-typing" style="margin-left:-30px; display:none;"> typing... </div> </div>')

			$('#'+user.uuid).click(function(event) {
			    selected_friend = $(this).attr('id');
			    document.getElementById('initial_message').style.display='none';
			    document.getElementById('input_box').style.display='block';

			    for(j=0;j<len;j++)
			    {
			    	if(selected_friend==user_friend_list[j].uuid)
			    		{
			    			document.getElementById(user_friend_list[j].uuid+"chat").style.display='block';
			    			document.getElementById(user_friend_list[j].uuid+"currentChat").style.display='block';
			    		}
			    	else{
			    		document.getElementById(user_friend_list[j].uuid+"chat").style.display='none';
			    		document.getElementById(user_friend_list[j].uuid+"currentChat").style.display='none';
			    		}
			    }
			    console.log('selected_friend = '+selected_friend)
			    var milliseconds = (new Date).getTime();
	        	var message_id = ""+milliseconds;
				var ack = {sender:selected_friend,receiver:global_uuid,message_id:message_id}
			    socket.emit('seen',ack);
			    document.getElementById(selected_friend+'-new-message').style.display='none';
				document.getElementById(selected_friend+'-new-message-reverse').style.display='block';
				$('#'+selected_friend+'-name').css("font-weight","normal");
			});

			

        $('input:radio[name="inlineRadioOptions"]').change(function(){
        	if ($(this).is(':checked')){
        		document.getElementById("happiness_level").innerHTML=Happiness_level[parseInt($(this).val())-1];
        	}
    	});



			$('#'+user.uuid).bind("mouseover", function(){
	            var color  = $(this).css("background-color");

	            $(this).css("background", "#d3d3d3");
				$(this).css("cursor", "pointer");
	            $(this).bind("mouseout", function(){
                $(this).css("background", color);
	            });    
	        }) ;
		}

		var online_users = user_data.online_users;
		for(var i = 0; i < online_users.length; i++){
			if(online_users[i] == user_data.current_user.uuid){
				continue;
			}
			document.getElementById(online_users[i]+'-status').innerHTML = 'online'
			document.getElementById(online_users[i]+'-currentChat-status').innerHTML = 'online'
			document.getElementById(online_users[i]+'-greendot').style.display = 'block'
			document.getElementById(online_users[i]+'-currentChat-greendot').style.display = 'block'
			document.getElementById(online_users[i]+'-greendot-reverse').style.display = 'none'
			document.getElementById(online_users[i]+'-currentChat-greendot-reverse').style.display = 'none'
			$('#'+online_users[i]).insertAfter('#friend_list_start');
			$('#'+online_users[i]+'-img').insertAfter('#image_list_start');
		}

		var current_user_div = $('#current_user_name');
		var current_user_image = $('#current_user_image');
		var user_first_name=user_data.current_user.firstname;
		var user_last_name=user_data.current_user.lastname;
		var user_name=String(user_first_name) + " "+String(user_last_name);

		current_user_image.append('<img src="public/images/m'+user_data.current_user.imageId+'.jpg" style="height:180px;width:170px">')
		current_user_div.append('<div style="font-family:Papyrus;margin-top:1%;text-align:center;font-weight:bold;font-size:27px;letter-spacing:2px">'+user_name+'</div>')

		//Writing sent messages
		var sent_messages = user_data.sent_messages;
		for(receiver in sent_messages){
			if(sent_messages.hasOwnProperty(receiver)){
		        var message_list = sent_messages[receiver];
		        for(index in message_list){
					var selected_chat_box = $('#'+receiver+'chat');
			        var message_id = message_list[index].message_id;
			        var chat_message = message_list[index].message;
		       		selected_chat_box.append('<div id="'+message_id+'" style="margin-right:10px; float:right; "> <div id="'+message_id+'-message-box" style="word-wrap: break-word; background-color:#3399ff;border-radius:25px; float:right; padding-left:20px;padding-right:20px;"> <span id="'+message_id+'-message" style="color:white">'+'</span></div> <div id="'+message_id+'-single-tick" style="display:none;"> <img src="public/images/single_tick.jpg" style="height:12px;width:12px; float:right;" > </div> <div id="'+message_id+'-double-tick" style="display:none;"> <img src="public/images/double_ticks.jpg" style="height:15px;width:15px; float:right;" > </div> <div id="'+message_id+'-blue-tick" style="display:none;"> <img src="public/images/blue_ticks.jpg" style="height:15px;width:15px; float:right;" > </div></div> <br>')
			   		selected_chat_box.append('<div style="word-wrap: break-word; width:300px; background-color:white;"> <span style="color:white;">'+chat_message+'<span></div> <br>')
			   		// selected_chat_box.append('<div style="word-wrap: break-word; width:300px; background-color:#f2effb; border-radius:25px; padding-left:20px;padding-right:20px;"> '+chat_message+'</div> <br>')
					var box_width = chat_message.length*10;
					if(box_width > 300){
						box_width = 300;
					}
					$('#'+message_id+'-message-box').width(box_width);
					document.getElementById(message_id+'-message').innerHTML = chat_message;
					document.getElementById(message_id+'-single-tick').style.display = 'block'
					document.getElementById(message_id+'-double-tick').style.display = 'none'
					document.getElementById(message_id+'-blue-tick').style.display = 'none'
					if(selected_friend in user_seen_message_log){
						user_seen_message_log[selected_friend].push(message_id);
					}
					else{
						user_seen_message_log[selected_friend] = [message_id];
					}

					if(selected_friend in user_delivered_message_log){
						user_delivered_message_log[selected_friend].push(message_id);
					}
					else{
						user_delivered_message_log[selected_friend] = [message_id];
					}
					
					var elem = document.getElementById('chat_box');
		  			elem.scrollTop = elem.scrollHeight;
	  			}
			}
		}
		// Writing the Unread messages
		var user_messages = user_data.user_messages;
		for(sender in user_messages){
			if(user_messages.hasOwnProperty(sender)){
				var receiver = global_uuid;
		        var message_list = user_messages[sender];
		        for(index in message_list){
		        	var chat_message =  message_list[index].message;
		        	var message_id = message_list[index].message_id;
		        	var ack = {sender:sender,receiver:receiver,message_id:message_id}
					if(selected_friend == sender){
						// socket.emit('seen',ack);
					}
					else{
						// socket.emit('delivered',ack);
						document.getElementById(sender+'-new-message').style.display='block';
						document.getElementById(sender+'-new-message-reverse').style.display='none';
						$('#'+sender+'-name').css("font-weight","bold");
					}
					var selected_chat_box = $('#'+sender+'chat');

					selected_chat_box.append('<div style="margin-right:10px; float:right;"> <div style="word-wrap: break-word; background-color:white;border-radius:25px; width:300px; float:right; padding-left:20px;padding-right:20px;"> <span style="color:white">'+chat_message+'</span></div> <br>')
			   		selected_chat_box.append('<div id="'+message_id+'-incoming-message" style="word-wrap: break-word; width:300px; background-color:#f2effb; border-radius:25px; padding-left:20px;padding-right:20px;"> </div> <br>')
					var box_width = chat_message.length*10;
					if(box_width > 300){
						box_width = 300;
					}
					$('#'+message_id+'-incoming-message').width(box_width);
					document.getElementById(message_id+'-incoming-message').innerHTML = chat_message;
					var elem = document.getElementById('chat_box');
			  		elem.scrollTop = elem.scrollHeight;
		        }
		        var milliseconds = (new Date).getTime();
	        	var message_id = ""+milliseconds;
				var ack = {sender:sender,receiver:global_uuid,message_id:message_id}
			    socket.emit('delivered',ack);
			}
		}
        

	});

	socket.on('online_users_changed', function(online_users){
		for(var i = 0 ; i < user_friend_list.length ; i++){
			document.getElementById(user_friend_list[i].uuid+'-status').innerHTML = 'offline'
			document.getElementById(user_friend_list[i].uuid+'-currentChat-status').innerHTML = 'offline'
			document.getElementById(user_friend_list[i].uuid+'-greendot').style.display = 'none'
			document.getElementById(user_friend_list[i].uuid+'-currentChat-greendot').style.display = 'none'
			document.getElementById(user_friend_list[i].uuid+'-greendot-reverse').style.display = 'block'
			document.getElementById(user_friend_list[i].uuid+'-currentChat-greendot-reverse').style.display = 'block'
		}
		for(var i = 0 ; i < online_users.length ; i++){
			if(online_users[i] == global_uuid){
				continue;
			}
			document.getElementById(online_users[i]+'-status').innerHTML = 'online'
			document.getElementById(online_users[i]+'-currentChat-status').innerHTML = 'online'
			document.getElementById(online_users[i]+'-greendot').style.display = 'block'
			document.getElementById(online_users[i]+'-currentChat-greendot').style.display = 'block'
			document.getElementById(online_users[i]+'-greendot-reverse').style.display = 'none'
			document.getElementById(online_users[i]+'-currentChat-greendot-reverse').style.display = 'none'
			$('#'+online_users[i]).insertAfter('#friend_list_start');
			$('#'+online_users[i]+'-img').insertAfter('#image_list_start');
		}

	});

	socket.on('incoming_chat_message', function(message_detail){
		var sender = message_detail.sender;
        var receiver = message_detail.receiver;
        var chat_message = message_detail.message;
        var message_id = message_detail.message_id;

        var milliseconds = (new Date).getTime();
	    var ack_message_id = ""+milliseconds;
		var ack = {sender:sender,receiver:receiver,message_id:ack_message_id}
		if(selected_friend == sender){
			socket.emit('seen',ack);
		}
		else{
			socket.emit('delivered',ack);
			document.getElementById(sender+'-new-message').style.display='block';
			document.getElementById(sender+'-new-message-reverse').style.display='none';
			$('#'+sender+'-name').css("font-weight","bold");

		}
		

		var selected_chat_box = $('#'+sender+'chat');

		selected_chat_box.append('<div style="margin-right:10px; float:right;"> <div style="word-wrap: break-word; background-color:white;border-radius:25px; width:300px; float:right; padding-left:20px;padding-right:20px;"> <span style="color:white">'+chat_message+'</span></div> <br>')
   		selected_chat_box.append('<div id="'+message_id+'-incoming-message" style="word-wrap: break-word; width:300px; background-color:#f2effb; border-radius:25px; padding-left:20px;padding-right:20px;"> </div> <br>')
		var box_width = chat_message.length*10;
		if(box_width > 300){
			box_width = 300;
		}
		$('#'+message_id+'-incoming-message').width(box_width);
		document.getElementById(message_id+'-incoming-message').innerHTML = chat_message;
		var elem = document.getElementById('chat_box');
  		elem.scrollTop = elem.scrollHeight;
  		var notification = document.getElementById("notification");
		notification.autoplay = true;
	    notification.load();
	});

	socket.on('delivered', function(ack){
		apply_delivered_status(ack);
	});

	socket.on('seen', function(ack){
		apply_seen_status(ack);
		
	});

	socket.on('typing', function(typing_detail){
		if(typing_detail.typing){
			document.getElementById(typing_detail.sender+'-currentChat-status').style.display = 'none';
			document.getElementById(typing_detail.sender+'-currentChat-typing').style.display = 'block';

			document.getElementById(typing_detail.sender+'-typing').style.display = 'block'
			document.getElementById(typing_detail.sender+'-status').style.display = 'none'

		}
		else{
			document.getElementById(typing_detail.sender+'-currentChat-status').style.display = 'block';
			document.getElementById(typing_detail.sender+'-currentChat-typing').style.display = 'none';

			document.getElementById(typing_detail.sender+'-typing').style.display = 'none'
			document.getElementById(typing_detail.sender+'-status').style.display = 'block'
		}

	});


	$(document).on('submit','#chat_form',function() {
	        var chat_message = $('#message').val()
	        $('#message').val('');
	        var selected_chat_box = $('#'+selected_friend+'chat');
	        var milliseconds = (new Date).getTime();
	        var message_id = ""+milliseconds;
       		selected_chat_box.append('<div id="'+message_id+'" style="margin-right:10px; float:right; "> <div id="'+message_id+'-message-box" style="word-wrap: break-word; background-color:#3399ff;border-radius:25px; float:right; padding-left:20px;padding-right:20px;"> <span id="'+message_id+'-message" style="color:white">'+'</span></div> <div id="'+message_id+'-single-tick" style="display:none;"> <img src="public/images/single_tick.jpg" style="height:12px;width:12px; float:right;" > </div> <div id="'+message_id+'-double-tick" style="display:none;"> <img src="public/images/double_ticks.jpg" style="height:15px;width:15px; float:right;" > </div> <div id="'+message_id+'-blue-tick" style="display:none;"> <img src="public/images/blue_ticks.jpg" style="height:15px;width:15px; float:right;" > </div></div> <br>')
	   		selected_chat_box.append('<div style="word-wrap: break-word; width:300px; background-color:white;"> <span style="color:white;">'+chat_message+'<span></div> <br>')
			var box_width = chat_message.length*10;
			if(box_width > 300){
				box_width = 300;
			}
			$('#'+message_id+'-message-box').width(box_width);
			document.getElementById(message_id+'-message').innerHTML = chat_message;
			document.getElementById(message_id+'-single-tick').style.display = 'block'
			document.getElementById(message_id+'-double-tick').style.display = 'none'
			document.getElementById(message_id+'-blue-tick').style.display = 'none'
			var out_message={sender:global_uuid,receiver:selected_friend,message:chat_message,message_id:message_id};
			socket.emit('chat_message',out_message);
			if(selected_friend in user_seen_message_log){
				user_seen_message_log[selected_friend].push(message_id);
			}
			else{
				user_seen_message_log[selected_friend] = [message_id];
			}

			if(selected_friend in user_delivered_message_log){
				user_delivered_message_log[selected_friend].push(message_id);
			}
			else{
				user_delivered_message_log[selected_friend] = [message_id];
			}
			
			var elem = document.getElementById('chat_box');
  			elem.scrollTop = elem.scrollHeight;
			return false;
    });

    var typing = 0;
	var timeout = undefined;

	function timeoutFunction() {  
		typing= 0;
		var info={sender:global_uuid,receiver:selected_friend,typing:false};
		socket.emit("typing", info);
	}


	$(document).on('keypress','#chat_form',function(e) {
		if (e.which !== 13) {
		    if (typing == 0) {
				typing = 1;
				var info={sender:global_uuid,receiver:selected_friend,typing:true};
				socket.emit("typing", info);	
		    } 
		    else {
		      clearTimeout(timeout);
		      timeout= setTimeout(timeoutFunction, 2000);
		    }
		}
		else{
			clearTimeout(timeout);
			timeout = setTimeout(timeoutFunction, 0);
		}

	});


});