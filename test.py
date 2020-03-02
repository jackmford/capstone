import firebase_admin
from firebase_admin import credentials, db

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
            'databaseURL' : 'https://capstone-test-curwsy.firebaseio.com/'
})
#firebase_admin.initialize_app(cred)
root = db.reference()
print(root.child('users').get()['jack'])
