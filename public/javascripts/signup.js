var socket = io();
$(document).ready(function(){
	console.log("ready")
	$("#signupform").submit(function(){
		console.log("ghjhgjh")
		var first=$("#first").val();
		var last=$('#second').val();
		var username = $('#username').val();
		var email_id=$("#email").val();
		var create_password=$("#createPass").val();
		var confirm_password=$("#confirmPass").val();

		if(create_password===confirm_password)
		{
			var signup_credentials = {username:username,email:email_id,password:create_password,firstname:first,lastname:last};
			socket.emit('signup_credentials', signup_credentials);
			console.log("msg emitted");
			document.getElementById("error_msg").style.display='none';

		}
		else
		{
			document.getElementById("error_msg").style.display='block';
		}
		event.preventDefault();
	});

	socket.on('signup_result', function(signup_result){
		if(signup_result.success==1)
		{
			openURL(3);
		}
		
	});
});