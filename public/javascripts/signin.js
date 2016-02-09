var socket = io();
$(document).ready(function(){
	console.log("ready")
	$("#signinform").submit(function(){
		var username=$("#username").val();
		var password=$("#pwd1").val();
		var checkbox = document.getElementById('remember').checked;
		console.log(checkbox);
		var signin_credentials = {username:username,password:password,remember:checkbox};
		socket.emit('signin_credentials', signin_credentials);
		console.log("signin msg emitted");
		event.preventDefault();
	});

	socket.on('signin_result', function(signin_result){

		console.log(signin_result);
		if(signin_result.success == 1)
		{
			window.open("/mainpage?id="+signin_result.uuid,"_self");
		}

	});
});