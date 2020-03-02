#import firebase_admin
from flask import Flask
#from firebase_admin import credentials, db
app = Flask(__name__)

@app.route('/')
def hello_world():
    #cred = credentials.Certificate("serviceAccountKey.json")
    #firebase_admin.initialize_app(cred, {
        #'databaseURL' : 'https://capstone-test-curwsy.firebaseio.com/'
    #})
    #root = db.reference()
    #print(root.child('users').get()['jack'])
    print('testing')
    return 'hello'
