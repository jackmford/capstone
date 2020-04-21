import os
from flask import abort, Flask, json, redirect,\
    render_template, request, Response, url_for, session, jsonify
import firebase_admin
from firebase_admin import credentials, db


app = Flask(__name__)
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
	'databaseURL':'https://capstone-test-curwsy.firebaseio.com/'
})
root=db.reference()

def send_db(identifier, token):
		#print(root.get()['jackf'])
		print(root.child(identifier).set({'token' : token}))

@app.route('/', methods=['POST', 'GET'])
def hello_world():
  	print('testing')
  	return render_template('index.html')

@app.route('/db', methods=['POST', 'GET'])
def db():
		identifier = request.form.get('id')
		token = request.form.get('token')
		print(request.form.get('id'))
		print(request.form.get('token'))
		send_db(identifier, token)
		return 'Thanks for signing up!'
