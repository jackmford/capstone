// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const crypto = require('crypto-js');
const functions = require('firebase-functions');
let fetch = require('node-fetch');
const {WebhookClient} = require('dialogflow-fulfillment', 'dialogflow-webhook');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {dialogflow, SignIn} = require('actions-on-google');
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
const admin = require('firebase-admin');
admin.initializeApp({
credential: admin.credential.applicationDefault(),
databaseURL: 'https://capstone-test-curwsy.firebaseio.com/',
});
var token = '';
var headers = {};
var options = {};
var fname = '';
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
		const agent = new WebhookClient({ request, response });
		console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
		console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
		console.log('Output contexts: ' + agent.outputContexts);

		function fullname(agent){
		fname = agent.parameters['number-sequence'];
		console.log(fname);
		agent.add('What can I help you with?');
		} 
		var data_request = require('request');
		function get_creds(){
		console.log("in db function");
		return new Promise((resolve, reject) => {
				var db = admin.database();
				var ref = db.ref(fname+'/token');
				ref.on('value', function(snapshot){
						token = snapshot.val();
						console.log('DB response: ' + snapshot.val());
						resolve(token);
						});
				});
		}

		function fallback(agent) {
			agent.add(`I didn't understand`);
			agent.add(`I'm sorry, can you try again?`);
		}

		function get_data(request_url){
			return new Promise((resolve, reject) => {
					var data;
					data_request(options, (error, response, body)=>{
							console.log('error', error);
							console.log('statusCode', response && response.statusCode);
							console.log('body', body);
							var JSONbig = require('json-bigint');
							data = JSONbig.parse(body);
							resolve(data);
							});
					});
		}

		async function classes(agent) {
			token = await get_creds();
			var url = 'https://canvas.instructure.com/api/v1/courses?enrollment_state=active&include[]=total_scores';
			var auth = 'Bearer '.concat(token);
			headers = {
				'Content-Type': 'application/json',
				'Authorization': auth,
			};
			options = {
url: url,
		 headers: headers,
		 method: 'GET'
			};
			var data = await get_data(url);
			var response_string = '';
			for(var i = 0; i<data.length; i++){
				response_string = response_string.concat(data[i]['name']);
				response_string = response_string.concat(', ');
				console.log(data[i]["name"]);
			}
			console.log(agent.parameters['last-name']);
			console.log(response_string);
			console.log(2);
			return agent.add('Your classes are ' + response_string);    
		}

		async function calendar(agent){
			token = await get_creds();    
			var url = 'https://canvas.instructure.com/api/v1/calendar_events';
			var auth = 'Bearer '.concat(token);
			headers = {
				'Content-Type': 'application/json',
				'Authorization': auth,
			};
			options = {
url: url,
		 headers: headers,
		 method: 'GET'
			};
			var data = await get_data(url);
			var response_string = '';

			for(var i = 0; i<data.length; i++){
				response_string = response_string.concat(data[i]['title']);
				response_string = response_string.concat(', ');
			}
			if(response_string == ''){
				return agent.add("You don't have anything for today!");
			}
			else{
				return agent.add('I found these events for today. ' + response_string);
			}
			return agent.add('I found these events for today. ' + response_string);
		}

		async function assignments(agent){
			token = await get_creds();
			var url = 'https://canvas.instructure.com/api/v1/calendar_events?type=assignment';
			var auth = 'Bearer '.concat(token);
			headers = {
				'Content-Type': 'application/json',
				'Authorization': auth,
			};
			options = {
url: url,
		 headers: headers,
		 method: 'GET'
			};
			var data = await get_data(url);
			var response_string = '';
			for(var i = 0; i<data.length; i++){
				response_string = response_string.concat(data[i]['title']);
				response_string = response_string.concat(', ');
			}
			if(response_string == ''){
				return agent.add("You don't have anything for today!");
			}
			else{
				return agent.add('I found these assignments you should look at: ' + response_string);
			}
		}

		async function assignments_for_course(agent){
			token = await get_creds();
			var url = 'https://canvas.instructure.com/api/v1/courses?enrollment_state=active';
			var auth = 'Bearer '.concat(token);
			var classname = agent.parameters['classname'].toLowerCase();
			headers = {
				'Content-Type': 'application/json',
				'Authorization': auth,
			};
			options = {
url: url,
		 headers: headers,
		 method: 'GET'
			};
			var data = await get_data(url);
			console.log(data);
			var course_id = '';
			for(var i = 0; i<data.length; i++){
				if(data[i]['name'].toLowerCase().includes(classname) || classname.includes(data[i]['name'].toLowerCase()) || classname == data[i]['name'].toLowerCase()){
					course_id = data[i]['id'].toString();
				}
			}
			console.log('in assignment courses');
			console.log(course_id);

			url = 'https://canvas.instructure.com/api/v1/courses/' + course_id + '/assignments/?bucket=upcoming';
			options = {
url: url,
		 headers: headers,
		 method: 'GET'
			};
			data = await get_data(url);
			var response_string = '';
			for(var i = 0; i<data.length; i++){
				response_string = response_string.concat(data[i]['name']);
				response_string = response_string.concat(', ');
			}
			if(response_string == ''){
				return agent.add("You don't have anything upcoming in " + classname);
			}
			else{
				return agent.add('I found these upcoming assignments. ' + response_string);
			}
		}
		async function grades_for_course(agent){
			console.log(fname);
			token = await get_creds();
			var url = 'https://canvas.instructure.com/api/v1/courses?enrollment_state=active&include[]=total_scores';
			var auth = 'Bearer '.concat(token);
			var classname = agent.parameters['classname'].toLowerCase();
			headers = {
				'Content-Type': 'application/json',
				'Authorization': auth,
			};
			options = {
url: url,
		 headers: headers,
		 method: 'GET'
			};
			var data = await get_data(url);
			console.log('Grade data: ');
			console.log(data);
			console.log(data[0]['enrollments'][0]);
			var grade = '';
			for(var i = 0; i<data.length; i++){
				if(data[i]['name'].toLowerCase().includes(classname) || classname.includes(data[i]['name'].toLowerCase()) || classname == data[i]['name'].toLowerCase()){
					grade = data[i]['enrollments'][0]['computed_current_score'];
				}
			}
			console.log(grade);
			if(grade == null){
				return agent.add('There is no retrievable grade for that course. This my be due to pass/fail options.');
			}
			else{
				return agent.add('You currently have a ' + grade + ' percent');
			}
		}
		async function announcements(agent){
			token = await get_creds();
			var url = 'https://canvas.instructure.com/api/v1/courses?enrollment_state=active';
			var auth = 'Bearer '.concat(token);
			var classname = agent.parameters['classname'].toLowerCase();
			headers = {
				'Content-Type': 'application/json',
				'Authorization': auth,
			};
			options = {
url: url,
		 headers: headers,
		 method: 'GET'
			};
			var data = await get_data(url);
			console.log(data);
			var course_id;
			for(var i = 0; i<data.length; i++){
				if(data[i]['name'].toLowerCase().includes(classname) || classname.includes(data[i]['name'].toLowerCase()) || classname == data[i]['name'].toLowerCase()){
					console.log(data[i].id.toString());
					course_id = data[i].id.toString();
				}
			}
			var d = new Date();
			var today = d.toLocaleDateString('en-US').toString();
			var dmy = today.split('/');
			if(dmy[0] < 10){
				dmy[0] = '0' + dmy[0];
			}
			if(dmy[1] < 10){
				dmy[1] = '0' + dmy[1];
			}

			today = dmy[2] + '-' + dmy[0] + '-' + dmy[1];
			dmy[1] = Number(dmy[1])+1;
			if(dmy[1] < 10){
				dmy[1] = '0' + dmy[1];
			}
			var tomorrow = (dmy[2] + '-' + dmy[0] + '-' + dmy[1]);

			console.log(tomorrow);
			console.log(today);
			url = 'https://canvas.instructure.com/api/v1/announcements?start_date=' + today + '&end_date=' + tomorrow + 
				'&context_codes[]=course_' + course_id;
			console.log(url);
			options = {
url: url,
		 headers: headers,
		 method: 'GET'
			};
			data = await get_data(url);
			var response_string = '';
			for(var i = 0; i<data.length; i++){
				response_string = response_string.concat(data[i]['name']);
				response_string = response_string.concat(', ');
			}
			if(response_string == ''){
				return agent.add("You don't have announcements for " + classname);
			}
			else{
				return agent.add('I found these announcements: ' + response_string);
			}
		}


		// Run the proper function handler based on the matched Dialogflow intent name
		let intentMap = new Map();
		intentMap.set('Default Fallback Intent', fallback);
		intentMap.set('classes', classes);
		intentMap.set('calendar', calendar);
		intentMap.set('assignments', assignments);
		intentMap.set('fullName', fullname);
		intentMap.set('course_assignments', assignments_for_course);
		intentMap.set('course-grades', grades_for_course);
		intentMap.set('announcements', announcements);
		agent.handleRequest(intentMap);
});

